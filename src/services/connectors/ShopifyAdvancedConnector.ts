import { AdvancedBaseConnector, FetchOptions, SyncResult, PlatformLimits, PlatformCapabilities, PlatformCredentials } from './AdvancedBaseConnector';
import { CompleteProduct, CompleteOrder, CompleteCustomer, WebhookEvent } from '@/types/ecommerce';
import crypto from 'crypto';

export class ShopifyAdvancedConnector extends AdvancedBaseConnector {
  
  constructor(credentials: PlatformCredentials, userId: string, shopId?: string) {
    super(credentials, 'shopify', userId, shopId);
  }

  protected buildBaseUrl(): string {
    const shopName = this.credentials.shop_url?.replace('.myshopify.com', '').replace('https://', '').replace('http://', '');
    return `https://${shopName}.myshopify.com/admin/api/${this.credentials.api_version || '2023-10'}/`;
  }

  protected getAuthHeaders(): Record<string, string> {
    if (this.credentials.accessToken) {
      return {
        'X-Shopify-Access-Token': this.credentials.accessToken
      };
    }
    
    if (this.credentials.apiKey && this.credentials.password) {
      const auth = Buffer.from(`${this.credentials.apiKey}:${this.credentials.password}`).toString('base64');
      return {
        'Authorization': `Basic ${auth}`
      };
    }

    throw new Error('Missing Shopify authentication credentials');
  }

