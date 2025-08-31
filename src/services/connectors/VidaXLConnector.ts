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
  private baseUrl = 'https://api.vidaxl.com/v1';

  constructor(credentials: SupplierCredentials) {
    super(credentials);
    this.rateLimitDelay = 2000; // 30 requests per minute
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest(`${this.baseUrl}/auth/validate`, {
        headers: {
          'Authorization': `Bearer ${this.credentials.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.status === 200;
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

      const response = await this.makeRequest(`${this.baseUrl}/products?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.credentials.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
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
      const response = await this.makeRequest(`${this.baseUrl}/products/${sku}`, {
        headers: {
          'Authorization': `Bearer ${this.credentials.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!data.product) {
        return null;
      }

      return this.transformProduct(data.product);
    } catch (error) {
      console.error('Error fetching VidaXL product:', error);
      return null;
    }
  }

  async fetchInventory(skus: string[]): Promise<Array<{sku: string, stock: number}>> {
    try {
      const response = await this.makeRequest(`${this.baseUrl}/inventory`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.credentials.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skus }),
      });

      const data = await response.json();
      
      if (!data.inventory || !Array.isArray(data.inventory)) {
        throw new Error('Invalid inventory response from VidaXL API');
      }

      return data.inventory.map((item: any) => ({
        sku: item.sku,
        stock: item.available_stock || 0,
      }));
    } catch (error) {
      console.error('Error fetching VidaXL inventory:', error);
      throw error;
    }
  }

  async createOrder(order: any): Promise<string> {
    try {
      const response = await this.makeRequest(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.credentials.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: order.line_items,
          shipping_address: order.shipping_address,
          notes: order.customer_note,
        }),
      });

      const data = await response.json();
      
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
      const response = await this.makeRequest(`${this.baseUrl}/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${this.credentials.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
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