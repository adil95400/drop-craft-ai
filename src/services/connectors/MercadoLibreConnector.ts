import { BaseConnector, FetchOptions, SupplierProduct, SyncResult } from './BaseConnector';

export class MercadoLibreConnector extends BaseConnector {
  constructor(credentials: any) {
    super(credentials, 'https://api.mercadolibre.com');
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.access_token}`,
      'Content-Type': 'application/json',
    };
  }

  protected getSupplierName(): string {
    return 'MercadoLibre';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/users/me');
      return !!response.id;
    } catch (error) {
      this.handleError(error, 'credential validation');
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const userId = this.credentials.user_id;
      const response = await this.makeRequest(`/users/${userId}/items/search`);
      
      const items = response.results || [];
      const products = await Promise.all(
        items.map(async (itemId: string) => {
          const itemResponse = await this.makeRequest(`/items/${itemId}`);
          return this.normalizeMercadoLibreProduct(itemResponse);
        })
      );
      
      return products;
    } catch (error) {
      this.handleError(error, 'product fetching');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest(`/items/${sku}`);
      
      if (!response.id) return null;
      
      return this.normalizeMercadoLibreProduct(response);
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
        await this.makeRequest(`/items/${product.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            available_quantity: product.stock,
            price: product.price
          })
        });
        result.imported++;
      } catch (error) {
        result.errors.push(`Failed to update ${product.sku}: ${error}`);
      }
    }

    return result;
  }

  private normalizeMercadoLibreProduct(mlProduct: any): SupplierProduct {
    return {
      id: mlProduct.id,
      sku: mlProduct.seller_custom_field || mlProduct.id,
      title: mlProduct.title || 'Producto MercadoLibre',
      description: mlProduct.description?.plain_text || '',
      price: parseFloat(mlProduct.price) || 0,
      costPrice: undefined,
      currency: mlProduct.currency_id || 'ARS',
      stock: parseInt(mlProduct.available_quantity) || 0,
      images: mlProduct.pictures?.map((p: any) => p.url) || [],
      category: mlProduct.category_id || 'General',
      brand: mlProduct.attributes?.find((a: any) => a.id === 'BRAND')?.value_name || '',
      supplier: {
        id: 'mercadolibre',
        name: 'MercadoLibre',
        sku: mlProduct.seller_custom_field || mlProduct.id
      },
      attributes: {
        mlId: mlProduct.id,
        condition: mlProduct.condition,
        listingType: mlProduct.listing_type_id,
        categoryId: mlProduct.category_id
      }
    };
  }
}