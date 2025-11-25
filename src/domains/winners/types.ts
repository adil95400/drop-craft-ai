// Types centralisés pour le domaine Winners
export interface WinnerProduct {
  id: string
  title: string
  price: number
  currency: string
  image: string
  source: string
  url: string
  reviews?: number
  rating?: number
  sales?: number
  trending_score: number
  market_demand: number
  final_score?: number
  category?: string
  tags?: string[]
  // Nouvelles propriétés type AutoDS
  supplier_name?: string
  supplier_url?: string
  estimated_cost?: number
  profit_margin?: number
  shipping_time?: string
  social_proof?: {
    tiktok_views?: number
    instagram_likes?: number
    facebook_shares?: number
  }
  competition_level?: 'low' | 'medium' | 'high'
  saturation_score?: number
}

export interface WinnersResponse {
  products: WinnerProduct[]
  sources?: Record<string, any>
  meta: {
    total: number
    sources_used?: string[]
    query: string
    category?: string
    timestamp: string
    source?: string
    scoring_algorithm?: string
  }
  stats?: {
    avg_score: number
    total_sources: number
    products_per_source: number[]
  }
}

export interface TrendingNiche {
  id: number
  name: string
  growth: string
  avgPrice: string
  competition: 'Faible' | 'Moyenne' | 'Élevée'
  opportunity: 'Faible' | 'Moyenne' | 'Élevée' | 'Très Élevée'
  category?: string
  tags?: string[]
}

export interface WinnersSearchParams {
  query: string
  category?: string
  sources?: string[]
  limit?: number
  minScore?: number
  maxPrice?: number
}

export interface WinnersStats {
  totalAnalyzed: number
  winnersDetected: number
  averageScore: number
  successRate: number
}