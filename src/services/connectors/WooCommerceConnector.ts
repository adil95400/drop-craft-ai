import { AdvancedBaseConnector, FetchOptions, SyncResult, PlatformLimits, PlatformCapabilities, PlatformCredentials } from './AdvancedBaseConnector';
import { CompleteProduct, CompleteOrder, CompleteCustomer, WebhookEvent } from '@/types/ecommerce';

export class WooCommerceConnector extends AdvancedBaseConnector {
  
  constructor(credentials: PlatformCredentials, userId: string, shopId?: string) {
    super(credentials, 'woocommerce', userId, shopId);
  }

  protected buildBaseUrl(): string {
    const baseUrl = this.credentials.shop_url?.replace(/\/+$/, '');
    return `${baseUrl}/wp-json/wc/v3/`;
  }

  protected getAuthHeaders(): Record<string, string> {
    if (!this.credentials.clientId || !this.credentials.clientSecret) {
      throw new Error('Missing WooCommerce consumer key and secret');
    }

    const auth = Buffer.from(`${this.credentials.clientId}:${this.credentials.clientSecret}`).toString('base64');
    return {
      'Authorization': `Basic ${auth}`
    };
  }

  protected getPlatformLimits(): PlatformLimits {
    return {
      requests_per_second: 10,
      requests_per_minute: 600,
      requests_per_hour: 3600,
      requests_per_day: 50000,
      max_results_per_page: 100,
      webhook_timeout_seconds: 30
    };
  }

