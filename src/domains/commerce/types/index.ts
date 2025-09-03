export interface ImportFilters {
  status?: string
  date_range?: {
    from: string
    to: string
  }
}

export interface ImportJob {
  id: string
  source_type: string
  status: string
  total_rows?: number
  success_rows?: number
  error_rows?: number
  created_at: string
  completed_at?: string
  source_name?: string
}

export interface ImportedProduct {
  id: string
  name: string
  description?: string
  price: number
  cost_price?: number
  currency: string
  sku?: string
  category?: string
  supplier_name?: string
  image_urls?: string[]
  tags?: string[]
  status: string
  ai_optimized: boolean
  created_at: string
  seo_title?: string
}