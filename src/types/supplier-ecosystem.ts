// ============================================
// SHOPOPTI SUPPLIER ECOSYSTEM TYPES
// Complete type system for professional supplier management
// ============================================

export type ConnectionType = 'api' | 'oauth' | 'manual' | 'csv' | 'xml' | 'ftp';
export type ConnectionStatus = 'pending' | 'active' | 'error' | 'expired' | 'revoked';
export type FulfillmentStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'failed' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PricingType = 'fixed_markup' | 'percentage_markup' | 'target_margin' | 'dynamic' | 'tiered';
export type UpdateFrequency = 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual';

// ============================================
// SUPPLIER CREDENTIALS VAULT
// ============================================
export interface SupplierCredentialsVault {
  id: string;
  user_id: string;
  supplier_id: string;
  
  // Encrypted credentials (never expose in client)
  api_key_encrypted?: string;
  api_secret_encrypted?: string;
  access_token_encrypted?: string;
  refresh_token_encrypted?: string;
  oauth_data?: Record<string, any>;
  
  // Connection metadata
  connection_type: ConnectionType;
  connection_status: ConnectionStatus;
  
  // Health tracking
  last_validation_at?: string;
  last_error?: string;
  error_count: number;
  
  // Rate limiting
  rate_limit_requests_per_minute: number;
  rate_limit_requests_per_hour: number;
  last_request_at?: string;
  requests_today: number;
  
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

// Client-safe version (no encrypted data)
export interface SupplierConnection {
  id: string;
  supplier_id: string;
  connection_type: ConnectionType;
  connection_status: ConnectionStatus;
  last_validation_at?: string;
  last_error?: string;
  error_count: number;
  is_healthy: boolean;
  expires_at?: string;
}

// ============================================
// PRICING RULES
// ============================================
export interface PriceTier {
  min_cost: number;
  max_cost: number;
  markup: number;
}

export interface CategoryOverride {
  [category: string]: {
    markup?: number;
    min_price?: number;
    max_price?: number;
  };
}

export interface SupplierPricingRule {
  id: string;
  user_id: string;
  supplier_id: string;
  
  pricing_type: PricingType;
  
  // Fixed markup
  fixed_markup_amount?: number;
  
  // Percentage markup
  percentage_markup?: number;
  
  // Target margin
  target_margin_percent?: number;
  min_price?: number;
  max_price?: number;
  
  // Tiered pricing
  price_tiers?: PriceTier[];
  
  // Category-specific
  category_overrides?: CategoryOverride;
  
  // Auto-update
  auto_update_enabled: boolean;
  update_frequency: UpdateFrequency;
  last_update_at?: string;
  
  // Competitive pricing
  match_competitor_prices: boolean;
  competitor_price_adjustment?: number;
  
  is_active: boolean;
  priority: number;
  
  created_at: string;
  updated_at: string;
}

// ============================================
// SUPPLIER ORDERS (Auto-fulfillment)
// ============================================
export interface OrderLineItem {
  sku: string;
  quantity: number;
  price: number;
  product_name: string;
  variant_title?: string;
  product_id?: string;
}

export interface ShippingAddress {
  name: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  country: string;
  zip: string;
  phone?: string;
}

export interface SupplierOrder {
  id: string;
  user_id: string;
  supplier_id: string;
  
  // Order identification
  shop_order_id: string;
  supplier_order_id?: string;
  external_order_number?: string;
  
  // Order data
  line_items: OrderLineItem[];
  total_amount: number;
  currency: string;
  
  // Addresses
  shipping_address: ShippingAddress;
  billing_address?: ShippingAddress;
  
  // Customer
  customer_email?: string;
  customer_phone?: string;
  customer_notes?: string;
  
  // Status
  fulfillment_status: FulfillmentStatus;
  payment_status: PaymentStatus;
  
  // Tracking
  tracking_number?: string;
  tracking_url?: string;
  carrier?: string;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
  
  // Timeline
  placed_at: string;
  confirmed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  
  // Error handling
  error_message?: string;
  retry_count: number;
  last_retry_at?: string;
  
  // Financial
  cost_price?: number;
  selling_price?: number;
  profit?: number;
  
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ============================================
// SUPPLIER ANALYTICS
// ============================================
export interface SupplierAnalytics {
  id: string;
  user_id: string;
  supplier_id: string;
  date: string;
  
