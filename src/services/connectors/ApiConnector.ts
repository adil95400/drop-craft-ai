import { BaseConnector, FetchOptions, SyncResult } from './BaseConnector';
import { SupplierCredentials, SupplierProduct } from '@/types/suppliers';

export class ApiConnector extends BaseConnector {
  constructor(supplierName: string, credentials: SupplierCredentials, baseURL: string) {
    super(credentials, baseURL);
  }

  protected getSupplierName(): string {
    return 'Generic API Connector';
  }

  protected getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Wise2Sync-Connector/1.0'
    };

    if (this.credentials.apiKey) {
      headers['Authorization'] = `Bearer ${this.credentials.apiKey}`;
    } else if (this.credentials.accessToken) {
      headers['Authorization'] = `Bearer ${this.credentials.accessToken}`;
    }

    return headers;
  }

  async validateCredentials(): Promise<boolean> {
    try {
      // Test endpoint générique - à override pour chaque fournisseur
      const response = await this.makeRequest('/health');
      return true;
    } catch (error) {
      console.log('Connection test failed', error);
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const params = new URLSearchParams();
      
      if (options.limit) params.set('limit', options.limit.toString());
      if (options.page) params.set('page', options.page.toString());
      if (options.category) params.set('category', options.category);
      if (options.lastSync) params.set('updated_since', options.lastSync.toISOString());

      const response = await this.makeRequest(`/products?${params}`);

      const products = Array.isArray(response) ? response : response.products || response.data || [];
      return products.map((rawProduct: any) => this.transformProduct(rawProduct));
    } catch (error) {
      this.handleError(error, 'fetchProducts');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest(`/products/${sku}`);
      if (!response) return null;

      return this.transformProduct(response);
    } catch (error) {
      console.log('Failed to get product', error);
      return null;
    }
  }

  async updateInventory(products: SupplierProduct[]): Promise<SyncResult> {
    // Implementation for inventory updates
    return {
      total: products.length,
      imported: 0,
      duplicates: 0,
      errors: products.length > 0 ? ['Generic API connector does not support inventory updates'] : [],
    };
  }

  private transformProduct(rawData: any): SupplierProduct {
    const baseProduct = this.normalizeProduct(rawData);
    
    return {
      ...baseProduct,
      id: rawData.id || rawData.external_id || rawData.sku,
      sku: rawData.sku || rawData.id,
      title: rawData.name || rawData.title,
      description: rawData.description || '',
      price: parseFloat(rawData.price) || 0,
      costPrice: parseFloat(rawData.cost_price || rawData.wholesale_price) || undefined,
      currency: rawData.currency || 'EUR',
      stock: parseInt(rawData.stock || rawData.quantity) || 0,
      images: Array.isArray(rawData.images) ? rawData.images : [rawData.image].filter(Boolean),
      category: rawData.category || 'General',
      brand: rawData.brand || '',
      attributes: rawData.attributes || {},
      supplier: {
        id: 'generic-api',
        name: 'Generic API',
        sku: rawData.sku || rawData.id,
      },
    };
  }
}