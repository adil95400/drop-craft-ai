import { AdvancedBaseConnector, FetchOptions, SyncResult, PlatformLimits, PlatformCapabilities, PlatformCredentials } from './AdvancedBaseConnector';
import { CompleteProduct, CompleteOrder, CompleteCustomer, WebhookEvent } from '@/types/ecommerce';

interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  handle: string;
  status: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  tags: string;
  created_at: string;
  updated_at: string;
}

interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  compare_at_price?: string;
  sku: string;
  inventory_quantity: number;
  weight: number;
  option1?: string;
  option2?: string;
  option3?: string;
}

interface ShopifyImage {
  id: number;
  src: string;
  alt?: string;
  position: number;
}

export class ShopifyAdvancedConnector extends AdvancedBaseConnector {
  
  constructor(credentials: PlatformCredentials, userId: string, shopId?: string) {
    super(credentials, 'shopify', userId, shopId);
  }

  protected buildBaseUrl(): string {
    const shopDomain = this.credentials.shop_url;
    return `https://${shopDomain}.myshopify.com`;
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'X-Shopify-Access-Token': this.credentials.accessToken || this.credentials.access_token || '',
    };
  }

  protected getPlatformLimits(): PlatformLimits {
    return {
      requests_per_second: 2,
      requests_per_minute: 120,
      requests_per_hour: 7200,
      requests_per_day: 172800,
      max_results_per_page: 250,
      webhook_timeout_seconds: 10
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
        metafields: true
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
        marketing_consent: true
      },
      webhooks: {
        supported: true,
        events: ['orders/create', 'orders/updated', 'orders/paid', 'orders/cancelled', 'products/create', 'products/update'],
        verification: 'hmac'
      },
      inventory: {
        locations: true,
        tracking: true,
        reservations: false
      }
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const apiVersion = this.credentials.api_version || '2024-01';
      const response = await this.makeRequest(`/admin/api/${apiVersion}/shop.json`);
      return !!response.shop;
    } catch (error) {
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<CompleteProduct[]> {
    try {
      const { page = 1, limit = 50, updated_at_min } = options;
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString(),
        status: 'active',
      });

      if (updated_at_min) {
        params.append('updated_at_min', updated_at_min);
      }

      const apiVersion = this.credentials.api_version || '2024-01';
      const response = await this.makeRequest(`/admin/api/${apiVersion}/products.json?${params}`);
      
      return response.products.map((product: ShopifyProduct) => this.normalizeProduct(product));
    } catch (error) {
      return [];
    }
  }

  async fetchProduct(productId: string): Promise<CompleteProduct | null> {
    try {
      const apiVersion = this.credentials.api_version || '2024-01';
      const response = await this.makeRequest(`/admin/api/${apiVersion}/products/${productId}.json`);
      return this.normalizeProduct(response.product);
    } catch (error) {
      return null;
    }
  }

  async createProduct(product: Partial<CompleteProduct>): Promise<CompleteProduct> {
    try {
      const apiVersion = this.credentials.api_version || '2024-01';
      const productData = {
        product: {
          title: product.title,
          body_html: product.body_html,
          vendor: product.vendor,
          product_type: product.product_type,
          status: product.status === 'active' ? 'active' : 'draft',
          variants: product.variants?.map(variant => ({
            title: variant.title,
            price: variant.price.toString(),
            sku: variant.sku,
            inventory_quantity: variant.inventory_quantity,
            weight: variant.weight
          })) || [{
            title: 'Default Title',
            price: '0',
            sku: '',
            inventory_quantity: 0
          }],
          images: product.images?.map((image, index) => ({
            src: image.src,
            position: index + 1,
            alt: image.alt
          }))
        }
      };

      const response = await this.makeRequest(`/admin/api/${apiVersion}/products.json`, {
        method: 'POST',
        body: JSON.stringify(productData)
      });

      return this.normalizeProduct(response.product);
    } catch (error) {
      throw error;
    }
  }

  async updateProduct(productId: string, product: Partial<CompleteProduct>): Promise<CompleteProduct> {
    try {
      const apiVersion = this.credentials.api_version || '2024-01';
      const productData = {
        product: {
          id: productId,
          title: product.title,
          body_html: product.body_html,
          vendor: product.vendor,
          product_type: product.product_type
        }
      };

      const response = await this.makeRequest(`/admin/api/${apiVersion}/products/${productId}.json`, {
        method: 'PUT',
        body: JSON.stringify(productData)
      });

      return this.normalizeProduct(response.product);
    } catch (error) {
      throw error;
    }
  }

  async deleteProduct(productId: string): Promise<boolean> {
    try {
      const apiVersion = this.credentials.api_version || '2024-01';
      await this.makeRequest(`/admin/api/${apiVersion}/products/${productId}.json`, {
        method: 'DELETE'
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async fetchOrders(options: FetchOptions = {}): Promise<CompleteOrder[]> {
    try {
      const { page = 1, limit = 50, updated_at_min } = options;
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString(),
        status: 'any',
      });

      if (updated_at_min) {
        params.append('updated_at_min', updated_at_min);
      }

      const apiVersion = this.credentials.api_version || '2024-01';
      const response = await this.makeRequest(`/admin/api/${apiVersion}/orders.json?${params}`);
      
      return response.orders.map((order: any) => this.normalizeOrder(order));
    } catch (error) {
      return [];
    }
  }

  async fetchOrder(orderId: string): Promise<CompleteOrder | null> {
    try {
      const apiVersion = this.credentials.api_version || '2024-01';
      const response = await this.makeRequest(`/admin/api/${apiVersion}/orders/${orderId}.json`);
      return this.normalizeOrder(response.order);
    } catch (error) {
      return null;
    }
  }

  async updateOrderStatus(orderId: string, status: string): Promise<CompleteOrder> {
    try {
      const apiVersion = this.credentials.api_version || '2024-01';
      // Shopify uses fulfillments for order status changes
      const response = await this.makeRequest(`/admin/api/${apiVersion}/orders/${orderId}.json`);
      return this.normalizeOrder(response.order);
    } catch (error) {
      throw error;
    }
  }

  async fulfillOrder(orderId: string, trackingNumber?: string, trackingCompany?: string): Promise<CompleteOrder> {
    try {
      const apiVersion = this.credentials.api_version || '2024-01';
      
      // Get order first to get line items
      const orderResponse = await this.makeRequest(`/admin/api/${apiVersion}/orders/${orderId}.json`);
      
      const fulfillmentData = {
        fulfillment: {
          location_id: null,
          tracking_number: trackingNumber,
          tracking_company: trackingCompany,
          notify_customer: true,
          line_items: orderResponse.order.line_items.map((item: any) => ({
            id: item.id,
            quantity: item.quantity
          }))
        }
      };

      await this.makeRequest(`/admin/api/${apiVersion}/orders/${orderId}/fulfillments.json`, {
        method: 'POST',
        body: JSON.stringify(fulfillmentData)
      });

      const updatedOrder = await this.makeRequest(`/admin/api/${apiVersion}/orders/${orderId}.json`);
      return this.normalizeOrder(updatedOrder.order);
    } catch (error) {
      throw error;
    }
  }

  async fetchCustomers(options: FetchOptions = {}): Promise<CompleteCustomer[]> {
    try {
      const { page = 1, limit = 50, updated_at_min } = options;
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString(),
      });

      if (updated_at_min) {
        params.append('updated_at_min', updated_at_min);
      }

      const apiVersion = this.credentials.api_version || '2024-01';
      const response = await this.makeRequest(`/admin/api/${apiVersion}/customers.json?${params}`);
      
      return response.customers.map((customer: any) => this.normalizeCustomer(customer));
    } catch (error) {
      return [];
    }
  }

  async fetchCustomer(customerId: string): Promise<CompleteCustomer | null> {
    try {
      const apiVersion = this.credentials.api_version || '2024-01';
      const response = await this.makeRequest(`/admin/api/${apiVersion}/customers/${customerId}.json`);
      return this.normalizeCustomer(response.customer);
    } catch (error) {
      return null;
    }
  }

  async createCustomer(customer: Partial<CompleteCustomer>): Promise<CompleteCustomer> {
    try {
      const apiVersion = this.credentials.api_version || '2024-01';
      const customerData = {
        customer: {
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          phone: customer.phone,
          verified_email: customer.verified_email,
          accepts_marketing: customer.accepts_marketing,
          addresses: customer.addresses
        }
      };

      const response = await this.makeRequest(`/admin/api/${apiVersion}/customers.json`, {
        method: 'POST',
        body: JSON.stringify(customerData)
      });

      return this.normalizeCustomer(response.customer);
    } catch (error) {
      throw error;
    }
  }

  async updateCustomer(customerId: string, customer: Partial<CompleteCustomer>): Promise<CompleteCustomer> {
    try {
      const apiVersion = this.credentials.api_version || '2024-01';
      const customerData = {
        customer: {
          id: customerId,
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          phone: customer.phone,
          accepts_marketing: customer.accepts_marketing
        }
      };

      const response = await this.makeRequest(`/admin/api/${apiVersion}/customers/${customerId}.json`, {
        method: 'PUT',
        body: JSON.stringify(customerData)
      });

      return this.normalizeCustomer(response.customer);
    } catch (error) {
      throw error;
    }
  }

  async setupWebhooks(events: string[]): Promise<string[]> {
    try {
      const apiVersion = this.credentials.api_version || '2024-01';
      const webhookIds: string[] = [];

      for (const event of events) {
        const webhookData = {
          webhook: {
            topic: event,
            address: `${process.env.VITE_SUPABASE_URL}/functions/v1/webhook-handler`,
            format: 'json'
          }
        };

        const response = await this.makeRequest(`/admin/api/${apiVersion}/webhooks.json`, {
          method: 'POST',
          body: JSON.stringify(webhookData)
        });

        if (response.webhook) {
          webhookIds.push(response.webhook.id.toString());
        }
      }

      return webhookIds;
    } catch (error) {
      return [];
    }
  }

  verifyWebhook(payload: string, signature: string): boolean {
    try {
      const crypto = require('crypto');
      const webhookSecret = this.credentials.webhook_secret;
      
      if (!webhookSecret) return false;

      const hmac = crypto.createHmac('sha256', webhookSecret);
      hmac.update(payload, 'utf8');
      const calculatedSignature = hmac.digest('base64');

      return calculatedSignature === signature;
    } catch (error) {
      return false;
    }
  }

  async processWebhookEvent(event: WebhookEvent): Promise<void> {
    // Process webhook events - update local data based on Shopify changes
    const webhookData = event.payload || event;
  }

  async syncProducts(options?: { incremental?: boolean; since?: Date }): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: true,
      total: 0,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      execution_time_ms: 0
    };

    try {
      const fetchOptions: FetchOptions = {};
      if (options?.incremental && options?.since) {
        fetchOptions.updated_at_min = options.since.toISOString();
      }

      const products = await this.fetchProducts(fetchOptions);
      result.total = products.length;
      result.imported = products.length;
      result.success = true;
    } catch (error) {
      result.success = false;
      result.errors.push({
        entity_type: 'products',
        error_code: 'SYNC_ERROR',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        retry_count: 0,
        timestamp: new Date().toISOString()
      });
    }

    result.execution_time_ms = Date.now() - startTime;
    return result;
  }

  async syncOrders(options?: { incremental?: boolean; since?: Date }): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: true,
      total: 0,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      execution_time_ms: 0
    };

    try {
      const fetchOptions: FetchOptions = {};
      if (options?.incremental && options?.since) {
        fetchOptions.updated_at_min = options.since.toISOString();
      }

      const orders = await this.fetchOrders(fetchOptions);
      result.total = orders.length;
      result.imported = orders.length;
      result.success = true;
    } catch (error) {
      result.success = false;
      result.errors.push({
        entity_type: 'orders',
        error_code: 'SYNC_ERROR',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        retry_count: 0,
        timestamp: new Date().toISOString()
      });
    }

    result.execution_time_ms = Date.now() - startTime;
    return result;
  }

  async syncCustomers(options?: { incremental?: boolean; since?: Date }): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: true,
      total: 0,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      execution_time_ms: 0
    };

    try {
      const fetchOptions: FetchOptions = {};
      if (options?.incremental && options?.since) {
        fetchOptions.updated_at_min = options.since.toISOString();
      }

      const customers = await this.fetchCustomers(fetchOptions);
      result.total = customers.length;
      result.imported = customers.length;
      result.success = true;
    } catch (error) {
      result.success = false;
      result.errors.push({
        entity_type: 'customers',
        error_code: 'SYNC_ERROR',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        retry_count: 0,
        timestamp: new Date().toISOString()
      });
    }

    result.execution_time_ms = Date.now() - startTime;
    return result;
  }
}