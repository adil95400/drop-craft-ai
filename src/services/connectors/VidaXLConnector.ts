import { BaseConnector } from './BaseConnector';
import { SupplierProduct, SupplierCredentials } from '@/types/suppliers';

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
  brand: string;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  attributes: Record<string, any>;
  ean?: string;
  delivery_time: string;
  minimum_order_quantity: number;
  wholesale_price?: number;
}

export class VidaXLConnector extends BaseConnector {
  constructor(credentials: SupplierCredentials) {
    super(credentials, 'https://api.vidaxl.com/v1');
    this.rateLimitDelay = 2000; // 30 requests per minute
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
      await this.makeRequest('/auth/validate');
      return true;
    } catch (error) {
      console.error('VidaXL credential validation failed:', error);
      return false;
    }
  }

  async fetchProducts(options?: {
    page?: number;
    limit?: number;
    lastSync?: Date;
    category?: string;
  }): Promise<SupplierProduct[]> {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 50, 200);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(options?.category && { category: options.category }),
        ...(options?.lastSync && { modified_after: options.lastSync.toISOString() }),
      });

      const data = await this.makeRequest(`/products?${params}`);
      
      if (!data.products || !Array.isArray(data.products)) {
        throw new Error('Invalid response format from VidaXL API');
      }

      return data.products.map((product: VidaXLProduct) => 
        this.transformProduct(product)
      );
    } catch (error) {
      console.error('Error fetching VidaXL products:', error);
      throw error;
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const data = await this.makeRequest(`/products/${sku}`);
      
      if (!data.product) {
        return null;
      }

      return this.transformProduct(data.product);
    } catch (error) {
      console.error('Error fetching VidaXL product:', error);
      return null;
    }
  }

  async updateInventory(products: SupplierProduct[]): Promise<import('./BaseConnector').SyncResult> {
    try {
      const skus = products.map(p => p.sku);
      const data = await this.makeRequest('/inventory', {
        method: 'POST',
        body: JSON.stringify({ skus }),
      });
      
      if (!data.inventory || !Array.isArray(data.inventory)) {
        throw new Error('Invalid inventory response from VidaXL API');
      }

      return {
        total: products.length,
        imported: data.inventory?.length || 0,
        duplicates: 0,
        errors: [],
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
      const data = await this.makeRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: order.line_items,
          shipping_address: order.shipping_address,
          notes: order.customer_note,
        }),
      });
      
      if (!data.order_id) {
        throw new Error('Failed to create order with VidaXL');
      }

      return data.order_id;
    } catch (error) {
      console.error('Error creating VidaXL order:', error);
      throw error;
    }
  }

  async getOrderStatus(orderId: string): Promise<string> {
    try {
      const data = await this.makeRequest(`/orders/${orderId}`);
      
      if (!data.order) {
        throw new Error('Failed to get order status from VidaXL');
      }

      return data.order.status || 'unknown';
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
      costPrice: rawProduct.wholesale_price || rawProduct.price * 0.6,
      currency: rawProduct.currency,
      stock: rawProduct.stock,
      images: rawProduct.images,
      category: rawProduct.category,
      brand: rawProduct.brand,
      weight: rawProduct.weight,
      dimensions: rawProduct.dimensions,
      attributes: {
        ...rawProduct.attributes,
        ean: rawProduct.ean,
        delivery_time: rawProduct.delivery_time,
        minimum_order_quantity: rawProduct.minimum_order_quantity,
        wholesale_price: rawProduct.wholesale_price,
      },
      supplier: {
        id: 'vidaxl',
        name: 'VidaXL',
        sku: rawProduct.sku,
      },
    };
  }
}