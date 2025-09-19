// Types for PR1 - Core Sync connectors

export interface ConnectorCredentials {
  [key: string]: string | number | boolean;
}

export interface ShopifyCredentials extends ConnectorCredentials {
  shop_domain: string;
  access_token: string;
  api_version?: string;
}

export interface WooCommerceCredentials extends ConnectorCredentials {
  site_url: string;
  consumer_key: string;
  consumer_secret: string;
  api_version?: string;
}

export interface AmazonCredentials extends ConnectorCredentials {
  marketplace_id: string;
  merchant_id: string;
  access_key_id: string;
  secret_access_key: string;
  role_arn: string;
  refresh_token: string;
  region: string;
  sandbox?: boolean;
}

export interface EBayCredentials extends ConnectorCredentials {
  app_id: string;
  dev_id: string;
  cert_id: string;
  user_token: string;
  sandbox?: boolean;
}

export interface ProductVariant {
  id?: string;
  sku: string;
  title: string;
  price: number;
  compare_at_price?: number;
  inventory_quantity: number;
  weight?: number;
  image_url?: string;
  attributes: Record<string, string>;
}

export interface ConnectorProduct {
  id?: string;
  external_id: string;
  sku: string;
  title: string;
  description: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  currency: string;
  inventory_quantity: number;
  category?: string;
  brand?: string;
  tags: string[];
  images: string[];
  variants: ProductVariant[];
  seo_title?: string;
  seo_description?: string;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  status: 'active' | 'draft' | 'archived';
  created_at?: string;
  updated_at?: string;
}

export interface ConnectorOrder {
  id?: string;
  external_id: string;
  order_number: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  total_amount: number;
  currency: string;
  customer_id?: string;
  customer_name: string;
  customer_email: string;
  billing_address: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    province?: string;
    country: string;
    zip: string;
    phone?: string;
  };
  shipping_address: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    province?: string;
    country: string;
    zip: string;
    phone?: string;
  };
  line_items: {
    product_id: string;
    variant_id?: string;
    sku: string;
    title: string;
    quantity: number;
    price: number;
  }[];
  fulfillment_status?: string;
  tracking_number?: string;
  carrier?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SyncResult {
  success: boolean;
  total: number;
  imported: number;
  updated: number;
  errors: string[];
  duration_ms: number;
}

export interface ConnectorConfig {
  name: string;
  type: 'ecommerce' | 'marketplace';
  auth_type: 'oauth' | 'api_key' | 'token';
  supports_webhooks: boolean;
  supports_realtime: boolean;
  rate_limit: {
    requests_per_second: number;
    requests_per_hour: number;
  };
  endpoints: {
    products: string;
    orders: string;
    webhooks?: string;
  };
}

export abstract class BaseConnector {
  protected credentials: ConnectorCredentials;
  protected config: ConnectorConfig;
  
  constructor(credentials: ConnectorCredentials, config: ConnectorConfig) {
    this.credentials = credentials;
    this.config = config;
  }

  abstract validateCredentials(): Promise<boolean>;
  abstract fetchProducts(options?: { 
    limit?: number; 
    page?: number; 
    updated_since?: string; 
  }): Promise<ConnectorProduct[]>;
  abstract fetchOrders(options?: { 
    limit?: number; 
    page?: number; 
    status?: string;
    updated_since?: string; 
  }): Promise<ConnectorOrder[]>;
  abstract updateInventory(products: { sku: string; quantity: number }[]): Promise<SyncResult>;
  abstract updatePrices(products: { sku: string; price: number }[]): Promise<SyncResult>;
  abstract createOrder(order: Partial<ConnectorOrder>): Promise<string>;
  abstract updateOrderStatus(orderId: string, status: string): Promise<boolean>;
  
  protected async makeRequest(url: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}