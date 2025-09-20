/**
 * Types for catalog and product management
 */

export interface CatalogProduct {
  id: string
  external_id?: string
  name: string
  description?: string
  price: number
  cost_price?: number
  profit_margin?: number
  currency: string
  category?: string
  subcategory?: string
  brand?: string
  sku?: string
  image_url?: string
  image_urls?: string[]
  rating?: number
  reviews_count?: number
  availability_status: 'in_stock' | 'out_of_stock' | 'limited_stock'
  delivery_time?: string
  tags?: string[]
  is_trending?: boolean
  is_bestseller?: boolean
  is_winner?: boolean
  supplier_name?: string
  supplier_url?: string
  competition_score?: number
  trend_score?: number
  sales_count?: number
  stock_quantity?: number
  attributes?: Record<string, any>
  seo_data?: {
    title?: string
    description?: string
    keywords?: string[]
  }
  created_at: string
  updated_at: string
}

export interface ProductFilter {
  category?: string
  brand?: string
  priceMin?: number
  priceMax?: number
  inStock?: boolean
  trending?: boolean
  bestseller?: boolean
  rating?: number
}

export interface ProductSort {
  field: 'name' | 'price' | 'rating' | 'created_at' | 'sales_count'
  direction: 'asc' | 'desc'
}

export interface CatalogSearchParams {
  query?: string
  filters?: ProductFilter
  sort?: ProductSort
  page?: number
  limit?: number
}

export interface CatalogStats {
  totalProducts: number
  categories: number
  averagePrice: number
  totalValue: number
  inStockCount: number
  lowStockCount: number
  topCategories: Array<{
    name: string
    count: number
  }>
}