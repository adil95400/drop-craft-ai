import { BaseConnector } from './BaseConnector';
import { SupplierProduct, SupplierCredentials } from '@/types/suppliers';

interface EproloProduct {
  id: string;
  sku: string;
  title: string;
  description: string;
  price: number;
  compare_at_price?: number;
  currency: string;
  stock: number;
  images: string[];
  category: string;
  brand?: string;
  attributes: Record<string, any>;
  variants?: Array<{
    id: string;
    sku: string;
    title: string;
    price: number;
    stock: number;
    attributes: Record<string, string>;
  }>;
  shipping: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    cost: number;
    time: string;
  };
}

export class EproloConnector extends BaseConnector {
  private baseUrl = 'https://api.eprolo.com/v1';

  constructor(credentials: SupplierCredentials) {
    super(credentials);
    this.rateLimitDelay = 500; // 2 requests per second
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest(`${this.baseUrl}/account/info`, {
        headers: {
          'Authorization': `Bearer ${this.credentials.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.status === 200;
    } catch (error) {
      console.error('Eprolo credential validation failed:', error);
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
    const limit = Math.min(options?.limit || 50, 100);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(options?.category && { category: options.category }),
        ...(options?.lastSync && { updated_since: options.lastSync.toISOString() }),
      });

      const response = await this.makeRequest(`${this.baseUrl}/products?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.credentials.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!data.success || !data.data?.products) {
        throw new Error('Invalid response format from Eprolo API');
      }

      return data.data.products.map((product: EproloProduct) => 
        this.transformProduct(product)
      );
    } catch (error) {
      console.error('Error fetching Eprolo products:', error);
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
      
      if (!data.success || !data.data) {
        return null;
      }

      return this.transformProduct(data.data);
    } catch (error) {
      console.error('Error fetching Eprolo product:', error);
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
      
      if (!data.success || !data.data) {
        throw new Error('Invalid inventory response from Eprolo API');
      }

      return data.data.map((item: any) => ({
        sku: item.sku,
        stock: item.available_quantity || 0,
      }));
    } catch (error) {
      console.error('Error fetching Eprolo inventory:', error);
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
          line_items: order.line_items,
          shipping_address: order.shipping_address,
          billing_address: order.billing_address,
          customer_note: order.customer_note,
        }),
      });

      const data = await response.json();
      
      if (!data.success || !data.data?.order_id) {
        throw new Error('Failed to create order with Eprolo');
      }

      return data.data.order_id;
    } catch (error) {
      console.error('Error creating Eprolo order:', error);
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
      
      if (!data.success || !data.data) {
        throw new Error('Failed to get order status from Eprolo');
      }

      return data.data.status || 'unknown';
    } catch (error) {
      console.error('Error getting Eprolo order status:', error);
      throw error;
    }
  }

  protected transformProduct(rawProduct: EproloProduct): SupplierProduct {
    return {
      id: rawProduct.id,
      sku: rawProduct.sku,
      title: rawProduct.title,
      description: rawProduct.description,
      price: rawProduct.price,
      costPrice: rawProduct.price * 0.6, // Estimated cost price
      currency: rawProduct.currency,
      stock: rawProduct.stock,
      images: rawProduct.images,
      category: rawProduct.category,
      brand: rawProduct.brand,
      weight: rawProduct.shipping?.weight,
      dimensions: rawProduct.shipping?.dimensions,
      variants: rawProduct.variants?.map(v => ({
        id: v.id,
        sku: v.sku,
        title: v.title,
        price: v.price,
        costPrice: v.price * 0.6,
        stock: v.stock,
        attributes: v.attributes,
      })),
      attributes: {
        ...rawProduct.attributes,
        shipping_cost: rawProduct.shipping?.cost,
        shipping_time: rawProduct.shipping?.time,
        compare_at_price: rawProduct.compare_at_price,
      },
      supplier: {
        id: 'eprolo',
        name: 'Eprolo',
        sku: rawProduct.sku,
      },
    };
  }
}