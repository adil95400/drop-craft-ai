// Types centralisés pour le domaine Commerce
export interface Product {
  id: string
  name: string
  description?: string
  price: number
  cost_price?: number
  currency: string
  category?: string
  sku?: string
  image_url?: string
  tags?: string[]
  status: 'active' | 'inactive' | 'draft'
  stock_quantity?: number
  profit_margin?: number
  supplier_name?: string
  supplier_url?: string
  created_at: string
  updated_at: string
}

export interface CatalogProduct {
  id: string
  external_id: string
  name: string
  description?: string | null
  price: number
  currency: string | null
  category?: string | null
  subcategory?: string | null
  brand?: string | null
  sku?: string | null
  image_url?: string | null
  image_urls?: string[] | null
  rating?: number | null
  reviews_count?: number | null
  availability_status: string | null
  delivery_time?: string | null
  tags?: string[] | null
  is_trending?: boolean | null
  is_bestseller?: boolean | null
  supplier_id: string
  supplier_name: string
  supplier_url?: string | null
  cost_price?: number | null
  profit_margin?: number | null
  competition_score?: number | null
  trend_score?: number | null
  is_winner?: boolean | null
  created_at: string | null
  updated_at: string | null
}

export interface ImportJob {
  id: string
  user_id: string
  source_type: string
  source_url?: string | null
  status: string
  errors?: string[] | null
  processed_rows?: number | null
  total_rows?: number | null
  error_rows?: number | null
  success_rows?: number | null
  mapping_config?: any
  file_data?: any
  result_data?: any
  created_at: string
  updated_at: string
}

export interface ImportedProduct {
  id: string
  import_id?: string | null
  user_id: string
  name: string
  description?: string | null
  price: number
  cost_price?: number | null
  currency?: string | null
  sku?: string | null
  category?: string | null
  supplier_name?: string | null
  supplier_url?: string | null
  supplier_product_id?: string | null
  image_urls?: string[] | null
  video_urls?: string[] | null
  tags?: string[] | null
  keywords?: string[] | null
  meta_title?: string | null
  meta_description?: string | null
  status?: string | null
  review_status?: string | null
  ai_optimized?: boolean | null
  ai_optimization_data?: any
  ai_score?: number | null
  ai_recommendations?: any
  import_quality_score?: number | null
  data_completeness_score?: number | null
  created_at: string
  updated_at: string
  reviewed_at?: string | null
  published_at?: string | null
}

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