  // Product metrics
  total_products: number;
  active_products: number;
  out_of_stock_products: number;
  
  // Order metrics
  total_orders: number;
  successful_orders: number;
  failed_orders: number;
  cancelled_orders: number;
  
  // Financial metrics
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  average_order_value: number;
  
  // Performance metrics
  success_rate: number;
  average_fulfillment_time_hours?: number;
  average_delivery_time_days?: number;
  
  // API health
  api_calls_count: number;
  api_errors_count: number;
  api_success_rate: number;
  average_response_time_ms?: number;
  
  // Sync tracking
  last_inventory_sync_at?: string;
  last_price_sync_at?: string;
  
  created_at: string;
  updated_at: string;
}

// ============================================
// SUPPLIER WEBHOOKS
// ============================================
export type WebhookEvent = 'order.created' | 'order.updated' | 'product.updated' | 'inventory.updated';

export interface SupplierWebhook {
  id: string;
  user_id: string;
  supplier_id: string;
  
  webhook_url: string;
  webhook_secret?: string;
  
  events: WebhookEvent[];
  
  is_active: boolean;
  
  // Health tracking
  last_triggered_at?: string;
  success_count: number;
  failure_count: number;
  last_error?: string;
  
  // Retry config
  max_retries: number;
  retry_delay_seconds: number;
  
  created_at: string;
  updated_at: string;
}

// ============================================
// SUPPLIER HEALTH SCORE
// ============================================
export interface SupplierHealthScore {
  overall_score: number;
  success_rate: number;
  api_health: number;
  order_count_30d: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
}

// ============================================
// SUPPLIER EXTENDED (with all relationships)
// ============================================
export interface SupplierExtended {
  // Base supplier data
  id: string;
  name: string;
  website?: string;
  country?: string;
  status: 'active' | 'inactive';
  rating?: number;
  
  // Connection
  connection?: SupplierConnection;
  
  // Pricing
  pricing_rules: SupplierPricingRule[];
  
  // Analytics (30 days)
  analytics: SupplierAnalytics[];
  analytics_summary: {
    total_orders: number;
    success_rate: number;
    total_profit: number;
    avg_fulfillment_hours: number;
  };
  
  // Health
  health_score: SupplierHealthScore;
  
  // Recent orders
  recent_orders: SupplierOrder[];
  
  // Webhooks
  webhooks: SupplierWebhook[];
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

// Connect supplier
export interface ConnectSupplierRequest {
  supplier_id: string;
  connection_type: ConnectionType;
  credentials: {
    api_key?: string;
    api_secret?: string;
    access_token?: string;
    oauth_code?: string;
    [key: string]: any;
  };
}

export interface ConnectSupplierResponse {
  success: boolean;
  connection: SupplierConnection;
  message?: string;
}

// Create pricing rule
export interface CreatePricingRuleRequest {
  supplier_id: string;
  pricing_type: PricingType;
  config: Partial<SupplierPricingRule>;
}

// Place order
export interface PlaceOrderRequest {
  supplier_id: string;
  shop_order_id: string;
  line_items: OrderLineItem[];
  shipping_address: ShippingAddress;
  billing_address?: ShippingAddress;
  customer_email?: string;
  customer_phone?: string;
  customer_notes?: string;
}

export interface PlaceOrderResponse {
  success: boolean;
  order: SupplierOrder;
  supplier_order_id?: string;
  estimated_delivery?: string;
  tracking_info?: {
    tracking_number: string;
    tracking_url: string;
    carrier: string;
  };
  message?: string;
  error?: string;
}

// Sync products
export interface SyncProductsRequest {
  supplier_id: string;
  options?: {
    full_sync?: boolean;
    categories?: string[];
    limit?: number;
  };
}

export interface SyncProductsResponse {
  success: boolean;
  products_synced: number;
  products_updated: number;
  products_added: number;
  duration_ms: number;
  next_sync_at?: string;
}

// Get analytics
export interface GetAnalyticsRequest {
  supplier_id: string;
  start_date?: string;
  end_date?: string;
}

export interface GetAnalyticsResponse {
  success: boolean;
  analytics: SupplierAnalytics[];
  summary: {
    total_revenue: number;
    total_orders: number;
    success_rate: number;
    average_profit_margin: number;
  };
}
