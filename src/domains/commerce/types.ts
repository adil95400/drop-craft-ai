/**
 * Types centralisés pour le domaine Commerce — Schema "Produit Final"
 * Source of truth: multi-store, multi-source, variantes, pricing/stock séparés, SEO versionné, IA overlay
 */

// ============================================================
// A) CORE PRODUIT
// ============================================================

export interface Product {
  id: string
  user_id: string
  title: string
  /** @deprecated Use title */
  name?: string
  brand?: string | null
  product_type?: string | null
  status: 'draft' | 'active' | 'archived'
  default_language: string
  primary_image_url?: string | null
  /** @deprecated Use primary_image_url */
  image_url?: string | null
  description?: string | null
  description_html?: string | null
  price: number
  cost_price?: number | null
  compare_at_price?: number | null
  profit_margin?: number | null
  sku?: string | null
  barcode?: string | null
  category?: string | null
  stock_quantity?: number | null
  weight?: number | null
  weight_unit?: string | null
  images?: string[] | null
  variants?: any | null
  tags?: string[] | null
  seo_title?: string | null
  seo_description?: string | null
  vendor?: string | null
  supplier?: string | null
  /** @deprecated Use supplier */
  supplier_name?: string | null
  supplier_url?: string | null
  is_published?: boolean | null
  view_count?: number | null
  // Legacy catalog compat
  is_trending?: boolean | null
  is_bestseller?: boolean | null
  is_winner?: boolean | null
  trend_score?: number | null
  competition_score?: number | null
  created_at: string
  updated_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  user_id: string
  name: string
  sku?: string | null
  barcode?: string | null
  price?: number | null
  cost_price?: number | null
  stock_quantity: number
  weight?: number | null
  weight_unit?: string | null
  option1_name?: string | null
  option1_value?: string | null
  option2_name?: string | null
  option2_value?: string | null
  option3_name?: string | null
  option3_value?: string | null
  image_url?: string | null
  status: 'active' | 'inactive' | 'archived'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  variant_id?: string | null
  user_id: string
  url: string
  alt_text?: string | null
  position: number
  is_primary?: boolean | null
  width?: number | null
  height?: number | null
  file_size?: number | null
  created_at: string
}

export interface ProductTag {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface ProductTagLink {
  product_id: string
  tag_id: string
}

export interface ProductCollection {
  id: string
  user_id: string
  name: string
  parent_id?: string | null
  created_at: string
}

export interface ProductCollectionLink {
  product_id: string
  collection_id: string
}

// ============================================================
// B) COMMERCE (prix, coût, stock)
// ============================================================

export interface ProductCost {
  id: string
  user_id: string
  variant_id: string
  currency: string
  cost_amount: number
  shipping_cost_amount?: number | null
  landed_cost_amount?: number | null
  source: 'supplier' | 'manual' | 'estimate'
  updated_at: string
}

export interface PricingRuleset {
  id: string
  user_id: string
  store_id?: string | null
  name: string
  rules_json: Record<string, any>
  is_default: boolean
  created_at: string
}

export interface ProductPrice {
  id: string
  user_id: string
  variant_id: string
  store_id?: string | null
  currency: string
  price_amount: number
  compare_at_amount?: number | null
  pricing_ruleset_id?: string | null
  updated_at: string
}

export interface InventoryLocation {
  id: string
  user_id: string
  store_id?: string | null
  name: string
  type: 'supplier' | 'warehouse' | 'store'
  created_at: string
}

export interface InventoryLevel {
  id: string
  user_id: string
  variant_id: string
  location_id: string
  qty_available: number
  qty_reserved: number
  updated_at: string
}

// ============================================================
// C) SEO & IA (overlay, versionné)
// ============================================================

export interface ProductSEO {
  id: string
  user_id: string
  product_id: string
  store_id?: string | null
  language: string
  handle?: string | null
  seo_title?: string | null
  meta_description?: string | null
  canonical_url?: string | null
  updated_at: string
}

export interface ProductSEOVersion {
  id: string
  user_id: string
  product_id: string
  store_id?: string | null
  language: string
  version: number
  fields_json: Record<string, any>
  source: 'manual' | 'ai' | 'import' | 'sync'
  created_at: string
}

export interface AIGeneration {
  id: string
  user_id: string
  target_type: 'product' | 'variant' | 'seo_audit' | 'collection'
  target_id: string
  task: 'seo_title' | 'meta_desc' | 'tags' | 'category' | 'rewrite_desc'
  language: string
  provider: 'openai' | 'lovable' | 'other'
  model?: string | null
  prompt_hash?: string | null
  input_json: Record<string, any>
  output_json: Record<string, any>
  cost_usd?: number | null
  tokens_in?: number | null
  tokens_out?: number | null
  created_at: string
}

// ============================================================
// D) SYNC & INTÉGRATIONS
// ============================================================

export interface Store {
  id: string
  user_id: string
  platform: 'shopify' | 'woocommerce' | 'other'
  name: string
  domain?: string | null
  status: 'connected' | 'error' | 'disconnected'
  metadata?: Record<string, any> | null
  access_token_encrypted?: string | null
  created_at: string
}

export interface StoreProduct {
  id: string
  user_id: string
  store_id: string
  product_id: string
  external_product_id: string
  handle?: string | null
  sync_status: string
  published?: boolean | null
  last_synced_at?: string | null
}

export interface StoreVariant {
  id: string
  user_id: string
  store_id: string
  variant_id: string
  external_variant_id: string
  external_inventory_item_id?: string | null
  last_synced_at?: string | null
}

export interface ProductSource {
  id: string
  user_id: string
  product_id: string
  source_platform: string
  external_product_id?: string | null
  source_url?: string | null
  source_data?: Record<string, any> | null
}

export interface ProductEvent {
  id: string
  user_id: string
  product_id?: string | null
  variant_id?: string | null
  event_type: 'created' | 'updated' | 'synced' | 'price_changed' | 'stock_changed' | 'seo_applied' | 'ai_generated'
  actor_type: 'user' | 'system' | 'webhook'
  actor_id?: string | null
  payload?: Record<string, any>
  created_at: string
}

// ============================================================
// FILTRES & STATS (compatibilité)
// ============================================================

export interface CommerceFilters {
  category?: string
  supplier?: string
  status?: string
  priceRange?: [number, number]
  search?: string
  sortBy?: 'name' | 'price' | 'profit_margin' | 'created_at'
  sortOrder?: 'asc' | 'desc'
}

export interface ImportFilters {
  status?: string
  source?: string
  dateRange?: [string, string]
  hasAI?: boolean
}

export interface CommerceStats {
  totalProducts: number
  activeProducts: number
  totalValue: number
  averageMargin: number
  topCategories: Array<{ name: string; count: number }>
  recentImports: number
}

// Legacy compat aliases
export type CatalogProduct = Product
export type ImportedProduct = Product
export type ImportJob = any
