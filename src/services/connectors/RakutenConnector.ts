import { BaseConnector, FetchOptions, SupplierProduct, SyncResult } from './BaseConnector';

export class RakutenConnector extends BaseConnector {
  constructor(credentials: any) {
    super(credentials, 'https://api.rakuten.fr');
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.access_token}`,
      'Content-Type': 'application/json',
    };
  }

  protected getSupplierName(): string {
    return 'Rakuten France';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/ws/catalog/products');
      return !!response;
    } catch (error) {
      this.handleError(error, 'credential validation');
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const response = await this.makeRequest('/ws/catalog/products');
      
      const items = response.products || [];
      return items.map((item: any) => this.normalizeRakutenProduct(item));
    } catch (error) {
      this.handleError(error, 'product fetching');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest(`/ws/catalog/products/${sku}`);
      
      if (!response.product) return null;
      
      return this.normalizeRakutenProduct(response.product);
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
      errors: ['Rakuten requires manual listing process - use Rakuten seller center']
    };

    return result;
  }

  private normalizeRakutenProduct(rakutenProduct: any): SupplierProduct {
    return {
      id: rakutenProduct.id || rakutenProduct.sku,
      sku: rakutenProduct.sku || rakutenProduct.id,
      title: rakutenProduct.title || 'Produit Rakuten',
      description: rakutenProduct.description || '',
      price: parseFloat(rakutenProduct.price) || 0,
      costPrice: undefined,
      currency: 'EUR',
      stock: parseInt(rakutenProduct.stock) || 0,
      images: rakutenProduct.images || [],
      category: rakutenProduct.category || 'General',
      brand: rakutenProduct.brand || '',
      supplier: {
        id: 'rakuten',
        name: 'Rakuten France',
        sku: rakutenProduct.sku || rakutenProduct.id
      },
      attributes: {
        rakutenId: rakutenProduct.id,
        commission: rakutenProduct.commission
      }
    };
  }
}