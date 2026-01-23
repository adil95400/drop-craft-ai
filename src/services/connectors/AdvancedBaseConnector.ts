import { CompleteProduct, CompleteOrder, CompleteCustomer, WebhookEvent, SyncConfiguration } from '@/types/ecommerce';
import { SupplierCredentials } from '@/types/suppliers';

export interface PlatformCredentials extends SupplierCredentials {
  shop_url?: string;
  api_version?: string;
  webhook_secret?: string;
}

export interface FetchOptions {
  page?: number;
  limit?: number;
  since_id?: string;
  created_at_min?: string;
  created_at_max?: string;
  updated_at_min?: string;
  updated_at_max?: string;
  published_status?: 'published' | 'unpublished' | 'any';
  fields?: string;
}

export interface SyncResult {
  success: boolean;
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: SyncError[];
  execution_time_ms: number;
}

export interface SyncError {
  entity_id?: string;
  entity_type: string;
  error_code: string;
  error_message: string;
  retry_count: number;
  timestamp: string;
}

export interface PlatformLimits {
  requests_per_second: number;
  requests_per_minute: number;
  requests_per_hour: number;
  requests_per_day: number;
  max_results_per_page: number;
  webhook_timeout_seconds: number;
}

export interface PlatformCapabilities {
  products: {
    read: boolean;
    write: boolean;
    delete: boolean;
    variants: boolean;
    inventory: boolean;
    images: boolean;
    seo: boolean;
    metafields: boolean;
  };
  orders: {
    read: boolean;
    write: boolean;
    fulfill: boolean;
    cancel: boolean;
    refund: boolean;
    tracking: boolean;
  };
  customers: {
    read: boolean;
    write: boolean;
    delete: boolean;
    addresses: boolean;
    marketing_consent: boolean;
  };
  webhooks: {
    supported: boolean;
    events: string[];
    verification: 'none' | 'hmac' | 'bearer';
  };
  inventory: {
    locations: boolean;
    tracking: boolean;
    reservations: boolean;
  };
}

export abstract class AdvancedBaseConnector {
  protected credentials: PlatformCredentials;
  protected baseUrl: string;
  protected platform: string;
  protected userId: string;
  protected shopId?: string;
  
  // Rate limiting
  private lastRequestTime = 0;
  private requestQueue: (() => Promise<void>)[] = [];
  private isProcessingQueue = false;

  constructor(
    credentials: PlatformCredentials,
    platform: string,
    userId: string,
    shopId?: string
  ) {
    this.credentials = credentials;
    this.platform = platform;
    this.userId = userId;
    this.shopId = shopId;
    this.baseUrl = this.buildBaseUrl();
  }

  // Méthodes abstraites à implémenter par chaque plateforme
  protected abstract buildBaseUrl(): string;
  protected abstract getAuthHeaders(): Record<string, string>;
  protected abstract getPlatformLimits(): PlatformLimits;
  protected abstract getPlatformCapabilities(): PlatformCapabilities;
  
  // Validation et test de connexion
  abstract testConnection(): Promise<boolean>;
  
  // Produits
  abstract fetchProducts(options?: FetchOptions): Promise<CompleteProduct[]>;
  abstract fetchProduct(id: string): Promise<CompleteProduct | null>;
  abstract createProduct(product: Partial<CompleteProduct>): Promise<CompleteProduct>;
  abstract updateProduct(id: string, product: Partial<CompleteProduct>): Promise<CompleteProduct>;
  abstract deleteProduct(id: string): Promise<boolean>;
  
  // Commandes
  abstract fetchOrders(options?: FetchOptions): Promise<CompleteOrder[]>;
  abstract fetchOrder(id: string): Promise<CompleteOrder | null>;
  abstract updateOrderStatus(id: string, status: string): Promise<CompleteOrder>;
  abstract fulfillOrder(id: string, trackingNumber?: string, trackingCompany?: string): Promise<CompleteOrder>;
  
  // Clients
  abstract fetchCustomers(options?: FetchOptions): Promise<CompleteCustomer[]>;
  abstract fetchCustomer(id: string): Promise<CompleteCustomer | null>;
  abstract createCustomer(customer: Partial<CompleteCustomer>): Promise<CompleteCustomer>;
  abstract updateCustomer(id: string, customer: Partial<CompleteCustomer>): Promise<CompleteCustomer>;
  
