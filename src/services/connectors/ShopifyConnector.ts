import { BaseConnector, ConnectorProduct, ConnectorOrder, SyncResult, ShopifyCredentials, ConnectorConfig } from '@/types/connectors';

const SHOPIFY_CONFIG: ConnectorConfig = {
  name: 'Shopify',
  type: 'ecommerce',
  auth_type: 'oauth',
  supports_webhooks: true,
  supports_realtime: true,
  rate_limit: {
    requests_per_second: 2,
    requests_per_hour: 1000,
  },
  endpoints: {
    products: '/admin/api/2023-10/products.json',
    orders: '/admin/api/2023-10/orders.json',
    webhooks: '/admin/api/2023-10/webhooks.json',
  },
};

export class ShopifyConnector extends BaseConnector {
  
  constructor(credentials: ShopifyCredentials) {
    super(credentials, SHOPIFY_CONFIG);
  }
  
  private get baseUrl(): string {
    return `https://${(this.credentials as ShopifyCredentials).shop_domain}.myshopify.com`;
  }
  
  private get headers(): Record<string, string> {
    return {
      'X-Shopify-Access-Token': (this.credentials as ShopifyCredentials).access_token,
      'Content-Type': 'application/json',
    };
  }
  
  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest(
        `${this.baseUrl}/admin/api/2023-10/shop.json`,
        { headers: this.headers }
      );
      return !!response.shop;
    } catch (error) {
      console.error('Shopify credentials validation failed:', error);
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
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.updated_since) params.append('updated_at_min', options.updated_since);
      
      const response = await this.makeRequest(
        `${this.baseUrl}${this.config.endpoints.products}?${params}`,
        { headers: this.headers }
      );
      
      return response.products.map(this.mapShopifyProduct);
    } catch (error) {
      console.error('Failed to fetch Shopify products:', error);
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
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.status) params.append('status', options.status);
      if (options?.updated_since) params.append('updated_at_min', options.updated_since);
      
      const response = await this.makeRequest(
        `${this.baseUrl}${this.config.endpoints.orders}?${params}`,
        { headers: this.headers }
      );
      
      return response.orders.map(this.mapShopifyOrder);
    } catch (error) {
      console.error('Failed to fetch Shopify orders:', error);
      throw error;
    }
  }
  
  async updateInventory(products: { sku: string; quantity: number }[]): Promise<SyncResult> {
    const results = { success: true, total: products.length, imported: 0, updated: 0, errors: [], duration_ms: 0 };
    const startTime = Date.now();
    
    for (const product of products) {
      await this.delay(500);
      
      try {
        const variantResponse = await this.makeRequest(
          `${this.baseUrl}/admin/api/2023-10/variants.json?sku=${product.sku}`,
          { headers: this.headers }
        );
        
        if (variantResponse.variants.length === 0) {
          results.errors.push(`SKU not found: ${product.sku}`);
          continue;
        }
        
        const variant = variantResponse.variants[0];
        
        await this.makeRequest(
          `${this.baseUrl}/admin/api/2023-10/inventory_levels/set.json`,
          {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({
              location_id: variant.inventory_item_id,
              inventory_item_id: variant.inventory_item_id,
              available: product.quantity,
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
      await this.delay(500);
      
      try {
        const variantResponse = await this.makeRequest(
          `${this.baseUrl}/admin/api/2023-10/variants.json?sku=${product.sku}`,
          { headers: this.headers }
        );
        
        if (variantResponse.variants.length === 0) {
          results.errors.push(`SKU not found: ${product.sku}`);
          continue;
        }
        
        const variant = variantResponse.variants[0];
        
        await this.makeRequest(
          `${this.baseUrl}/admin/api/2023-10/variants/${variant.id}.json`,
          {
            method: 'PUT',
            headers: this.headers,
            body: JSON.stringify({
              variant: {
                id: variant.id,
                price: product.price.toString(),
              },
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
      const shopifyOrder = {
        order: {
          line_items: order.line_items?.map(item => ({
            variant_id: item.variant_id,
            quantity: item.quantity,
            price: item.price,
          })),
          customer: {
            first_name: order.customer_name?.split(' ')[0],
            last_name: order.customer_name?.split(' ').slice(1).join(' '),
            email: order.customer_email,
          },
          billing_address: order.billing_address,
          shipping_address: order.shipping_address,
          financial_status: 'paid',
        },
      };
      
      const response = await this.makeRequest(
        `${this.baseUrl}${this.config.endpoints.orders}`,
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(shopifyOrder),
        }
      );
      
      return response.order.id.toString();
    } catch (error) {
      console.error('Failed to create Shopify order:', error);
      throw error;
    }
  }
  
  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    try {
      await this.makeRequest(
        `${this.baseUrl}/admin/api/2023-10/orders/${orderId}.json`,
        {
          method: 'PUT',
          headers: this.headers,
          body: JSON.stringify({
            order: {
              id: parseInt(orderId),
              fulfillment_status: status,
            },
          }),
        }
      );
      
      return true;
    } catch (error) {
      console.error('Failed to update Shopify order status:', error);
      return false;
    }
  }
  
  private mapShopifyProduct = (shopifyProduct: any): ConnectorProduct => {
    const mainVariant = shopifyProduct.variants[0] || {};
    
    return {
      external_id: shopifyProduct.id.toString(),
      sku: mainVariant.sku || shopifyProduct.handle,
      title: shopifyProduct.title,
      description: shopifyProduct.body_html || '',
      price: parseFloat(mainVariant.price || '0'),
      compare_at_price: mainVariant.compare_at_price ? parseFloat(mainVariant.compare_at_price) : undefined,
      currency: 'EUR',
      inventory_quantity: mainVariant.inventory_quantity || 0,
      category: shopifyProduct.product_type,
      brand: shopifyProduct.vendor,
      tags: shopifyProduct.tags ? shopifyProduct.tags.split(',').map((t: string) => t.trim()) : [],
      images: shopifyProduct.images?.map((img: any) => img.src) || [],
      variants: shopifyProduct.variants.map((variant: any) => ({
        id: variant.id.toString(),
        sku: variant.sku,
        title: variant.title,
        price: parseFloat(variant.price),
        compare_at_price: variant.compare_at_price ? parseFloat(variant.compare_at_price) : undefined,
        inventory_quantity: variant.inventory_quantity || 0,
        weight: variant.weight,
        attributes: {
          option1: variant.option1,
          option2: variant.option2,
          option3: variant.option3,
        },
      })),
      status: shopifyProduct.status === 'active' ? 'active' : 'draft',
      created_at: shopifyProduct.created_at,
      updated_at: shopifyProduct.updated_at,
    };
  };
  
  private mapShopifyOrder = (shopifyOrder: any): ConnectorOrder => {
    return {
      external_id: shopifyOrder.id.toString(),
      order_number: shopifyOrder.order_number || shopifyOrder.name,
      status: this.mapShopifyOrderStatus(shopifyOrder.fulfillment_status, shopifyOrder.financial_status),
      total_amount: parseFloat(shopifyOrder.total_price),
      currency: shopifyOrder.currency,
      customer_id: shopifyOrder.customer?.id?.toString(),
      customer_name: `${shopifyOrder.customer?.first_name || ''} ${shopifyOrder.customer?.last_name || ''}`.trim(),
      customer_email: shopifyOrder.customer?.email || shopifyOrder.email,
      billing_address: shopifyOrder.billing_address || {},
      shipping_address: shopifyOrder.shipping_address || {},
      line_items: shopifyOrder.line_items?.map((item: any) => ({
        product_id: item.product_id?.toString(),
        variant_id: item.variant_id?.toString(),
        sku: item.sku,
        title: item.title,
        quantity: item.quantity,
        price: parseFloat(item.price),
      })) || [],
      created_at: shopifyOrder.created_at,
      updated_at: shopifyOrder.updated_at,
    };
  };
  
  private mapShopifyOrderStatus(fulfillmentStatus: string, financialStatus: string): ConnectorOrder['status'] {
    if (financialStatus === 'refunded') return 'refunded';
    if (fulfillmentStatus === 'fulfilled') return 'delivered';
    if (fulfillmentStatus === 'partial') return 'processing';
    if (fulfillmentStatus === 'unfulfilled' && financialStatus === 'paid') return 'processing';
    return 'pending';
  }
}