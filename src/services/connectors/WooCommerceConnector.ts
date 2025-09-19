import { BaseConnector, ConnectorProduct, ConnectorOrder, SyncResult, WooCommerceCredentials, ConnectorConfig } from '@/types/connectors';

const WOOCOMMERCE_CONFIG: ConnectorConfig = {
  name: 'WooCommerce',
  type: 'ecommerce',
  auth_type: 'api_key',
  supports_webhooks: true,
  supports_realtime: false,
  rate_limit: {
    requests_per_second: 10,
    requests_per_hour: 3600,
  },
  endpoints: {
    products: '/wp-json/wc/v3/products',
    orders: '/wp-json/wc/v3/orders',
  },
};

export class WooCommerceConnector extends BaseConnector {
  protected credentials: WooCommerceCredentials;
  
  constructor(credentials: WooCommerceCredentials) {
    super(credentials, WOOCOMMERCE_CONFIG);
    this.credentials = credentials;
  }
  
  private get baseUrl(): string {
    return this.credentials.site_url.replace(/\/$/, '');
  }
  
  private get authParams(): string {
    return `consumer_key=${this.credentials.consumer_key}&consumer_secret=${this.credentials.consumer_secret}`;
  }
  
  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest(
        `${this.baseUrl}/wp-json/wc/v3/system_status?${this.authParams}`
      );
      return !!response.environment;
    } catch (error) {
      console.error('WooCommerce credentials validation failed:', error);
      return false;
    }
  }
  
  async fetchProducts(options?: { 
    limit?: number; 
    page?: number; 
    updated_since?: string; 
  }): Promise<ConnectorProduct[]> {
    try {
      const params = new URLSearchParams();
      params.append('consumer_key', this.credentials.consumer_key);
      params.append('consumer_secret', this.credentials.consumer_secret);
      
      if (options?.limit) params.append('per_page', options.limit.toString());
      if (options?.page) params.append('page', options.page.toString());
      if (options?.updated_since) params.append('modified_after', options.updated_since);
      
      const response = await this.makeRequest(
        `${this.baseUrl}${this.config.endpoints.products}?${params}`
      );
      
      return response.map(this.mapWooCommerceProduct);
    } catch (error) {
      console.error('Failed to fetch WooCommerce products:', error);
      throw error;
    }
  }
  
  async fetchOrders(options?: { 
    limit?: number; 
    page?: number; 
    status?: string;
    updated_since?: string; 
  }): Promise<ConnectorOrder[]> {
    try {
      const params = new URLSearchParams();
      params.append('consumer_key', this.credentials.consumer_key);
      params.append('consumer_secret', this.credentials.consumer_secret);
      
      if (options?.limit) params.append('per_page', options.limit.toString());
      if (options?.page) params.append('page', options.page.toString());
      if (options?.status) params.append('status', options.status);
      if (options?.updated_since) params.append('modified_after', options.updated_since);
      
      const response = await this.makeRequest(
        `${this.baseUrl}${this.config.endpoints.orders}?${params}`
      );
      
      return response.map(this.mapWooCommerceOrder);
    } catch (error) {
      console.error('Failed to fetch WooCommerce orders:', error);
      throw error;
    }
  }
  
  async updateInventory(products: { sku: string; quantity: number }[]): Promise<SyncResult> {
    const results = { success: true, total: products.length, imported: 0, updated: 0, errors: [], duration_ms: 0 };
    const startTime = Date.now();
    
    for (const product of products) {
      await this.delay(100);
      
      try {
        const searchResponse = await this.makeRequest(
          `${this.baseUrl}${this.config.endpoints.products}?sku=${product.sku}&${this.authParams}`
        );
        
        if (searchResponse.length === 0) {
          results.errors.push(`SKU not found: ${product.sku}`);
          continue;
        }
        
        const wooProduct = searchResponse[0];
        
        await this.makeRequest(
          `${this.baseUrl}${this.config.endpoints.products}/${wooProduct.id}?${this.authParams}`,
          {
            method: 'PUT',
            body: JSON.stringify({
              stock_quantity: product.quantity,
              manage_stock: true,
              stock_status: product.quantity > 0 ? 'instock' : 'outofstock',
            }),
          }
        );
        
        results.updated++;
      } catch (error) {
        results.errors.push(`Failed to update ${product.sku}: ${error}`);
      }
    }
    
    results.duration_ms = Date.now() - startTime;
    return results;
  }
  
  async updatePrices(products: { sku: string; price: number }[]): Promise<SyncResult> {
    const results = { success: true, total: products.length, imported: 0, updated: 0, errors: [], duration_ms: 0 };
    const startTime = Date.now();
    
    for (const product of products) {
      await this.delay(100);
      
      try {
        const searchResponse = await this.makeRequest(
          `${this.baseUrl}${this.config.endpoints.products}?sku=${product.sku}&${this.authParams}`
        );
        
        if (searchResponse.length === 0) {
          results.errors.push(`SKU not found: ${product.sku}`);
          continue;
        }
        
        const wooProduct = searchResponse[0];
        
        await this.makeRequest(
          `${this.baseUrl}${this.config.endpoints.products}/${wooProduct.id}?${this.authParams}`,
          {
            method: 'PUT',
            body: JSON.stringify({
              regular_price: product.price.toString(),
            }),
          }
        );
        
        results.updated++;
      } catch (error) {
        results.errors.push(`Failed to update price for ${product.sku}: ${error}`);
      }
    }
    
    results.duration_ms = Date.now() - startTime;
    return results;
  }
  
  async createOrder(order: Partial<ConnectorOrder>): Promise<string> {
    try {
      const wooOrder = {
        status: 'processing',
        currency: order.currency || 'EUR',
        customer_id: order.customer_id ? parseInt(order.customer_id) : 0,
        billing: order.billing_address,
        shipping: order.shipping_address,
        line_items: order.line_items?.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: item.quantity,
          price: item.price,
        })),
        total: order.total_amount?.toString(),
      };
      
      const response = await this.makeRequest(
        `${this.baseUrl}${this.config.endpoints.orders}?${this.authParams}`,
        {
          method: 'POST',
          body: JSON.stringify(wooOrder),
        }
      );
      
      return response.id.toString();
    } catch (error) {
      console.error('Failed to create WooCommerce order:', error);
      throw error;
    }
  }
  
  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    try {
      await this.makeRequest(
        `${this.baseUrl}${this.config.endpoints.orders}/${orderId}?${this.authParams}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            status: this.mapToWooCommerceStatus(status),
          }),
        }
      );
      
      return true;
    } catch (error) {
      console.error('Failed to update WooCommerce order status:', error);
      return false;
    }
  }
  
  private mapWooCommerceProduct = (wooProduct: any): ConnectorProduct => {
    return {
      external_id: wooProduct.id.toString(),
      sku: wooProduct.sku || wooProduct.slug,
      title: wooProduct.name,
      description: wooProduct.description || wooProduct.short_description || '',
      price: parseFloat(wooProduct.price || wooProduct.regular_price || '0'),
      compare_at_price: wooProduct.sale_price ? parseFloat(wooProduct.regular_price) : undefined,
      currency: 'EUR',
      inventory_quantity: wooProduct.stock_quantity || 0,
      category: wooProduct.categories?.[0]?.name,
      brand: wooProduct.attributes?.find((attr: any) => attr.name === 'Brand')?.options?.[0],
      tags: wooProduct.tags?.map((tag: any) => tag.name) || [],
      images: wooProduct.images?.map((img: any) => img.src) || [],
      variants: [],
      status: wooProduct.status === 'publish' ? 'active' : 'draft',
      created_at: wooProduct.date_created,
      updated_at: wooProduct.date_modified,
    };
  };
  
  private mapWooCommerceOrder = (wooOrder: any): ConnectorOrder => {
    return {
      external_id: wooOrder.id.toString(),
      order_number: wooOrder.number || wooOrder.id.toString(),
      status: this.mapWooCommerceOrderStatus(wooOrder.status),
      total_amount: parseFloat(wooOrder.total),
      currency: wooOrder.currency,
      customer_id: wooOrder.customer_id?.toString(),
      customer_name: `${wooOrder.billing?.first_name || ''} ${wooOrder.billing?.last_name || ''}`.trim(),
      customer_email: wooOrder.billing?.email,
      billing_address: {
        name: `${wooOrder.billing?.first_name || ''} ${wooOrder.billing?.last_name || ''}`.trim(),
        address1: wooOrder.billing?.address_1 || '',
        address2: wooOrder.billing?.address_2,
        city: wooOrder.billing?.city || '',
        province: wooOrder.billing?.state,
        country: wooOrder.billing?.country || '',
        zip: wooOrder.billing?.postcode || '',
        phone: wooOrder.billing?.phone,
      },
      shipping_address: {
        name: `${wooOrder.shipping?.first_name || ''} ${wooOrder.shipping?.last_name || ''}`.trim(),
        address1: wooOrder.shipping?.address_1 || '',
        address2: wooOrder.shipping?.address_2,
        city: wooOrder.shipping?.city || '',
        province: wooOrder.shipping?.state,
        country: wooOrder.shipping?.country || '',
        zip: wooOrder.shipping?.postcode || '',
      },
      line_items: wooOrder.line_items?.map((item: any) => ({
        product_id: item.product_id?.toString(),
        variant_id: item.variation_id?.toString(),
        sku: item.sku,
        title: item.name,
        quantity: item.quantity,
        price: parseFloat(item.price),
      })) || [],
      created_at: wooOrder.date_created,
      updated_at: wooOrder.date_modified,
    };
  };
  
  private mapWooCommerceOrderStatus(status: string): ConnectorOrder['status'] {
    const statusMap: Record<string, ConnectorOrder['status']> = {
      'pending': 'pending',
      'processing': 'processing',
      'completed': 'delivered',
      'cancelled': 'cancelled',
      'refunded': 'refunded',
    };
    
    return statusMap[status] || 'pending';
  }
  
  private mapToWooCommerceStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'pending',
      'processing': 'processing',
      'shipped': 'completed',
      'delivered': 'completed',
      'cancelled': 'cancelled',
      'refunded': 'refunded',
    };
    
    return statusMap[status] || 'processing';
  }
}