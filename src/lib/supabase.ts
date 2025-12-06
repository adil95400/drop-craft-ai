import { supabase } from '@/integrations/supabase/client'

export { supabase }

// Type definitions for main entities
export interface Product {
  id: string
  user_id: string
  name: string
  description?: string
  price: number
  cost_price?: number
  sku?: string
  category?: string
  stock_quantity?: number
  status: 'active' | 'inactive' | 'archived'
  image_url?: string
  weight?: number
  dimensions?: any
  tags?: string[]
  supplier_id?: string
  supplier?: string
  profit_margin?: number
  shopify_id?: string
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
  created_at: string
  updated_at: string
  // Shopify-compatible fields (Phase 1)
  handle?: string
  vendor?: string
  barcode?: string
  compare_at_price?: number
  product_type?: string
  // Google Shopping fields (Phase 3)
  google_product_category?: string
  google_gender?: string
  google_age_group?: string
  mpn?: string
  product_condition?: string
  google_custom_labels?: Record<string, string>
  // Inventory/Shipping fields (Phase 4)
  inventory_policy?: 'deny' | 'continue'
  fulfillment_service?: string
  requires_shipping?: boolean
  taxable?: boolean
  tax_code?: string
  weight_unit?: 'g' | 'kg' | 'lb' | 'oz'
}

export interface ProductVariant {
  id: string
  product_id: string
  user_id: string
  sku?: string
  title?: string
  price: number
  compare_at_price?: number
  cost_price?: number
  barcode?: string
  weight?: number
  weight_unit?: 'g' | 'kg' | 'lb' | 'oz'
  inventory_quantity?: number
  inventory_policy?: 'deny' | 'continue'
  fulfillment_service?: string
  requires_shipping?: boolean
  taxable?: boolean
  option1_name?: string
  option1_value?: string
  option2_name?: string
  option2_value?: string
  option3_name?: string
  option3_value?: string
  image_url?: string
  position?: number
  shopify_variant_id?: string
  woocommerce_variant_id?: string
  is_active?: boolean
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  user_id: string
  src: string
  alt?: string
  position?: number
  width?: number
  height?: number
  variant_ids?: string[]
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  customer_id?: string
  order_number: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total_amount: number
  currency: string
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  shipping_address?: any
  billing_address?: any
  tracking_number?: string
  notes?: string
  platform_order_id?: string
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  user_id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  status: 'active' | 'inactive'
  total_orders: number
  total_spent: number
  last_order_date?: string
  address?: any
  platform_customer_id?: string
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface Integration {
  id: string
  user_id: string
  platform_name: string
  platform_type: string
  platform_url?: string
  api_key?: string
  api_secret?: string
  access_token?: string
  refresh_token?: string
  shop_domain?: string
  seller_id?: string
  store_config?: any
  connection_status: 'connected' | 'disconnected' | 'error'
  is_active: boolean
  sync_frequency: 'manual' | 'hourly' | 'daily' | 'weekly'
  last_sync_at?: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  user_id: string
  email?: string
  first_name?: string
  last_name?: string
  business_name?: string
  phone?: string
  avatar_url?: string
  timezone?: string
  language: string
  notification_preferences?: any
  subscription_plan?: string
  subscription_status?: string
  created_at: string
  updated_at: string
}
