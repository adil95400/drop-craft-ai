import { BaseConnector, FetchOptions, SyncResult } from './BaseConnector';
import { SupplierCredentials, SupplierProduct } from '@/types/suppliers';

interface SynceeProduct {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
  images: string[];
  category: string;
  brand?: string;
  attributes: Record<string, any>;
  supplier: {
    id: string;
    name: string;
    country: string;
  };
}

export class SynceeConnector extends BaseConnector {
  constructor(credentials: SupplierCredentials) {
    super(credentials, 'https://api.syncee.com/v1');
    this.rateLimitDelay = 1000; // Syncee rate limit: 60 requests/minute
  }

  protected getSupplierName(): string {
    return 'Syncee';
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.apiKey}`,
    };
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/user/profile');
      return response.success === true;
    } catch (error) {
      console.error('Syncee credential validation failed:', error);
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const params = new URLSearchParams({
        page: (options.page || 1).toString(),
        limit: Math.min(options.limit || 100, 100).toString(),
      });

      if (options.category) {
        params.append('category', options.category);
      }

      if (options.lastSync) {
        params.append('updated_since', options.lastSync.toISOString());
      }

      const response = await this.makeRequest(`/products?${params}`);
      
      if (!response.products || !Array.isArray(response.products)) {
        throw new Error('Invalid response format from Syncee API');
      }

      return response.products.map((product: SynceeProduct) => this.transformProduct(product));
    } catch (error) {
      this.handleError(error, 'fetchProducts');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest(`/products/${encodeURIComponent(sku)}`);
      
      if (!response.product) {
        return null;
      }

      return this.transformProduct(response.product);
    } catch (error) {
      console.error(`Failed to fetch product ${sku}:`, error);
      return null;
    }
  }

  async updateInventory(products: SupplierProduct[]): Promise<SyncResult> {
    try {
      const skus = products.map(p => p.sku);
      const response = await this.makeRequest('/inventory', {
        method: 'POST',
        body: JSON.stringify({ skus }),
      });
      
      return {
        total: products.length,
        imported: response.updated?.length || 0,
        duplicates: 0,
        errors: response.errors || [],
      };
    } catch (error) {
      console.error('Error updating Syncee inventory:', error);
      return {
        total: products.length,
        imported: 0,
        duplicates: 0,
        errors: [error.message],
      };
    }
  }

  protected transformProduct(rawProduct: SynceeProduct): SupplierProduct {
    return {
      id: rawProduct.id,
      sku: rawProduct.sku,
      title: rawProduct.name,
      description: rawProduct.description,
      price: rawProduct.price,
      costPrice: rawProduct.price * 0.8, // Estimated cost price for B2B
      currency: rawProduct.currency,
      stock: rawProduct.stock,
      images: rawProduct.images,
      category: rawProduct.category,
      brand: rawProduct.brand,
      attributes: {
        ...rawProduct.attributes,
        supplier_country: rawProduct.supplier.country,
      },
      supplier: {
        id: 'syncee',
        name: 'Syncee',
        sku: rawProduct.sku,
      },
    };
  }
}