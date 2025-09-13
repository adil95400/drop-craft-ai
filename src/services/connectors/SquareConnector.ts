import { BaseConnector, FetchOptions, SupplierProduct, SyncResult } from './BaseConnector';

export class SquareConnector extends BaseConnector {
  constructor(credentials: any) {
    const environment = credentials.environment || 'sandbox';
    const baseUrl = environment === 'production' 
      ? 'https://connect.squareup.com/v2' 
      : 'https://connect.squareupsandbox.com/v2';
    super(credentials, baseUrl);
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.access_token}`,
      'Square-Version': '2023-10-18',
    };
  }

  protected getSupplierName(): string {
    return 'Square';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/locations');
      return !!response.locations && response.locations.length > 0;
    } catch (error) {
      this.handleError(error, 'credential validation');
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const limit = Math.min(options.limit || 50, 1000);
      const params = new URLSearchParams({
        limit: limit.toString(),
        include_related_objects: 'true'
      });

      const response = await this.makeRequest(`/catalog/list?${params}`);
      
      const items = response.objects?.filter((obj: any) => obj.type === 'ITEM') || [];
      return items.map((item: any) => this.normalizeSquareProduct(item, response.related_objects));
    } catch (error) {
      this.handleError(error, 'product fetching');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest(`/catalog/search`, {
        method: 'POST',
        body: JSON.stringify({
          object_types: ['ITEM'],
          query: {
            text_query: {
              keywords: [sku]
            }
          }
        })
      });
      
      const item = response.objects?.[0];
      if (!item) return null;
      
      return this.normalizeSquareProduct(item, response.related_objects);
    } catch (error) {
      this.handleError(error, 'single product fetching');
      return null;
    }
  }

  async updateInventory(products: SupplierProduct[]): Promise<SyncResult> {
    const result: SyncResult = {
      total: products.length,
      imported: 0,
      duplicates: 0,
      errors: []
    };

    for (const product of products) {
      try {
        await this.delay();
        
        const existingProduct = await this.fetchProduct(product.sku);
        
        if (existingProduct) {
          result.duplicates++;
          continue;
        }

        await this.createSquareItem(product);
        result.imported++;
      } catch (error: any) {
        result.errors.push(`Erreur pour ${product.sku}: ${error.message}`);
      }
    }

    return result;
  }

  private normalizeSquareProduct(item: any, relatedObjects: any[] = []): SupplierProduct {
    const itemData = item.item_data || {};
    const variation = itemData.variations?.[0]?.item_variation_data || {};
    const price = variation.price_money?.amount ? variation.price_money.amount / 100 : 0;
    
    return {
      id: item.id,
      sku: variation.sku || item.id,
      title: itemData.name || 'Produit Square',
      description: itemData.description || '',
      price: price,
      costPrice: undefined,
      currency: variation.price_money?.currency || 'USD',
      stock: 0, // Square inventory requires separate API call
      images: itemData.image_ids?.map((imgId: string) => {
        const imgObj = relatedObjects?.find(obj => obj.id === imgId);
        return imgObj?.image_data?.url;
      }).filter(Boolean) || [],
      category: itemData.category_id || 'General',
      brand: '',
      supplier: {
        id: 'square',
        name: 'Square',
        sku: variation.sku || item.id
      },
      attributes: {
        abbreviation: itemData.abbreviation,
        label_color: itemData.label_color,
        available_online: itemData.available_online,
        available_for_pickup: itemData.available_for_pickup
      }
    };
  }

  private async createSquareItem(product: SupplierProduct): Promise<void> {
    const squareItem = {
      type: 'ITEM',
      id: `#${product.sku}`,
      item_data: {
        name: product.title,
        description: product.description,
        abbreviation: product.sku.substring(0, 24), // Square limit
        variations: [{
          type: 'ITEM_VARIATION',
          id: `#${product.sku}-variation`,
          item_variation_data: {
            name: 'Regular',
            sku: product.sku,
            price_money: {
              amount: Math.round(product.price * 100), // Convert to cents
              currency: product.currency
            }
          }
        }]
      }
    };

    await this.makeRequest('/catalog/object', {
      method: 'POST',
      body: JSON.stringify({
        idempotency_key: `${Date.now()}-${product.sku}`,
        object: squareItem
      })
    });
  }
}