import { BaseConnector, FetchOptions, SupplierProduct, SyncResult } from './BaseConnector';

export class ZalandoConnector extends BaseConnector {
  constructor(credentials: any) {
    super(credentials, 'https://api.zalando.com');
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.access_token}`,
      'Content-Type': 'application/json',
    };
  }

  protected getSupplierName(): string {
    return 'Zalando Partner';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/partner/products');
      return !!response;
    } catch (error) {
      this.handleError(error, 'credential validation');
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const response = await this.makeRequest('/partner/products');
      
      const items = response.content || [];
      return items.map((item: any) => this.normalizeZalandoProduct(item));
    } catch (error) {
      this.handleError(error, 'product fetching');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest(`/partner/products/${sku}`);
      
      if (!response) return null;
      
      return this.normalizeZalandoProduct(response);
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
      errors: ['Zalando Partner - products managed through partner portal']
    };

    return result;
  }

  private normalizeZalandoProduct(zalandoProduct: any): SupplierProduct {
    return {
      id: zalandoProduct.sku || zalandoProduct.id,
      sku: zalandoProduct.sku || zalandoProduct.id,
      title: zalandoProduct.name || 'Produit Zalando',
      description: zalandoProduct.description || '',
      price: parseFloat(zalandoProduct.price?.amount) || 0,
      costPrice: undefined,
      currency: zalandoProduct.price?.currency || 'EUR',
      stock: parseInt(zalandoProduct.stock?.quantity) || 0,
      images: zalandoProduct.media?.map((m: any) => m.url) || [],
      category: zalandoProduct.category?.name || 'General',
      brand: zalandoProduct.brand?.name || '',
      supplier: {
        id: 'zalando',
        name: 'Zalando Partner',
        sku: zalandoProduct.sku || zalandoProduct.id
      },
      attributes: {
        zalandoId: zalandoProduct.id,
        season: zalandoProduct.season,
        gender: zalandoProduct.gender,
        ageGroup: zalandoProduct.age_group
      }
    };
  }
}