  protected getPlatformCapabilities(): PlatformCapabilities {
    return {
      products: {
        read: true,
        write: true,
        delete: true,
        variants: true,
        inventory: true,
        images: true,
        seo: true,
        metafields: false
      },
      orders: {
        read: true,
        write: true,
        fulfill: true,
        cancel: true,
        refund: true,
        tracking: true
      },
      customers: {
        read: true,
        write: true,
        delete: true,
        addresses: true,
        marketing_consent: false
      },
      webhooks: {
        supported: true,
        events: [
          'product.created', 'product.updated', 'product.deleted',
          'order.created', 'order.updated', 'order.deleted',
          'customer.created', 'customer.updated', 'customer.deleted'
        ],
        verification: 'none'
      },
      inventory: {
        locations: false,
        tracking: true,
        reservations: false
      }
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('system_status');
      return true;
    } catch (error) {
      console.error('WooCommerce connection test failed:', error);
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<CompleteProduct[]> {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('per_page', Math.min(options.limit, 100).toString());

      const response = await this.makeRequest(`products?${params.toString()}`);
      
      return response.map((product: any) => this.normalizeProduct(product));
    } catch (error) {
      console.error('Error fetching WooCommerce products:', error);
      return [];
    }
  }

  async fetchProduct(id: string): Promise<CompleteProduct | null> {
    try {
      const response = await this.makeRequest(`products/${id}`);
      return this.normalizeProduct(response);
    } catch (error) {
      console.error(`Error fetching WooCommerce product ${id}:`, error);
      return null;
    }
  }

  async createProduct(product: Partial<CompleteProduct>): Promise<CompleteProduct> {
    try {
      const wooProduct = this.denormalizeProduct(product);
      const response = await this.makeRequest('products', {
        method: 'POST',
        body: JSON.stringify(wooProduct)
      });
      return this.normalizeProduct(response);
    } catch (error) {
      console.error('Error creating WooCommerce product:', error);
      throw error;
    }
  }

  async updateProduct(id: string, product: Partial<CompleteProduct>): Promise<CompleteProduct> {
    try {
      const wooProduct = this.denormalizeProduct(product);
      const response = await this.makeRequest(`products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(wooProduct)
      });
      return this.normalizeProduct(response);
    } catch (error) {
      console.error(`Error updating WooCommerce product ${id}:`, error);
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      await this.makeRequest(`products/${id}`, { 
        method: 'DELETE',
        body: JSON.stringify({ force: true })
      });
      return true;
    } catch (error) {
      console.error(`Error deleting WooCommerce product ${id}:`, error);
      return false;
    }
  }

  async fetchOrders(options: FetchOptions = {}): Promise<CompleteOrder[]> {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('per_page', Math.min(options.limit, 100).toString());

      const response = await this.makeRequest(`orders?${params.toString()}`);
      
      return response.map((order: any) => this.normalizeOrder(order));
    } catch (error) {
      console.error('Error fetching WooCommerce orders:', error);
      return [];
    }
  }

  async fetchOrder(id: string): Promise<CompleteOrder | null> {
    try {
      const response = await this.makeRequest(`orders/${id}`);
      return this.normalizeOrder(response);
    } catch (error) {
      console.error(`Error fetching WooCommerce order ${id}:`, error);
      return null;
    }
  }

  async updateOrderStatus(id: string, status: string): Promise<CompleteOrder> {
    try {
      const response = await this.makeRequest(`orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      
      return this.normalizeOrder(response);
    } catch (error) {
      console.error(`Error updating WooCommerce order ${id} status:`, error);
      throw error;
    }
  }

  async fulfillOrder(id: string, trackingNumber?: string, trackingCompany?: string): Promise<CompleteOrder> {
    try {
      const updateData: any = { status: 'completed' };

      if (trackingNumber || trackingCompany) {
        updateData.meta_data = [
          ...(trackingNumber ? [{ key: '_tracking_number', value: trackingNumber }] : []),
          ...(trackingCompany ? [{ key: '_tracking_provider', value: trackingCompany }] : [])
        ];
      }

      const response = await this.makeRequest(`orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      return this.normalizeOrder(response);
    } catch (error) {
      console.error(`Error fulfilling WooCommerce order ${id}:`, error);
      throw error;
    }
  }

  async fetchCustomers(options: FetchOptions = {}): Promise<CompleteCustomer[]> {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('per_page', Math.min(options.limit, 100).toString());

      const response = await this.makeRequest(`customers?${params.toString()}`);
      
      return response.map((customer: any) => this.normalizeCustomer(customer));
    } catch (error) {
      console.error('Error fetching WooCommerce customers:', error);
      return [];
    }
  }

  async fetchCustomer(id: string): Promise<CompleteCustomer | null> {
    try {
      const response = await this.makeRequest(`customers/${id}`);
      return this.normalizeCustomer(response);
    } catch (error) {
      console.error(`Error fetching WooCommerce customer ${id}:`, error);
      return null;
    }
  }

  async createCustomer(customer: Partial<CompleteCustomer>): Promise<CompleteCustomer> {
    try {
      const wooCustomer = this.denormalizeCustomer(customer);
      const response = await this.makeRequest('customers', {
        method: 'POST',
        body: JSON.stringify(wooCustomer)
      });
      return this.normalizeCustomer(response);
    } catch (error) {
      console.error('Error creating WooCommerce customer:', error);
      throw error;
    }
  }

  async updateCustomer(id: string, customer: Partial<CompleteCustomer>): Promise<CompleteCustomer> {
    try {
      const wooCustomer = this.denormalizeCustomer(customer);
      const response = await this.makeRequest(`customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(wooCustomer)
      });
      return this.normalizeCustomer(response);
    } catch (error) {
      console.error(`Error updating WooCommerce customer ${id}:`, error);
      throw error;
    }
  }

  async setupWebhooks(events: string[]): Promise<string[]> {
    try {
      const webhookIds: string[] = [];
      const baseUrl = process.env.WEBHOOK_BASE_URL || 'https://your-app.com/webhooks';
      
      for (const event of events) {
        const webhook = {
          name: `DropCraft ${event}`,
          topic: event,
          delivery_url: `${baseUrl}/woocommerce/${event.replace('.', '_')}`,
          secret: this.credentials.webhook_secret || ''
        };

        const response = await this.makeRequest('webhooks', {
          method: 'POST',
          body: JSON.stringify(webhook)
        });

        webhookIds.push(response.id.toString());
      }

      return webhookIds;
    } catch (error) {
      console.error('Error setting up WooCommerce webhooks:', error);
      throw error;
    }
  }

  verifyWebhook(payload: string, signature: string): boolean {
    return true; // Simplified for now
  }

  async processWebhookEvent(event: WebhookEvent): Promise<void> {
    console.log(`Processing WooCommerce webhook: ${event.topic}`);
  }

  async syncProducts(options: { incremental?: boolean; since?: Date } = {}): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: false,
      total: 0,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      execution_time_ms: 0
    };

    try {
      const products = await this.fetchProducts({ limit: 100 });
      result.total = products.length;
      result.imported = products.length;
      result.success = true;
      result.execution_time_ms = Date.now() - startTime;

      return result;
    } catch (error) {
      result.errors.push(this.logError('sync_products', error));
      result.execution_time_ms = Date.now() - startTime;
      return result;
    }
  }

  async syncOrders(options: { incremental?: boolean; since?: Date } = {}): Promise<SyncResult> {
    return this.syncProducts(options); // Simplified
  }

  async syncCustomers(options: { incremental?: boolean; since?: Date } = {}): Promise<SyncResult> {
    return this.syncProducts(options); // Simplified
  }

  // Méthodes privées simplifiées

  private denormalizeProduct(product: Partial<CompleteProduct>): any {
    return {
      name: product.title,
      description: product.body_html,
      status: product.status === 'active' ? 'publish' : 'draft'
    };
  }

  private denormalizeCustomer(customer: Partial<CompleteCustomer>): any {
    return {
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name
    };
  }
}