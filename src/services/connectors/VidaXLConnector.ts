import { BaseConnector, FetchOptions, SyncResult } from './BaseConnector';
import { SupplierCredentials, SupplierProduct } from '@/types/suppliers';

interface VidaXLProduct {
  id: string;
  sku: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
  images: string[];
  category: string;
  brand?: string;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    weight: number;
  };
  attributes: Record<string, any>;
}

export class VidaXLConnector extends BaseConnector {
  constructor(credentials: SupplierCredentials) {
    super(credentials, 'https://api.vidaxl.com/v1');
    this.rateLimitDelay = 2000; // VidaXL rate limit: 30 requests/minute
  }

  protected getSupplierName(): string {
    return 'VidaXL';
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.apiKey}`,
    };
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/auth/validate');
      return response.valid === true;
    } catch (error) {
      console.error('VidaXL credential validation failed:', error);
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const params = new URLSearchParams({
        page: (options.page || 1).toString(),
        limit: Math.min(options.limit || 50, 100).toString(),
      });

      if (options.category) {
        params.append('category', options.category);
      }

      if (options.lastSync) {
        params.append('updated_after', options.lastSync.toISOString());
      }

      const response = await this.makeRequest(`/products?${params}`);
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format from VidaXL API');
      }

      return response.data.map((product: VidaXLProduct) => this.transformProduct(product));
    } catch (error) {
      this.handleError(error, 'fetchProducts');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest(`/products/${encodeURIComponent(sku)}`);
      
      if (!response.data) {
        return null;
      }

      return this.transformProduct(response.data);
    } catch (error) {
      console.error(`Failed to fetch product ${sku}:`, error);
      return null;
    }
  }

  async updateInventory(products: SupplierProduct[]): Promise<SyncResult> {
    try {
      const skus = products.map(p => p.sku);
      const response = await this.makeRequest('/inventory/batch', {
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
      console.error('Error updating VidaXL inventory:', error);
      return {
        total: products.length,
        imported: 0,
        duplicates: 0,
        errors: [error.message],
      };
    }
  }

  async createOrder(order: any): Promise<string> {
    try {
      const response = await this.makeRequest('/orders', {
        method: 'POST',
        body: JSON.stringify(order),
      });
      
      if (!response.order_id) {
        throw new Error('Failed to create order with VidaXL');
      }

      return response.order_id;
    } catch (error) {
      console.error('Error creating VidaXL order:', error);
      throw error;
    }
  }

  async getOrderStatus(orderId: string): Promise<string> {
    try {
      const response = await this.makeRequest(`/orders/${orderId}`);
      
      return response.status || 'unknown';
    } catch (error) {
      console.error('Error getting VidaXL order status:', error);
      throw error;
    }
  }

  protected transformProduct(rawProduct: VidaXLProduct): SupplierProduct {
    return {
      id: rawProduct.id,
      sku: rawProduct.sku,
      title: rawProduct.title,
      description: rawProduct.description,
      price: rawProduct.price,
      costPrice: rawProduct.price * 0.7, // Estimated cost price for wholesale
      currency: rawProduct.currency,
      stock: rawProduct.stock,
      images: rawProduct.images,
      category: rawProduct.category,
      brand: rawProduct.brand,
      weight: rawProduct.dimensions?.weight,
      dimensions: rawProduct.dimensions ? {
        length: rawProduct.dimensions.length,
        width: rawProduct.dimensions.width,
        height: rawProduct.dimensions.height,
      } : undefined,
      attributes: rawProduct.attributes,
      supplier: {
        id: 'vidaxl',
        name: 'VidaXL',
        sku: rawProduct.sku,
      },
    };
  }
}