  // Webhooks
  abstract setupWebhooks(events: string[]): Promise<string[]>; // Retourne les IDs des webhooks créés
  abstract verifyWebhook(payload: string, signature: string): boolean;
  abstract processWebhookEvent(event: WebhookEvent): Promise<void>;
  
  // Synchronisation
  abstract syncProducts(options?: { incremental?: boolean; since?: Date }): Promise<SyncResult>;
  abstract syncOrders(options?: { incremental?: boolean; since?: Date }): Promise<SyncResult>;
  abstract syncCustomers(options?: { incremental?: boolean; since?: Date }): Promise<SyncResult>;
  
  // Gestion des quotas et rate limiting
  protected async enforceRateLimit(): Promise<void> {
    const limits = this.getPlatformLimits();
    const minDelay = 1000 / limits.requests_per_second;
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    
    if (timeSinceLastRequest < minDelay) {
      await this.delay(minDelay - timeSinceLastRequest);
    }
    
    this.lastRequestTime = Date.now();
  }

  protected async makeRequest(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<any> {
    await this.enforceRateLimit();
    
    const url = `${this.baseUrl}${endpoint}`;
    const maxRetries = 3;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ShopOpti/1.0',
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      // Gestion des erreurs de rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after') || '60';
        await this.delay(parseInt(retryAfter) * 1000);
        
        if (retryCount < maxRetries) {
          return this.makeRequest(endpoint, options, retryCount + 1);
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (retryCount < maxRetries) {
        await this.delay(Math.pow(2, retryCount) * 1000); // Exponential backoff
        return this.makeRequest(endpoint, options, retryCount + 1);
      }
      throw error;
    }
  }

  // Normalisation des données
  protected normalizeProduct(rawProduct: any): CompleteProduct {
    const baseProduct = {
      id: rawProduct.id?.toString() || '',
      title: rawProduct.title || rawProduct.name || '',
      body_html: rawProduct.body_html || rawProduct.description || '',
      vendor: rawProduct.vendor || rawProduct.brand || '',
      product_type: rawProduct.product_type || rawProduct.type || '',
      handle: rawProduct.handle || this.generateHandle(rawProduct.title || rawProduct.name),
      created_at: rawProduct.created_at || new Date().toISOString(),
      updated_at: rawProduct.updated_at || new Date().toISOString(),
      published_at: rawProduct.published_at,
      status: this.normalizeStatus(rawProduct.status || rawProduct.published),
      tags: Array.isArray(rawProduct.tags) ? rawProduct.tags : 
            typeof rawProduct.tags === 'string' ? rawProduct.tags.split(',').map(t => t.trim()) : [],
      
      variants: this.normalizeVariants(rawProduct.variants || [rawProduct]),
      images: this.normalizeImages(rawProduct.images || []),
      options: this.normalizeOptions(rawProduct.options || []),
      
      seo: {
        title: rawProduct.seo_title || rawProduct.meta_title,
        description: rawProduct.seo_description || rawProduct.meta_description,
        handle: rawProduct.handle,
        meta_title: rawProduct.meta_title,
        meta_description: rawProduct.meta_description,
        keywords: rawProduct.keywords || []
      },
      
      supplier_id: this.platform,
      supplier_name: this.platform,
      supplier_sku: rawProduct.sku,
      
      last_sync_at: new Date().toISOString(),
      sync_status: 'synced' as const
    };

    return baseProduct;
  }

  protected normalizeOrder(rawOrder: any): CompleteOrder {
    return {
      id: rawOrder.id?.toString() || '',
      order_number: rawOrder.order_number || rawOrder.number,
      name: rawOrder.name || `#${rawOrder.order_number || rawOrder.id}`,
      email: rawOrder.email || rawOrder.customer?.email,
      created_at: rawOrder.created_at || new Date().toISOString(),
      updated_at: rawOrder.updated_at || new Date().toISOString(),
      financial_status: this.normalizeFinancialStatus(rawOrder.financial_status || rawOrder.status),
      fulfillment_status: this.normalizeFulfillmentStatus(rawOrder.fulfillment_status),
      total_price: rawOrder.total_price?.toString() || '0',
      subtotal_price: rawOrder.subtotal_price?.toString() || rawOrder.total_price?.toString() || '0',
      total_tax: rawOrder.total_tax?.toString() || '0',
      currency: rawOrder.currency || 'EUR',
      test: rawOrder.test || false,
      taxes_included: rawOrder.taxes_included || false,
      total_discounts: rawOrder.total_discounts?.toString() || '0',
      total_line_items_price: rawOrder.total_line_items_price?.toString() || rawOrder.subtotal_price?.toString() || '0',
      
      line_items: this.normalizeLineItems(rawOrder.line_items || []),
      shipping_address: this.normalizeAddress(rawOrder.shipping_address),
      billing_address: this.normalizeAddress(rawOrder.billing_address),
      shipping_lines: rawOrder.shipping_lines || [],
      tax_lines: rawOrder.tax_lines || [],
      
      buyer_accepts_marketing: rawOrder.buyer_accepts_marketing || false,
      
      last_sync_at: new Date().toISOString(),
      sync_status: 'synced' as const
    };
  }

  protected normalizeCustomer(rawCustomer: any): CompleteCustomer {
    return {
      id: rawCustomer.id?.toString() || '',
      email: rawCustomer.email || '',
      first_name: rawCustomer.first_name,
      last_name: rawCustomer.last_name,
      created_at: rawCustomer.created_at || new Date().toISOString(),
      updated_at: rawCustomer.updated_at || new Date().toISOString(),
      orders_count: rawCustomer.orders_count || 0,
      total_spent: rawCustomer.total_spent?.toString() || '0',
      currency: rawCustomer.currency || 'EUR',
      state: rawCustomer.state || 'enabled',
      verified_email: rawCustomer.verified_email || false,
      tax_exempt: rawCustomer.tax_exempt || false,
      accepts_marketing: rawCustomer.accepts_marketing || false,
      phone: rawCustomer.phone,
      tags: rawCustomer.tags,
      note: rawCustomer.note,
      
      addresses: rawCustomer.addresses?.map((addr: any) => this.normalizeAddress(addr)) || [],
      
      platform_id: this.platform,
      platform_customer_id: rawCustomer.id?.toString() || '',
      
      last_sync_at: new Date().toISOString(),
      sync_status: 'synced' as const
    };
  }

  // Méthodes utilitaires
  protected generateHandle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  protected normalizeStatus(status: any): 'active' | 'archived' | 'draft' {
    if (typeof status === 'boolean') {
      return status ? 'active' : 'draft';
    }
    
    const statusStr = status?.toString().toLowerCase();
    if (statusStr === 'published' || statusStr === 'active' || statusStr === 'enabled') {
      return 'active';
    }
    if (statusStr === 'archived' || statusStr === 'disabled') {
      return 'archived';
    }
    return 'draft';
  }

  protected normalizeFinancialStatus(status: any): CompleteOrder['financial_status'] {
    const statusStr = status?.toString().toLowerCase();
    const statusMap: Record<string, CompleteOrder['financial_status']> = {
      'pending': 'pending',
      'authorized': 'authorized',
      'paid': 'paid',
      'completed': 'paid',
      'partially_paid': 'partially_paid',
      'refunded': 'refunded',
      'voided': 'voided',
      'partially_refunded': 'partially_refunded',
      'cancelled': 'voided'
    };
    return statusMap[statusStr] || 'pending';
  }

  protected normalizeFulfillmentStatus(status: any): CompleteOrder['fulfillment_status'] {
    if (!status) return null;
    const statusStr = status.toString().toLowerCase();
    if (statusStr === 'fulfilled' || statusStr === 'shipped' || statusStr === 'completed') {
      return 'fulfilled';
    }
    if (statusStr === 'partial' || statusStr === 'partially_shipped') {
      return 'partial';
    }
    if (statusStr === 'restocked') {
      return 'restocked';
    }
    return null;
  }

  protected normalizeVariants(variants: any[]): any[] {
    return variants.map(variant => ({
      id: variant.id?.toString() || '',
      sku: variant.sku || '',
      title: variant.title || 'Default Title',
      price: parseFloat(variant.price) || 0,
      cost_price: parseFloat(variant.cost_price || variant.wholesale_price) || undefined,
      currency: variant.currency || 'EUR',
      inventory_quantity: parseInt(variant.inventory_quantity || variant.stock) || 0,
      weight: parseFloat(variant.weight) || undefined,
      weight_unit: variant.weight_unit || 'kg',
      barcode: variant.barcode || variant.ean || variant.upc,
      compare_at_price: parseFloat(variant.compare_at_price) || undefined,
      requires_shipping: variant.requires_shipping !== false,
      taxable: variant.taxable !== false,
      inventory_management: variant.inventory_management || 'shopify',
      inventory_policy: variant.inventory_policy || 'deny',
      created_at: variant.created_at || new Date().toISOString(),
      updated_at: variant.updated_at || new Date().toISOString(),
      attributes: variant.attributes || {}
    }));
  }

  protected normalizeImages(images: any[]): any[] {
    return images.map((image, index) => ({
      id: image.id?.toString(),
      src: image.src || image.url || image.image_url,
      alt: image.alt || '',
      position: image.position || index + 1,
      width: image.width,
      height: image.height,
      variant_ids: image.variant_ids || [],
      created_at: image.created_at || new Date().toISOString(),
      updated_at: image.updated_at || new Date().toISOString()
    }));
  }

  protected normalizeOptions(options: any[]): any[] {
    return options.map((option, index) => ({
      id: option.id?.toString(),
      name: option.name,
      position: option.position || index + 1,
      values: Array.isArray(option.values) ? option.values : []
    }));
  }

  protected normalizeLineItems(lineItems: any[]): any[] {
    return lineItems.map(item => ({
      id: item.id?.toString(),
      variant_id: item.variant_id?.toString(),
      product_id: item.product_id?.toString() || '',
      name: item.name || item.title || '',
      title: item.title || item.name || '',
      variant_title: item.variant_title,
      sku: item.sku,
      vendor: item.vendor,
      quantity: parseInt(item.quantity) || 1,
      price: item.price?.toString() || '0',
      total_discount: item.total_discount?.toString() || '0',
      requires_shipping: item.requires_shipping !== false,
      taxable: item.taxable !== false,
      gift_card: item.gift_card || false,
      fulfillment_service: item.fulfillment_service || 'manual',
      grams: parseInt(item.grams) || 0,
      tax_lines: item.tax_lines || [],
      discount_allocations: item.discount_allocations || [],
      duties: item.duties || [],
      properties: item.properties || []
    }));
  }

  protected normalizeAddress(address: any): any {
    if (!address) return undefined;
    
    return {
      id: address.id?.toString(),
      first_name: address.first_name,
      last_name: address.last_name,
      company: address.company,
      address1: address.address1 || address.street || '',
      address2: address.address2,
      city: address.city || '',
      province: address.province || address.state || address.region,
      country: address.country || '',
      zip: address.zip || address.postal_code || '',
      phone: address.phone,
      name: address.name || `${address.first_name || ''} ${address.last_name || ''}`.trim(),
      province_code: address.province_code || address.state_code,
      country_code: address.country_code,
      latitude: parseFloat(address.latitude) || undefined,
      longitude: parseFloat(address.longitude) || undefined,
      default: address.default || false
    };
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected logError(context: string, error: any, entityId?: string): SyncError {
    const syncError: SyncError = {
      entity_id: entityId,
      entity_type: context,
      error_code: error.code || 'UNKNOWN_ERROR',
      error_message: error.message || error.toString(),
      retry_count: 0,
      timestamp: new Date().toISOString()
    };

    console.error(`${this.platform} ${context} error:`, syncError);
    return syncError;
  }

  // Pagination helper
  protected async fetchAllPages<T>(
    fetchFunction: (page: number) => Promise<{ data: T[]; hasMore: boolean }>,
    maxPages = 100
  ): Promise<T[]> {
    const allResults: T[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= maxPages) {
      const result = await fetchFunction(page);
      allResults.push(...result.data);
      hasMore = result.hasMore;
      page++;
      
      // Respecter les limits de rate
      await this.delay(100);
    }

    return allResults;
  }
}