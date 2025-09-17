// Types étendus pour e-commerce complet

export interface ProductVariant {
  id: string;
  sku: string;
  title: string;
  price: number;
  cost_price?: number;
  currency: string;
  inventory_quantity: number;
  inventory_item_id?: string; // Shopify spécifique
  weight?: number;
  weight_unit?: string;
  attributes: Record<string, string>; // color: "red", size: "M"
  image_url?: string;
  barcode?: string;
  compare_at_price?: number;
  requires_shipping: boolean;
  taxable: boolean;
  fulfillment_service?: string;
  inventory_management?: string;
  inventory_policy?: 'deny' | 'continue';
  created_at: string;
  updated_at: string;
}

export interface ProductSEO {
  title?: string;
  description?: string;
  handle?: string; // URL slug
  meta_title?: string;
  meta_description?: string;
  keywords?: string[];
}

export interface ProductImage {
  id?: string;
  src: string;
  alt?: string;
  position?: number;
  width?: number;
  height?: number;
  variant_ids?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface CompleteProduct {
  id: string;
  title: string;
  body_html?: string; // Description HTML
  vendor?: string; // Marque
  product_type?: string; // Type de produit
  handle?: string; // URL slug
  published_at?: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'archived' | 'draft';
  published_scope?: 'web' | 'global';
  tags?: string[];
  options: ProductOption[]; // Couleur, Taille, etc.
  variants: ProductVariant[];
  images: ProductImage[];
  seo: ProductSEO;
  // Attributs métier
  ean?: string;
  upc?: string;
  isbn?: string;
  weight?: number;
  weight_unit?: string;
  hs_code?: string; // Code douanier
  origin_country?: string;
  material?: string;
  // Données fournisseur
  supplier_id: string;
  supplier_sku?: string;
  supplier_name: string;
  supplier_url?: string;
  cost_price?: number;
  margin?: number;
  // Données de vente
  sales_count?: number;
  revenue?: number;
  last_sale_date?: string;
  // Données SEO/Marketing
  metafields?: Record<string, any>;
  // Synchronisation
  last_sync_at?: string;
  sync_status?: 'synced' | 'pending' | 'error';
  sync_errors?: string[];
}

export interface ProductOption {
  id?: string;
  name: string; // "Color", "Size"
  position: number;
  values: string[]; // ["Red", "Blue", "Green"]
}

export interface OrderLineItem {
  id?: string;
  variant_id?: string;
  product_id: string;
  name: string;
  title: string;
  variant_title?: string;
  sku?: string;
  vendor?: string;
  quantity: number;
  requires_shipping: boolean;
  taxable: boolean;
  gift_card: boolean;
  fulfillment_service: string;
  grams: number;
  tax_lines: TaxLine[];
  tip_payment_gateway?: string;
  tip_payment_method?: string;
  price: string;
  total_discount: string;
  fulfillment_status?: 'fulfilled' | 'partial' | 'restocked' | null;
  price_set?: PriceSet;
  total_discount_set?: PriceSet;
  discount_allocations: DiscountAllocation[];
  duties?: Duty[];
  admin_graphql_api_id?: string;
  properties?: Property[];
}

export interface TaxLine {
  price: string;
  rate: number;
  title: string;
  price_set?: PriceSet;
  channel_liable?: boolean;
}

export interface PriceSet {
  shop_money: Money;
  presentment_money: Money;
}

export interface Money {
  amount: string;
  currency_code: string;
}

export interface DiscountAllocation {
  amount: string;
  discount_application_index: number;
  amount_set?: PriceSet;
}

export interface Duty {
  id: string;
  harmonized_system_code: string;
  country_code_of_origin: string;
  shop_money: Money;
  presentment_money: Money;
  tax_lines: TaxLine[];
  admin_graphql_api_id: string;
}

export interface Property {
  name: string;
  value: string;
}

export interface ShippingAddress {
  id?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  country: string;
  zip: string;
  phone?: string;
  name?: string;
  province_code?: string;
  country_code?: string;
  latitude?: number;
  longitude?: number;
}

export interface CompleteOrder {
  id: string;
  order_number?: string;
  name: string; // #1001
  email?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  cancelled_at?: string;
  cancel_reason?: string;
  financial_status: 'pending' | 'authorized' | 'paid' | 'partially_paid' | 'refunded' | 'voided' | 'partially_refunded';
  fulfillment_status?: 'fulfilled' | 'partial' | 'restocked' | null;
  gateway?: string;
  test: boolean;
  total_price: string;
  subtotal_price: string;
  total_weight?: number;
  total_tax: string;
  taxes_included: boolean;
  currency: string;
  total_discounts: string;
  total_line_items_price: string;
  cart_token?: string;
  buyer_accepts_marketing: boolean;
  referring_site?: string;
  landing_site?: string;
  source_name?: string;
  line_items: OrderLineItem[];
  shipping_address?: ShippingAddress;
  billing_address?: ShippingAddress;
  shipping_lines: ShippingLine[];
  tax_lines: TaxLine[];
  payment_gateway_names?: string[];
  processing_method?: string;
  checkout_token?: string;
  source_identifier?: string;
  source_url?: string;
  device_id?: string;
  phone?: string;
  customer_locale?: string;
  app_id?: string;
  browser_ip?: string;
  landing_site_ref?: string;
  order_status_url?: string;
  // Données de suivi
  tracking_company?: string;
  tracking_number?: string;
  tracking_url?: string;
  // Synchronisation
  last_sync_at?: string;
  sync_status?: 'synced' | 'pending' | 'error';
  sync_errors?: string[];
  // Supplier fulfillment
  supplier_order_id?: string;
  supplier_status?: string;
  supplier_tracking?: string;
}

export interface ShippingLine {
  id?: string;
  carrier_identifier?: string;
  code?: string;
  delivery_category?: string;
  discount_allocations: DiscountAllocation[];
  discounted_price: string;
  discounted_price_set?: PriceSet;
  phone?: string;
  price: string;
  price_set?: PriceSet;
  requested_fulfillment_service_id?: string;
  source: string;
  title: string;
  tax_lines: TaxLine[];
  validation_context?: string;
}

export interface CustomerAddress extends ShippingAddress {
  default: boolean;
}

export interface CompleteCustomer {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  first_name?: string;
  last_name?: string;
  orders_count: number;
  state: 'disabled' | 'invited' | 'enabled' | 'declined';
  total_spent: string;
  last_order_id?: string;
  note?: string;
  verified_email: boolean;
  multipass_identifier?: string;
  tax_exempt: boolean;
  phone?: string;
  tags?: string;
  last_order_name?: string;
  currency: string;
  addresses?: CustomerAddress[];
  accepts_marketing: boolean;
  accepts_marketing_updated_at?: string;
  marketing_opt_in_level?: string;
  tax_exemptions?: string[];
  email_marketing_consent?: EmailMarketingConsent;
  sms_marketing_consent?: SMSMarketingConsent;
  // Segmentation et métadonnées
  segment?: string;
  lifecycle_stage?: 'prospect' | 'customer' | 'loyal' | 'at_risk' | 'churned';
  acquisition_source?: string;
  customer_lifetime_value?: number;
  average_order_value?: number;
  purchase_frequency?: number;
  last_purchase_date?: string;
  // RGPD
  gdpr_consent?: boolean;
  gdpr_consent_date?: string;
  data_processing_consent?: boolean;
  // Synchronisation
  last_sync_at?: string;
  sync_status?: 'synced' | 'pending' | 'error';
  sync_errors?: string[];
  // Plateforme source
  platform_id: string;
  platform_customer_id: string;
}

export interface EmailMarketingConsent {
  state: 'not_subscribed' | 'pending' | 'subscribed' | 'unsubscribed' | 'redacted';
  opt_in_level: 'single_opt_in' | 'confirmed_opt_in' | 'unknown';
  consent_updated_at?: string;
}

export interface SMSMarketingConsent {
  state: 'not_subscribed' | 'pending' | 'subscribed' | 'unsubscribed' | 'redacted';
  opt_in_level: 'single_opt_in' | 'confirmed_opt_in' | 'unknown';
  consent_updated_at?: string;
  consent_collected_from: 'WEBSITE' | 'SMS' | 'PHONE' | 'OTHER';
}

export interface WebhookEvent {
  id: string;
  topic: string; // products/update, orders/create, etc.
  shop_domain?: string;
  created_at: string;
  updated_at: string;
  api_version?: string;
  webhook_id?: string;
  payload: any;
  processed: boolean;
  processed_at?: string;
  processing_errors?: string[];
  retry_count: number;
  next_retry_at?: string;
}

export interface SyncConfiguration {
  id: string;
  user_id: string;
  platform_id: string;
  sync_type: 'webhook' | 'cron' | 'manual';
  webhook_url?: string;
  webhook_secret?: string;
  cron_schedule?: string; // "*/15 * * * *" pour toutes les 15 minutes
  enabled: boolean;
  last_sync_at?: string;
  next_sync_at?: string;
  sync_frequency?: 'realtime' | 'hourly' | 'daily' | 'weekly';
  sync_entities: ('products' | 'orders' | 'customers' | 'inventory')[];
  created_at: string;
  updated_at: string;
}