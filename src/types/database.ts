// Temporary types to resolve build errors until Supabase types are regenerated
export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  status: string
  plan_name?: string
  price_id?: string
  current_period_start?: string
  current_period_end?: string
  cancel_at_period_end?: boolean
  created_at: string
  updated_at: string
}

export interface TrackingOrder {
  id: string
  order_number: string
  tracking_number: string
  carrier: string
  status: string
  created_at: string
  customer_name?: string
  shipping_address?: any
}

export interface ViralProduct {
  id: string
  user_id: string
  product_name: string
  platform: 'tiktok' | 'facebook' | 'instagram'
  url: string
  viral_score: number
  views: number
  likes: number
  comments: number
  shares: number
  engagement_rate: number
  price?: number
  margin?: number
  estimated_margin?: number
  thumbnail_url?: string
  hashtags?: string[]
  creator_username?: string
  analyzed_at?: string
  created_at: string
}

export interface SocialTrend {
  id: string
  hashtag: string
  trend_score: number
  growth_rate: number
  product_count: number
  created_at: string
}

export interface Expense {
  id: string
  user_id: string
  category: string
  amount: number
  date: string
  description?: string
  recurring: boolean
  created_at: string
}

export interface SupplierRating {
  id: string
  supplier_id: string
  reliability_score: number
  quality_score: number
  shipping_score: number
  price_score: number
  communication_score: number
  overall_score: number
  created_at: string
  updated_at: string
}