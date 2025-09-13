import { BaseConnector, FetchOptions, SupplierProduct, SyncResult } from './BaseConnector';

export class WixConnector extends BaseConnector {
  constructor(credentials: any) {
    super(credentials, 'https://www.wixapis.com/stores/v1');
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.access_token}`,
    };
  }

  protected getSupplierName(): string {
    return 'Wix';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/products/query', {
        method: 'POST',
        body: JSON.stringify({
          query: {
            paging: { limit: 1 }
          }
        })
      });
      return !!response.products;
    } catch (error) {
      this.handleError(error, 'credential validation');
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const limit = Math.min(options.limit || 50, 100);
      const response = await this.makeRequest('/products/query', {
        method: 'POST',
        body: JSON.stringify({
          query: {
            paging: { 
              limit: limit,
              offset: ((options.page || 1) - 1) * limit 
            }
          }
        })
      });
      
      return response.products.map((product: any) => this.normalizeWixProduct(product));
    } catch (error) {
      this.handleError(error, 'product fetching');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest('/products/query', {
        method: 'POST',
        body: JSON.stringify({
          query: {
            filter: {
              sku: { $eq: sku }
            }
          }
        })
      });
      
      const product = response.products[0];
      if (!product) return null;
      
      return this.normalizeWixProduct(product);
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

        await this.createWixProduct(product);
        result.imported++;
      } catch (error: any) {
        result.errors.push(`Erreur pour ${product.sku}: ${error.message}`);
      }
    }

    return result;
  }

  private normalizeWixProduct(wixProduct: any): SupplierProduct {
    const productOptions = wixProduct.productOptions || {};
    const variant = productOptions.variants?.[0] || {};
    const choice = variant.choices?.[0] || {};
    
    return {
      id: wixProduct._id,
      sku: wixProduct.sku || choice.sku || wixProduct._id,
      title: wixProduct.name,
      description: wixProduct.description || '',
      price: parseFloat(wixProduct.price?.price || choice.variant?.price?.price) || 0,
      costPrice: parseFloat(wixProduct.costPrice || choice.variant?.costPrice) || undefined,
      currency: wixProduct.price?.currency || 'USD',
      stock: wixProduct.stock?.quantity || choice.variant?.stock?.quantity || 0,
      images: wixProduct.media?.items?.map((media: any) => media.image?.url).filter(Boolean) || [],
      category: wixProduct.collections?.[0] || 'General',
      brand: wixProduct.brand || '',
      supplier: {
        id: 'wix',
        name: 'Wix',
        sku: wixProduct.sku || choice.sku || wixProduct._id
      },
      attributes: {
        weight: wixProduct.weight,
        dimensions: wixProduct.dimensions,
        visible: wixProduct.visible,
        collections: wixProduct.collections || []
      }
    };
  }

  private async createWixProduct(product: SupplierProduct): Promise<void> {
    const wixProduct = {
      name: product.title,
      description: product.description,
      sku: product.sku,
      visible: true,
      price: {
        currency: product.currency,
        price: product.price.toString()
      },
      stock: {
        trackQuantity: true,
        quantity: product.stock
      },
      media: {
        items: product.images.map(url => ({
          image: { url }
        }))
      }
    };

    await this.makeRequest('/products', {
      method: 'POST',
      body: JSON.stringify({ product: wixProduct })
    });
  }
}