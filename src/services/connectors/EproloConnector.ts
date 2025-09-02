import { BaseConnector, FetchOptions, SyncResult } from './BaseConnector';
import { SupplierCredentials, SupplierProduct } from '@/types/suppliers';

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
  constructor(credentials: SupplierCredentials) {
    super(credentials, 'https://api.eprolo.com/v1');
    this.rateLimitDelay = 500; // 2 requests per second
  }

  protected getSupplierName(): string {
    return 'Eprolo';
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.apiKey}`,
    };
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.makeRequest('/account/info');
      return true;
    } catch (error) {
      console.error('Eprolo credential validation failed:', error);
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 50, 100);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(options.category && { category: options.category }),
        ...(options.lastSync && { updated_since: options.lastSync.toISOString() }),
      });

      const data = await this.makeRequest(`/products?${params}`);
      
      if (!data.success || !data.data?.products) {
        throw new Error('Invalid response format from Eprolo API');
      }

      return data.data.products.map((product: EproloProduct) => 
        this.transformProduct(product)
      );
    } catch (error) {
      this.handleError(error, 'fetchProducts');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const data = await this.makeRequest(`/products/${sku}`);
      
      if (!data.success || !data.data) {
        return null;
      }

      return this.transformProduct(data.data);
    } catch (error) {
      console.error('Error fetching Eprolo product:', error);
      return null;
    }
  }

  async updateInventory(products: SupplierProduct[]): Promise<SyncResult> {
    try {
      const skus = products.map(p => p.sku);
      const data = await this.makeRequest('/inventory', {
        method: 'POST',
        body: JSON.stringify({ skus }),
      });
      
      if (!data.success || !data.data) {
        throw new Error('Invalid inventory response from Eprolo API');
      }

      return {
        total: products.length,
        imported: data.data?.length || 0,
        duplicates: 0,
        errors: [],
      };
    } catch (error) {
      console.error('Error updating Eprolo inventory:', error);
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
          line_items: order.line_items,
          shipping_address: order.shipping_address,
          billing_address: order.billing_address,
          customer_note: order.customer_note,
        }),
      });
      
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
      const data = await this.makeRequest(`/orders/${orderId}`);
      
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