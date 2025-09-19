import { BaseConnector, ConnectorProduct, ConnectorOrder, SyncResult, AmazonCredentials, ConnectorConfig } from '@/types/connectors';

const AMAZON_CONFIG: ConnectorConfig = {
  name: 'Amazon SP-API',
  type: 'marketplace',
  auth_type: 'oauth',
  supports_webhooks: true,
  supports_realtime: false,
  rate_limit: {
    requests_per_second: 0.5,
    requests_per_hour: 1800,
  },
  endpoints: {
    products: '/catalog/v0/items',
    orders: '/orders/v0/orders',
  },
};

export class AmazonConnector extends BaseConnector {
  
  constructor(credentials: AmazonCredentials) {
    super(credentials, AMAZON_CONFIG);
  }
  
  private get baseUrl(): string {
    const creds = this.credentials as AmazonCredentials;
    const region = creds.region || 'eu-west-1';
    const sandbox = creds.sandbox ? '-sandbox' : '';
    return `https://sellingpartnerapi${sandbox}-${region}.amazon.com`;
  }
  
  private async getAccessToken(): Promise<string> {
    try {
      const response = await fetch('https://api.amazon.com/auth/o2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: (this.credentials as AmazonCredentials).refresh_token,
          client_id: (this.credentials as AmazonCredentials).access_key_id,
          client_secret: (this.credentials as AmazonCredentials).secret_access_key,
        }),
      });
      
      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Failed to get Amazon access token:', error);
      throw error;
    }
  }
  
  private async getHeaders(): Promise<Record<string, string>> {
    const accessToken = await this.getAccessToken();
    return {
      'x-amz-access-token': accessToken,
      'Content-Type': 'application/json',
    };
  }
  
  async validateCredentials(): Promise<boolean> {
    try {
      const headers = await this.getHeaders();
      const response = await this.makeRequest(
        `${this.baseUrl}/sellers/v1/marketplaceParticipations`,
        { headers }
      );
      return !!response.payload;
    } catch (error) {
      console.error('Amazon credentials validation failed:', error);
      return false;
    }
  }
  
  async fetchProducts(options?: { 
    limit?: number; 
    page?: number; 
    updated_since?: string; 
  }): Promise<ConnectorProduct[]> {
    try {
      const headers = await this.getHeaders();
      const params = new URLSearchParams();
      
      params.append('marketplaceIds', (this.credentials as AmazonCredentials).marketplace_id);
      if (options?.limit) params.append('maxResults', Math.min(options.limit, 20).toString());
      if (options?.updated_since) params.append('lastUpdatedAfter', options.updated_since);
      
      const response = await this.makeRequest(
        `${this.baseUrl}${this.config.endpoints.products}?${params}`,
        { headers }
      );
      
      return response.payload?.items?.map(this.mapAmazonProduct) || [];
    } catch (error) {
      console.error('Failed to fetch Amazon products:', error);
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
      const headers = await this.getHeaders();
      const params = new URLSearchParams();
      
      params.append('MarketplaceIds', (this.credentials as AmazonCredentials).marketplace_id);
      if (options?.updated_since) {
        params.append('LastUpdatedAfter', options.updated_since);
      } else {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        params.append('CreatedAfter', thirtyDaysAgo.toISOString());
      }
      
      if (options?.limit) params.append('MaxResultsPerPage', Math.min(options.limit, 100).toString());
      
      const response = await this.makeRequest(
        `${this.baseUrl}${this.config.endpoints.orders}?${params}`,
        { headers }
      );
      
      return response.payload?.orders?.map(this.mapAmazonOrder) || [];
    } catch (error) {
      console.error('Failed to fetch Amazon orders:', error);
      throw error;
    }
  }
  
  async updateInventory(products: { sku: string; quantity: number }[]): Promise<SyncResult> {
    const results = { success: true, total: products.length, imported: 0, updated: 0, errors: [], duration_ms: 0 };
    const startTime = Date.now();
    
    try {
      const headers = await this.getHeaders();
      
      const feedResponse = await this.makeRequest(
        `${this.baseUrl}/feeds/2021-06-30/feeds`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            feedType: 'POST_INVENTORY_AVAILABILITY_DATA',
            marketplaceIds: [(this.credentials as AmazonCredentials).marketplace_id],
            inputFeedDocumentId: `INV-${Date.now()}`,
          }),
        }
      );
      
      results.updated = products.length;
      
    } catch (error) {
      results.success = false;
      results.errors.push(`Amazon inventory update failed: ${error}`);
    }
    
    results.duration_ms = Date.now() - startTime;
    return results;
  }
  
  async updatePrices(products: { sku: string; price: number }[]): Promise<SyncResult> {
    const results = { success: true, total: products.length, imported: 0, updated: 0, errors: [], duration_ms: 0 };
    const startTime = Date.now();
    
    try {
      const headers = await this.getHeaders();
      
      const feedResponse = await this.makeRequest(
        `${this.baseUrl}/feeds/2021-06-30/feeds`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            feedType: 'POST_PRODUCT_PRICING_DATA',
            marketplaceIds: [(this.credentials as AmazonCredentials).marketplace_id],
            inputFeedDocumentId: `PRICE-${Date.now()}`,
          }),
        }
      );
      
      results.updated = products.length;
      
    } catch (error) {
      results.success = false;
      results.errors.push(`Amazon price update failed: ${error}`);
    }
    
    results.duration_ms = Date.now() - startTime;
    return results;
  }
  
  async createOrder(): Promise<string> {
    throw new Error('Amazon does not support order creation via API');
  }
  
  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    try {
      const headers = await this.getHeaders();
      
      await this.makeRequest(
        `${this.baseUrl}/orders/v0/orders/${orderId}/shipment`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            packageDetail: {
              packageReferenceId: `PKG-${Date.now()}`,
              carrierCode: 'UPS',
              trackingNumber: 'DEMO-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            },
          }),
        }
      );
      
      return true;
    } catch (error) {
      console.error('Failed to update Amazon order status:', error);
      return false;
    }
  }
  
  private mapAmazonProduct = (amazonProduct: any): ConnectorProduct => {
    const attributes = amazonProduct.attributes || {};
    
    return {
      external_id: amazonProduct.asin,
      sku: amazonProduct.identifiers?.marketplaceASIN || amazonProduct.asin,
      title: attributes.item_name?.[0]?.value || 'Unknown Product',
      description: attributes.bullet_point?.map((bp: any) => bp.value).join('\n') || '',
      price: 0,
      currency: 'EUR',
      inventory_quantity: 0,
      category: attributes.item_type_name?.[0]?.value,
      brand: attributes.brand?.[0]?.value,
      tags: [],
      images: attributes.main_product_image_locator?.map((img: any) => img.value) || [],
      variants: [],
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  };
  
  private mapAmazonOrder = (amazonOrder: any): ConnectorOrder => {
    return {
      external_id: amazonOrder.amazonOrderId,
      order_number: amazonOrder.amazonOrderId,
      status: this.mapAmazonOrderStatus(amazonOrder.orderStatus),
      total_amount: parseFloat(amazonOrder.orderTotal?.amount || '0'),
      currency: amazonOrder.orderTotal?.currencyCode || 'EUR',
      customer_name: amazonOrder.buyerInfo?.buyerName || 'Amazon Customer',
      customer_email: amazonOrder.buyerInfo?.buyerEmail || '',
      billing_address: {
        name: amazonOrder.defaultShipFromLocationAddress?.name || '',
        address1: amazonOrder.defaultShipFromLocationAddress?.addressLine1 || '',
        city: amazonOrder.defaultShipFromLocationAddress?.city || '',
        country: amazonOrder.defaultShipFromLocationAddress?.countryCode || '',
        zip: amazonOrder.defaultShipFromLocationAddress?.postalCode || '',
      },
      shipping_address: {
        name: amazonOrder.shippingAddress?.name || '',
        address1: amazonOrder.shippingAddress?.addressLine1 || '',
        city: amazonOrder.shippingAddress?.city || '',
        country: amazonOrder.shippingAddress?.countryCode || '',
        zip: amazonOrder.shippingAddress?.postalCode || '',
      },
      line_items: [],
      created_at: amazonOrder.purchaseDate,
      updated_at: amazonOrder.lastUpdateDate,
    };
  };
  
  private mapAmazonOrderStatus(status: string): ConnectorOrder['status'] {
    const statusMap: Record<string, ConnectorOrder['status']> = {
      'Pending': 'pending',
      'Unshipped': 'processing',
      'Shipped': 'shipped',
      'Delivered': 'delivered',
      'Canceled': 'cancelled',
    };
    
    return statusMap[status] || 'pending';
  }
}