  protected getPlatformLimits(): PlatformLimits {
    return {
      requests_per_second: 2,
      requests_per_minute: 40,
      requests_per_hour: 1000,
      requests_per_day: 10000,
      max_results_per_page: 250,
      webhook_timeout_seconds: 5
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
        delete: false, // Shopify ne permet pas de supprimer les clients
        addresses: true,
        marketing_consent: true
      },
      webhooks: {
        supported: true,
        events: [
          'products/create', 'products/update', 'products/delete',
          'orders/create', 'orders/updated', 'orders/paid', 'orders/cancelled',
          'customers/create', 'customers/update', 'customers/delete',
          'inventory_levels/update', 'inventory_levels/connect', 'inventory_levels/disconnect'
        ],
        verification: 'hmac'
      },
      inventory: {
        locations: true,
        tracking: true,
        reservations: true
      }
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('shop.json');
      return true;
    } catch (error) {
      console.error('Shopify connection test failed:', error);
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<CompleteProduct[]> {
    try {
      const params = new URLSearchParams();
      
      if (options.limit) params.append('limit', Math.min(options.limit, 250).toString());
      if (options.since_id) params.append('since_id', options.since_id);
      if (options.created_at_min) params.append('created_at_min', options.created_at_min);
      if (options.created_at_max) params.append('created_at_max', options.created_at_max);
      if (options.updated_at_min) params.append('updated_at_min', options.updated_at_min);
      if (options.updated_at_max) params.append('updated_at_max', options.updated_at_max);
      if (options.published_status) params.append('published_status', options.published_status);
      if (options.fields) params.append('fields', options.fields);

      const response = await this.makeRequest(`products.json?${params.toString()}`);
      
      return response.products.map((product: any) => this.normalizeProduct(product));
    } catch (error) {
      console.error('Error fetching Shopify products:', error);
      return [];
    }
  }

  async fetchProduct(id: string): Promise<CompleteProduct | null> {
    try {
      const response = await this.makeRequest(`products/${id}.json`);
      return this.normalizeProduct(response.product);
    } catch (error) {
      console.error(`Error fetching Shopify product ${id}:`, error);
      return null;
    }
  }

  async createProduct(product: Partial<CompleteProduct>): Promise<CompleteProduct> {
    try {
      const shopifyProduct = this.denormalizeProduct(product);
      const response = await this.makeRequest('products.json', {
        method: 'POST',
        body: JSON.stringify({ product: shopifyProduct })
      });
      return this.normalizeProduct(response.product);
    } catch (error) {
      console.error('Error creating Shopify product:', error);
      throw error;
    }
  }

  async updateProduct(id: string, product: Partial<CompleteProduct>): Promise<CompleteProduct> {
    try {
      const shopifyProduct = this.denormalizeProduct(product);
      const response = await this.makeRequest(`products/${id}.json`, {
        method: 'PUT',
        body: JSON.stringify({ product: shopifyProduct })
      });
      return this.normalizeProduct(response.product);
    } catch (error) {
      console.error(`Error updating Shopify product ${id}:`, error);
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      await this.makeRequest(`products/${id}.json`, { method: 'DELETE' });
      return true;
    } catch (error) {
      console.error(`Error deleting Shopify product ${id}:`, error);
      return false;
    }
  }

  async fetchOrders(options: FetchOptions = {}): Promise<CompleteOrder[]> {
    try {
      const params = new URLSearchParams();
      
      if (options.limit) params.append('limit', Math.min(options.limit, 250).toString());
      if (options.since_id) params.append('since_id', options.since_id);
      if (options.created_at_min) params.append('created_at_min', options.created_at_min);
      if (options.created_at_max) params.append('created_at_max', options.created_at_max);
      if (options.updated_at_min) params.append('updated_at_min', options.updated_at_min);
      if (options.updated_at_max) params.append('updated_at_max', options.updated_at_max);

      const response = await this.makeRequest(`orders.json?${params.toString()}`);
      
      return response.orders.map((order: any) => this.normalizeOrder(order));
    } catch (error) {
      console.error('Error fetching Shopify orders:', error);
      return [];
    }
  }

  async fetchOrder(id: string): Promise<CompleteOrder | null> {
    try {
      const response = await this.makeRequest(`orders/${id}.json`);
      return this.normalizeOrder(response.order);
    } catch (error) {
      console.error(`Error fetching Shopify order ${id}:`, error);
      return null;
    }
  }

  async updateOrderStatus(id: string, status: string): Promise<CompleteOrder> {
    try {
      // Shopify utilise différents endpoints selon le type de status
      if (['fulfilled', 'partial'].includes(status)) {
        return this.fulfillOrder(id);
      }
      
      const response = await this.makeRequest(`orders/${id}.json`, {
        method: 'PUT',
        body: JSON.stringify({
          order: {
            id: id,
            // Shopify ne permet pas de modifier directement le financial_status
            // Il faut utiliser les transactions
          }
        })
      });
      
      return this.normalizeOrder(response.order);
    } catch (error) {
      console.error(`Error updating Shopify order ${id} status:`, error);
      throw error;
    }
  }

  async fulfillOrder(id: string, trackingNumber?: string, trackingCompany?: string): Promise<CompleteOrder> {
    try {
      const fulfillmentData: any = {
        location_id: null, // Auto-select location
        notify_customer: true
      };

      if (trackingNumber) {
        fulfillmentData.tracking_number = trackingNumber;
      }
      if (trackingCompany) {
        fulfillmentData.tracking_company = trackingCompany;
      }

      await this.makeRequest(`orders/${id}/fulfillments.json`, {
        method: 'POST',
        body: JSON.stringify({ fulfillment: fulfillmentData })
      });

      // Récupérer la commande mise à jour
      return this.fetchOrder(id) as Promise<CompleteOrder>;
    } catch (error) {
      console.error(`Error fulfilling Shopify order ${id}:`, error);
      throw error;
    }
  }

  async fetchCustomers(options: FetchOptions = {}): Promise<CompleteCustomer[]> {
    try {
      const params = new URLSearchParams();
      
      if (options.limit) params.append('limit', Math.min(options.limit, 250).toString());
      if (options.since_id) params.append('since_id', options.since_id);
      if (options.created_at_min) params.append('created_at_min', options.created_at_min);
      if (options.created_at_max) params.append('created_at_max', options.created_at_max);
      if (options.updated_at_min) params.append('updated_at_min', options.updated_at_min);
      if (options.updated_at_max) params.append('updated_at_max', options.updated_at_max);

      const response = await this.makeRequest(`customers.json?${params.toString()}`);
      
      return response.customers.map((customer: any) => this.normalizeCustomer(customer));
    } catch (error) {
      console.error('Error fetching Shopify customers:', error);
      return [];
    }
  }

  async fetchCustomer(id: string): Promise<CompleteCustomer | null> {
    try {
      const response = await this.makeRequest(`customers/${id}.json`);
      return this.normalizeCustomer(response.customer);
    } catch (error) {
      console.error(`Error fetching Shopify customer ${id}:`, error);
      return null;
    }
  }

  async createCustomer(customer: Partial<CompleteCustomer>): Promise<CompleteCustomer> {
    try {
      const shopifyCustomer = this.denormalizeCustomer(customer);
      const response = await this.makeRequest('customers.json', {
        method: 'POST',
        body: JSON.stringify({ customer: shopifyCustomer })
      });
      return this.normalizeCustomer(response.customer);
    } catch (error) {
      console.error('Error creating Shopify customer:', error);
      throw error;
    }
  }

  async updateCustomer(id: string, customer: Partial<CompleteCustomer>): Promise<CompleteCustomer> {
    try {
      const shopifyCustomer = this.denormalizeCustomer(customer);
      const response = await this.makeRequest(`customers/${id}.json`, {
        method: 'PUT',
        body: JSON.stringify({ customer: shopifyCustomer })
      });
      return this.normalizeCustomer(response.customer);
    } catch (error) {
      console.error(`Error updating Shopify customer ${id}:`, error);
      throw error;
    }
  }

  async setupWebhooks(events: string[]): Promise<string[]> {
    try {
      const webhookIds: string[] = [];
      const baseUrl = process.env.WEBHOOK_BASE_URL || 'https://your-app.com/webhooks';
      
      for (const event of events) {
        const webhook = {
          webhook: {
            topic: event,
            address: `${baseUrl}/shopify/${event.replace('/', '_')}`,
            format: 'json'
          }
        };

        const response = await this.makeRequest('webhooks.json', {
          method: 'POST',
          body: JSON.stringify(webhook)
        });

        webhookIds.push(response.webhook.id.toString());
      }

      return webhookIds;
    } catch (error) {
      console.error('Error setting up Shopify webhooks:', error);
      throw error;
    }
  }

  verifyWebhook(payload: string, signature: string): boolean {
    if (!this.credentials.webhook_secret) {
      return false;
    }

    try {
      const hmac = crypto
        .createHmac('sha256', this.credentials.webhook_secret)
        .update(payload, 'utf8')
        .digest('base64');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'base64'),
        Buffer.from(hmac, 'base64')
      );
    } catch (error) {
      console.error('Error verifying Shopify webhook:', error);
      return false;
    }
  }

  async processWebhookEvent(event: WebhookEvent): Promise<void> {
    try {
      switch (event.topic) {
        case 'products/create':
        case 'products/update':
          await this.handleProductWebhook(event);
          break;
        case 'products/delete':
          await this.handleProductDeleteWebhook(event);
          break;
        case 'orders/create':
        case 'orders/updated':
        case 'orders/paid':
        case 'orders/cancelled':
          await this.handleOrderWebhook(event);
          break;
        case 'customers/create':
        case 'customers/update':
          await this.handleCustomerWebhook(event);
          break;
        case 'inventory_levels/update':
          await this.handleInventoryWebhook(event);
          break;
        default:
          console.log(`Unhandled Shopify webhook event: ${event.topic}`);
      }
    } catch (error) {
      console.error(`Error processing Shopify webhook ${event.topic}:`, error);
      throw error;
    }
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
      const fetchOptions: FetchOptions = {
        limit: 250
      };

      if (options.incremental && options.since) {
        fetchOptions.updated_at_min = options.since.toISOString();
      }

      const products = await this.fetchAllPages(async (page) => {
        if (page > 1) {
          // Utiliser cursor-based pagination pour les pages suivantes
          // Implementation dépendante de votre système de stockage
        }
        
        const pageProducts = await this.fetchProducts(fetchOptions);
        return {
          data: pageProducts,
          hasMore: pageProducts.length === 250
        };
      });

      result.total = products.length;

      for (const product of products) {
        try {
          // Ici vous devriez sauvegarder le produit dans votre base de données
          // et déterminer si c'est un import ou une mise à jour
          
          // Exemple d'appel à votre service de sauvegarde
          // const saved = await this.saveProductToDatabase(product);
          // if (saved.isNew) {
          //   result.imported++;
          // } else {
          //   result.updated++;
          // }
          
          result.imported++; // Temporaire
        } catch (error) {
          result.errors.push(this.logError('sync_product', error, product.id));
        }
      }

      result.success = result.errors.length === 0;
      result.execution_time_ms = Date.now() - startTime;

      return result;
    } catch (error) {
      result.errors.push(this.logError('sync_products', error));
      result.execution_time_ms = Date.now() - startTime;
      return result;
    }
  }

  async syncOrders(options: { incremental?: boolean; since?: Date } = {}): Promise<SyncResult> {
    // Implementation similaire à syncProducts
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
      const fetchOptions: FetchOptions = {
        limit: 250
      };

      if (options.incremental && options.since) {
        fetchOptions.updated_at_min = options.since.toISOString();
      }

      const orders = await this.fetchOrders(fetchOptions);
      result.total = orders.length;
      result.imported = orders.length;
      result.success = true;
      result.execution_time_ms = Date.now() - startTime;

      return result;
    } catch (error) {
      result.errors.push(this.logError('sync_orders', error));
      result.execution_time_ms = Date.now() - startTime;
      return result;
    }
  }

  async syncCustomers(options: { incremental?: boolean; since?: Date } = {}): Promise<SyncResult> {
    // Implementation similaire à syncProducts
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
      const fetchOptions: FetchOptions = {
        limit: 250
      };

      if (options.incremental && options.since) {
        fetchOptions.updated_at_min = options.since.toISOString();
      }

      const customers = await this.fetchCustomers(fetchOptions);
      result.total = customers.length;
      result.imported = customers.length;
      result.success = true;
      result.execution_time_ms = Date.now() - startTime;

      return result;
    } catch (error) {
      result.errors.push(this.logError('sync_customers', error));
      result.execution_time_ms = Date.now() - startTime;
      return result;
    }
  }

  // Méthodes privées pour la conversion de données

  private denormalizeProduct(product: Partial<CompleteProduct>): any {
    return {
      title: product.title,
      body_html: product.body_html,
      vendor: product.vendor,
      product_type: product.product_type,
      handle: product.handle,
      published: product.status === 'active',
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : product.tags,
      variants: product.variants?.map(v => ({
        sku: v.sku,
        title: v.title,
        price: v.price.toString(),
        inventory_quantity: v.inventory_quantity,
        weight: v.weight,
        weight_unit: v.weight_unit,
        barcode: v.barcode,
        compare_at_price: v.compare_at_price?.toString(),
        requires_shipping: v.requires_shipping,
        taxable: v.taxable
      })),
      images: product.images?.map(img => ({
        src: img.src,
        alt: img.alt,
        position: img.position
      })),
      options: product.options?.map(opt => ({
        name: opt.name,
        values: opt.values
      }))
    };
  }

  private denormalizeCustomer(customer: Partial<CompleteCustomer>): any {
    return {
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      phone: customer.phone,
      verified_email: customer.verified_email,
      addresses: customer.addresses?.map(addr => ({
        first_name: addr.first_name,
        last_name: addr.last_name,
        company: addr.company,
        address1: addr.address1,
        address2: addr.address2,
        city: addr.city,
        province: addr.province,
        country: addr.country,
        zip: addr.zip,
        phone: addr.phone,
        default: addr.default
      })),
      accepts_marketing: customer.accepts_marketing,
      tags: customer.tags,
      note: customer.note
    };
  }

  private async handleProductWebhook(event: WebhookEvent): Promise<void> {
    const product = this.normalizeProduct(event.payload);
    // Sauvegarder ou mettre à jour le produit dans votre base de données
    console.log(`Processing product webhook: ${product.id}`);
  }

  private async handleProductDeleteWebhook(event: WebhookEvent): Promise<void> {
    const productId = event.payload.id?.toString();
    // Marquer le produit comme supprimé dans votre base de données
    console.log(`Processing product delete webhook: ${productId}`);
  }

  private async handleOrderWebhook(event: WebhookEvent): Promise<void> {
    const order = this.normalizeOrder(event.payload);
    // Sauvegarder ou mettre à jour la commande dans votre base de données
    console.log(`Processing order webhook: ${order.id}`);
  }

  private async handleCustomerWebhook(event: WebhookEvent): Promise<void> {
    const customer = this.normalizeCustomer(event.payload);
    // Sauvegarder ou mettre à jour le client dans votre base de données
    console.log(`Processing customer webhook: ${customer.id}`);
  }

  private async handleInventoryWebhook(event: WebhookEvent): Promise<void> {
    // Mettre à jour les niveaux de stock
    console.log(`Processing inventory webhook: ${event.payload.inventory_item_id}`);
  }
}