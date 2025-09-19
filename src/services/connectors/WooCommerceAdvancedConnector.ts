import { AdvancedBaseConnector, FetchOptions, SyncResult, PlatformLimits, PlatformCapabilities, PlatformCredentials } from './AdvancedBaseConnector';
import { CompleteProduct, CompleteOrder, CompleteCustomer, WebhookEvent } from '@/types/ecommerce';
import crypto from 'crypto';

export class WooCommerceAdvancedConnector extends AdvancedBaseConnector {
  
  constructor(credentials: PlatformCredentials, userId: string, shopId?: string) {
    super(credentials, 'woocommerce', userId, shopId);
  }

  protected buildBaseUrl(): string {
    const siteUrl = this.credentials.shop_url || this.credentials.site_url;
    return siteUrl?.replace(/\/$/, '') || '';
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'User-Agent': 'DropCraftAI/1.0',
    };
  }

  protected getPlatformLimits(): PlatformLimits {
    return {
      requests_per_second: 10,
      requests_per_minute: 600,
      requests_per_hour: 3600,
      requests_per_day: 50000,
      max_results_per_page: 100,
      webhook_timeout_seconds: 30,
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
        metafields: true,
      },
      orders: {
        read: true,
        write: true,
        fulfill: true,
        cancel: true,
        refund: true,
        tracking: true,
      },
      customers: {
        read: true,
        write: true,
        delete: false,
        addresses: true,
        marketing_consent: false,
      },
      webhooks: {
        supported: true,
        events: [
          'product.created', 'product.updated', 'product.deleted',
          'order.created', 'order.updated', 'order.paid', 'order.cancelled',
        ],
        verification: 'hmac',
      },
      inventory: {
        locations: false,
        tracking: true,
        reservations: false,
      },
    };
  }

  private get authParams(): string {
    return `consumer_key=${this.credentials.consumer_key}&consumer_secret=${this.credentials.consumer_secret}`;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/wp-json/wc/v3/system_status');
      return !!response.environment;
    } catch (error) {
      console.error('WooCommerce connection test failed:', error);
      return false;
    }
  }

  async fetchProducts(options?: FetchOptions): Promise<CompleteProduct[]> {
    try {
      const params = new URLSearchParams(this.authParams);
      
      if (options?.limit) params.append('per_page', Math.min(options.limit, 100).toString());
      if (options?.page) params.append('page', options.page.toString());
      if (options?.updated_at_min) params.append('modified_after', options.updated_at_min);
      
      const response = await this.makeRequest(`/wp-json/wc/v3/products?${params}`);
      return response.map(this.mapWooCommerceProduct);
    } catch (error) {
      console.error('Failed to fetch WooCommerce products:', error);
      throw error;
    }
  }

  async fetchProduct(id: string): Promise<CompleteProduct | null> {
    try {
      const response = await this.makeRequest(`/wp-json/wc/v3/products/${id}?${this.authParams}`);
      return this.mapWooCommerceProduct(response);
    } catch (error) {
      console.error('Failed to fetch WooCommerce product:', error);
      return null;
    }
  }

  async createProduct(product: Partial<CompleteProduct>): Promise<CompleteProduct> {
    try {
      const wooProduct = this.mapToWooCommerceProduct(product);
      const response = await this.makeRequest(`/wp-json/wc/v3/products?${this.authParams}`, {
        method: 'POST',
        body: JSON.stringify(wooProduct),
      });
      return this.mapWooCommerceProduct(response);
    } catch (error) {
      console.error('Failed to create WooCommerce product:', error);
      throw error;
    }
  }

  async updateProduct(id: string, product: Partial<CompleteProduct>): Promise<CompleteProduct> {
    try {
      const wooProduct = this.mapToWooCommerceProduct(product);
      const response = await this.makeRequest(`/wp-json/wc/v3/products/${id}?${this.authParams}`, {
        method: 'PUT',
        body: JSON.stringify(wooProduct),
      });
      return this.mapWooCommerceProduct(response);
    } catch (error) {
      console.error('Failed to update WooCommerce product:', error);
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      await this.makeRequest(`/wp-json/wc/v3/products/${id}?${this.authParams}&force=true`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('Failed to delete WooCommerce product:', error);
      return false;
    }
  }

  async fetchOrders(options?: FetchOptions): Promise<CompleteOrder[]> {
    try {
      const params = new URLSearchParams(this.authParams);
      
      if (options?.limit) params.append('per_page', Math.min(options.limit, 100).toString());
      if (options?.page) params.append('page', options.page.toString());
      if (options?.updated_at_min) params.append('modified_after', options.updated_at_min);
      
      const response = await this.makeRequest(`/wp-json/wc/v3/orders?${params}`);
      return response.map(this.mapWooCommerceOrder);
    } catch (error) {
      console.error('Failed to fetch WooCommerce orders:', error);
      throw error;
    }
  }

  async fetchOrder(id: string): Promise<CompleteOrder | null> {
    try {
      const response = await this.makeRequest(`/wp-json/wc/v3/orders/${id}?${this.authParams}`);
      return this.mapWooCommerceOrder(response);
    } catch (error) {
      console.error('Failed to fetch WooCommerce order:', error);
      return null;
    }
  }

  async updateOrderStatus(id: string, status: string): Promise<CompleteOrder> {
    try {
      const response = await this.makeRequest(`/wp-json/wc/v3/orders/${id}?${this.authParams}`, {
        method: 'PUT',
        body: JSON.stringify({ status: this.mapToWooCommerceStatus(status) }),
      });
      return this.mapWooCommerceOrder(response);
    } catch (error) {
      console.error('Failed to update WooCommerce order status:', error);
      throw error;
    }
  }

  async fulfillOrder(id: string, trackingNumber?: string, trackingCompany?: string): Promise<CompleteOrder> {
    try {
      const updateData: any = { status: 'completed' };
      
      if (trackingNumber || trackingCompany) {
        updateData.meta_data = [
          { key: '_tracking_number', value: trackingNumber },
          { key: '_tracking_provider', value: trackingCompany },
        ];
      }
      
      const response = await this.makeRequest(`/wp-json/wc/v3/orders/${id}?${this.authParams}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      return this.mapWooCommerceOrder(response);
    } catch (error) {
      console.error('Failed to fulfill WooCommerce order:', error);
      throw error;
    }
  }

  async fetchCustomers(options?: FetchOptions): Promise<CompleteCustomer[]> {
    try {
      const params = new URLSearchParams(this.authParams);
      
      if (options?.limit) params.append('per_page', Math.min(options.limit, 100).toString());
      if (options?.page) params.append('page', options.page.toString());
      
      const response = await this.makeRequest(`/wp-json/wc/v3/customers?${params}`);
      return response.map(this.mapWooCommerceCustomer);
    } catch (error) {
      console.error('Failed to fetch WooCommerce customers:', error);
      throw error;
    }
  }

  async fetchCustomer(id: string): Promise<CompleteCustomer | null> {
    try {
      const response = await this.makeRequest(`/wp-json/wc/v3/customers/${id}?${this.authParams}`);
      return this.mapWooCommerceCustomer(response);
    } catch (error) {
      console.error('Failed to fetch WooCommerce customer:', error);
      return null;
    }
  }

  async createCustomer(customer: Partial<CompleteCustomer>): Promise<CompleteCustomer> {
    try {
      const wooCustomer = this.mapToWooCommerceCustomer(customer);
      const response = await this.makeRequest(`/wp-json/wc/v3/customers?${this.authParams}`, {
        method: 'POST',
        body: JSON.stringify(wooCustomer),
      });
      return this.mapWooCommerceCustomer(response);
    } catch (error) {
      console.error('Failed to create WooCommerce customer:', error);
      throw error;
    }
  }

  async updateCustomer(id: string, customer: Partial<CompleteCustomer>): Promise<CompleteCustomer> {
    try {
      const wooCustomer = this.mapToWooCommerceCustomer(customer);
      const response = await this.makeRequest(`/wp-json/wc/v3/customers/${id}?${this.authParams}`, {
        method: 'PUT',
        body: JSON.stringify(wooCustomer),
      });
      return this.mapWooCommerceCustomer(response);
    } catch (error) {
      console.error('Failed to update WooCommerce customer:', error);
      throw error;
    }
  }

  async setupWebhooks(events: string[]): Promise<string[]> {
    const webhookIds: string[] = [];
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com' 
      : 'https://your-ngrok-url.com';
    
    for (const event of events) {
      try {
        const webhook = {
          name: `DropCraftAI ${event}`,
          status: 'active',
          topic: event,
          delivery_url: `${baseUrl}/api/webhooks/woocommerce/${event}`,
        };
        
        const response = await this.makeRequest(`/wp-json/wc/v3/webhooks?${this.authParams}`, {
          method: 'POST',
          body: JSON.stringify(webhook),
        });
        
        webhookIds.push(response.id.toString());
      } catch (error) {
        console.error(`Failed to create webhook for ${event}:`, error);
      }
    }
    
    return webhookIds;
  }

  verifyWebhook(payload: string, signature: string): boolean {
    try {
      const secret = this.credentials.webhook_secret || '';
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('base64');
      
      return signature === expectedSignature;
    } catch (error) {
      console.error('Webhook verification failed:', error);
      return false;
    }
  }

  async processWebhookEvent(event: WebhookEvent): Promise<void> {
    try {
      console.log(`Processing WooCommerce webhook: ${(event as any).type}`, (event as any).data);
      // Implement webhook processing logic here
    } catch (error) {
      console.error('Failed to process webhook event:', error);
      throw error;
    }
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
      execution_time_ms: 0,
    };

    try {
      const fetchOptions: FetchOptions = {
        limit: 100,
        page: 1,
      };

      if (options?.since) {
        fetchOptions.updated_at_min = options.since.toISOString();
      }

      let hasMorePages = true;
      
      while (hasMorePages) {
        const products = await this.fetchProducts(fetchOptions);
        result.total += products.length;
        
        for (const product of products) {
          try {
            // Process each product (save to database, etc.)
            result.imported++;
          } catch (error) {
            result.errors.push({
              entity_id: product.id,
              entity_type: 'product',
              error_code: 'SYNC_ERROR',
              error_message: error instanceof Error ? error.message : 'Unknown error',
              retry_count: 0,
              timestamp: new Date().toISOString(),
            });
          }
        }
        
        hasMorePages = products.length === fetchOptions.limit!;
        if (hasMorePages) {
          fetchOptions.page = (fetchOptions.page || 1) + 1;
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push({
        entity_type: 'sync',
        error_code: 'SYNC_FAILED',
        error_message: error instanceof Error ? error.message : 'Unknown sync error',
        retry_count: 0,
        timestamp: new Date().toISOString(),
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
      execution_time_ms: 0,
    };

    try {
      const fetchOptions: FetchOptions = {
        limit: 100,
        page: 1,
      };

      if (options?.since) {
        fetchOptions.updated_at_min = options.since.toISOString();
      }

      let hasMorePages = true;
      
      while (hasMorePages) {
        const orders = await this.fetchOrders(fetchOptions);
        result.total += orders.length;
        
        for (const order of orders) {
          try {
            // Process each order (save to database, etc.)
            result.imported++;
          } catch (error) {
            result.errors.push({
              entity_id: order.id,
              entity_type: 'order',
              error_code: 'SYNC_ERROR',
              error_message: error instanceof Error ? error.message : 'Unknown error',
              retry_count: 0,
              timestamp: new Date().toISOString(),
            });
          }
        }
        
        hasMorePages = orders.length === fetchOptions.limit!;
        if (hasMorePages) {
          fetchOptions.page = (fetchOptions.page || 1) + 1;
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push({
        entity_type: 'sync',
        error_code: 'SYNC_FAILED',
        error_message: error instanceof Error ? error.message : 'Unknown sync error',
        retry_count: 0,
        timestamp: new Date().toISOString(),
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
      execution_time_ms: 0,
    };

    try {
      const fetchOptions: FetchOptions = {
        limit: 100,
        page: 1,
      };

      let hasMorePages = true;
      
      while (hasMorePages) {
        const customers = await this.fetchCustomers(fetchOptions);
        result.total += customers.length;
        
        for (const customer of customers) {
          try {
            // Process each customer (save to database, etc.)
            result.imported++;
          } catch (error) {
            result.errors.push({
              entity_id: customer.id,
              entity_type: 'customer',
              error_code: 'SYNC_ERROR',
              error_message: error instanceof Error ? error.message : 'Unknown error',
              retry_count: 0,
              timestamp: new Date().toISOString(),
            });
          }
        }
        
        hasMorePages = customers.length === fetchOptions.limit!;
        if (hasMorePages) {
          fetchOptions.page = (fetchOptions.page || 1) + 1;
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push({
        entity_type: 'sync',
        error_code: 'SYNC_FAILED',
        error_message: error instanceof Error ? error.message : 'Unknown sync error',
        retry_count: 0,
        timestamp: new Date().toISOString(),
      });
    }

    result.execution_time_ms = Date.now() - startTime;
    return result;
  }

  protected async makeRequest(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private mapWooCommerceProduct = (wooProduct: any): CompleteProduct => {
    return {
      id: wooProduct.id.toString(),
      title: wooProduct.name,
      body_html: wooProduct.description || wooProduct.short_description || '',
      vendor: wooProduct.attributes?.find((attr: any) => attr.name === 'Brand')?.options?.[0],
      product_type: wooProduct.categories?.[0]?.name,
      handle: wooProduct.slug,
      created_at: wooProduct.date_created,
      updated_at: wooProduct.date_modified,
      status: wooProduct.status === 'publish' ? 'active' : 'draft',
      tags: wooProduct.tags?.map((tag: any) => tag.name) || [],
      options: [],
      variants: wooProduct.variations?.map((variantId: number) => ({
        id: variantId.toString(),
        title: wooProduct.name,
        price: wooProduct.price || '0',
        sku: wooProduct.sku,
        inventory_quantity: wooProduct.stock_quantity || 0,
        weight: wooProduct.weight ? parseFloat(wooProduct.weight) : 0,
        requires_shipping: true,
        taxable: true,
        barcode: '',
        fulfillment_service: 'manual',
        inventory_management: 'manual',
        inventory_policy: 'deny',
        compare_at_price: wooProduct.sale_price ? wooProduct.regular_price : undefined,
        position: 1,
        option1: null,
        option2: null,
        option3: null,
        created_at: wooProduct.date_created,
        updated_at: wooProduct.date_modified,
        inventory_item_id: '',
        old_inventory_quantity: 0,
        image_id: null,
        admin_graphql_api_id: '',
      })) || [],
      images: wooProduct.images?.map((img: any, index: number) => ({
        id: `${index}`,
        src: img.src,
        alt: img.alt || wooProduct.name,
        position: index + 1,
        width: img.width,
        height: img.height,
        created_at: wooProduct.date_created,
        updated_at: wooProduct.date_modified,
      })) || [],
      seo: {
        title: wooProduct.meta_data?.find((meta: any) => meta.key === '_yoast_wpseo_title')?.value || wooProduct.name,
        description: wooProduct.meta_data?.find((meta: any) => meta.key === '_yoast_wpseo_metadesc')?.value || '',
      },
      supplier_id: this.userId,
      supplier_name: 'WooCommerce Store',
    };
  };

  private mapWooCommerceOrder = (wooOrder: any): CompleteOrder => {
    return {
      id: wooOrder.id.toString(),
      order_number: wooOrder.number || wooOrder.id.toString(),
      name: wooOrder.number || wooOrder.id.toString(),
      total_price: wooOrder.total,
      subtotal_price: (parseFloat(wooOrder.total) - parseFloat(wooOrder.total_tax || '0')).toString(),
      total_tax: wooOrder.total_tax || '0',
      taxes_included: false,
      total_discounts: wooOrder.discount_total || '0',
      total_line_items_price: wooOrder.total,
      currency: wooOrder.currency,
      email: wooOrder.billing?.email,
      financial_status: this.mapWooCommerceOrderStatus(wooOrder.status),
      fulfillment_status: wooOrder.status === 'completed' ? 'fulfilled' : null,
      test: false,
      buyer_accepts_marketing: false,
      created_at: wooOrder.date_created,
      updated_at: wooOrder.date_modified,
      shipping_lines: [],
      tax_lines: [],
      billing_address: {
        first_name: wooOrder.billing?.first_name,
        last_name: wooOrder.billing?.last_name,
        company: wooOrder.billing?.company,
        address1: wooOrder.billing?.address_1,
        address2: wooOrder.billing?.address_2,
        city: wooOrder.billing?.city,
        province: wooOrder.billing?.state,
        country: wooOrder.billing?.country,
        zip: wooOrder.billing?.postcode,
        phone: wooOrder.billing?.phone,
      },
      shipping_address: {
        first_name: wooOrder.shipping?.first_name,
        last_name: wooOrder.shipping?.last_name,
        company: wooOrder.shipping?.company,
        address1: wooOrder.shipping?.address_1,
        address2: wooOrder.shipping?.address_2,
        city: wooOrder.shipping?.city,
        province: wooOrder.shipping?.state,
        country: wooOrder.shipping?.country,
        zip: wooOrder.shipping?.postcode,
      },
      line_items: wooOrder.line_items?.map((item: any) => ({
        id: item.id.toString(),
        product_id: item.product_id?.toString(),
        variant_id: item.variation_id?.toString(),
        name: item.name,
        title: item.name,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price?.toString() || '0',
        total_discount: '0',
        requires_shipping: true,
        taxable: true,
        gift_card: false,
        fulfillment_service: 'manual',
        grams: 0,
        tax_lines: [],
        discount_allocations: [],
        duties: [],
        properties: [],
      })) || [],
    };
  };

  private mapWooCommerceCustomer = (wooCustomer: any): CompleteCustomer => {
    return {
      id: wooCustomer.id.toString(),
      email: wooCustomer.email,
      first_name: wooCustomer.first_name,
      last_name: wooCustomer.last_name,
      phone: wooCustomer.billing?.phone,
      created_at: wooCustomer.date_created,
      updated_at: wooCustomer.date_modified,
      orders_count: 0,
      state: 'enabled',
      total_spent: '0.00',
      verified_email: true,
      multipass_identifier: null,
      marketing_opt_in_level: null,
      email_marketing_consent: null,
      sms_marketing_consent: null,
      tax_exempt: false,
      currency: 'EUR',
      accepts_marketing: true,
      platform_id: this.userId,
      platform_customer_id: wooCustomer.id.toString(),
      addresses: [{
        first_name: wooCustomer.billing?.first_name,
        last_name: wooCustomer.billing?.last_name,
        company: wooCustomer.billing?.company,
        address1: wooCustomer.billing?.address_1,
        address2: wooCustomer.billing?.address_2,
        city: wooCustomer.billing?.city,
        province: wooCustomer.billing?.state,
        country: wooCustomer.billing?.country,
        zip: wooCustomer.billing?.postcode,
        phone: wooCustomer.billing?.phone,
        default: true,
      }],
    };
  };

  private mapToWooCommerceProduct(product: Partial<CompleteProduct>): any {
    return {
      name: product.title,
      type: 'simple',
      regular_price: product.variants?.[0]?.price || '0',
      description: product.body_html,
      short_description: product.body_html?.substring(0, 160),
      sku: product.variants?.[0]?.sku,
      manage_stock: true,
      stock_quantity: product.variants?.[0]?.inventory_quantity || 0,
      stock_status: (product.variants?.[0]?.inventory_quantity || 0) > 0 ? 'instock' : 'outofstock',
      categories: product.product_type ? [{ name: product.product_type }] : [],
      tags: product.tags?.map(tag => ({ name: tag })) || [],
      images: product.images?.map(img => ({
        src: img.src,
        alt: img.alt || product.title,
      })) || [],
      weight: product.weight?.toString(),
    };
  }

  private mapToWooCommerceCustomer(customer: Partial<CompleteCustomer>): any {
    return {
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      billing: customer.addresses?.[0] ? {
        first_name: customer.addresses[0].first_name,
        last_name: customer.addresses[0].last_name,
        company: customer.addresses[0].company,
        address_1: customer.addresses[0].address1,
        address_2: customer.addresses[0].address2,
        city: customer.addresses[0].city,
        state: customer.addresses[0].province,
        postcode: customer.addresses[0].zip,
        country: customer.addresses[0].country,
        phone: customer.addresses[0].phone,
      } : {},
    };
  }

  private mapWooCommerceOrderStatus(status: string): 'pending' | 'authorized' | 'paid' | 'partially_paid' | 'refunded' | 'voided' | 'partially_refunded' {
    const statusMap: Record<string, 'pending' | 'authorized' | 'paid' | 'partially_paid' | 'refunded' | 'voided' | 'partially_refunded'> = {
      'pending': 'pending',
      'processing': 'authorized', 
      'on-hold': 'pending',
      'completed': 'paid',
      'cancelled': 'voided',
      'refunded': 'refunded',
      'failed': 'voided',
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