/**
 * Product Data Engine — Types
 */

export type Platform =
  | 'shopify' | 'woocommerce' | 'aliexpress' | 'amazon'
  | 'cjdropshipping' | 'temu' | 'etsy' | 'ebay'
  | 'cdiscount' | 'fnac' | 'walmart' | 'wish'
  | 'banggood' | 'dhgate' | 'shein' | 'rakuten'
  | 'darty' | 'boulanger' | 'homedepot' | 'lowes'
  | 'costco' | 'manomano' | 'leroymerlin' | 'bigbuy'
  | 'made-in-china' | 'unknown'

export type PageType = 'product' | 'category' | 'search' | 'store' | 'unknown'

export type ScrapeStatus = 'pending' | 'scraping' | 'extracting' | 'normalizing' | 'enriching' | 'success' | 'failed'

export interface NormalizedProduct {
  title: string
  description: string
  shortDescription?: string
  price?: number
  originalPrice?: number
  currency?: string
  images: string[]
  videos: string[]
  category?: string
  subCategory?: string
  breadcrumbs: string[]
  variants: ProductVariant[]
  rating?: number
  reviewsCount?: number
  reviews?: ProductReview[]
  reviewDistribution?: ReviewDistribution
  keywords?: string[]
  supplier?: string
  brand?: string
  sku?: string
  stock?: number
  available?: boolean
  weight?: number
  weightUnit?: string
  dimensions?: { length?: number; width?: number; height?: number; unit?: string }
  specifications?: Record<string, string>
  seo?: SeoData
  shipping?: ShippingData
  seller?: SellerData
  url: string
  platform: Platform
  platformProductId?: string
  qualityScore?: QualityScore
  extractedAt: string
}

export interface ProductVariant {
  sku?: string
  name: string
  price: number
  compareAtPrice?: number
  stock?: number
  available?: boolean
  image?: string
  attributes: Record<string, string>
}

export interface ProductReview {
  author?: string
  rating?: number
  title?: string
  content: string
  date?: string
  verified?: boolean
  images?: string[]
  videos?: string[]
  variant?: string
  helpfulCount?: number
  sentiment?: 'positive' | 'neutral' | 'negative'
}

export interface ReviewDistribution {
  distribution: Record<number, number> // 5→count, 4→count, etc.
  averageRating: number
  totalReviews: number
  sentimentBreakdown?: { positive: number; neutral: number; negative: number }
  topKeywords?: Array<{ word: string; count: number; sentiment: string }>
  commonIssues?: string[]
}

export interface SeoData {
  metaTitle?: string
  metaDescription?: string
  canonicalUrl?: string
  keywords?: string[]
  h1?: string[]
  h2?: string[]
}

export interface ShippingData {
  freeShipping?: boolean
  estimatedDelivery?: string
  methods?: Array<{ name: string; price: number; days?: string }>
}

export interface SellerData {
  name?: string
  rating?: number
  reviewsCount?: number
  location?: string
  verified?: boolean
  responseTime?: string
}

export interface QualityScore {
  score: number // 0-100
  breakdown: Record<string, { score: number; max: number; label: string }>
}

export interface ScrapeJob {
  id: string
  url: string
  platform: Platform
  pageType: PageType
  status: ScrapeStatus
  progress: number
  progressMessage: string
  result?: NormalizedProduct
  error?: string
  startedAt: string
  completedAt?: string
  retryCount: number
}

export interface ScrapeOptions {
  extractReviews?: boolean
  extractVariants?: boolean
  extractSeo?: boolean
  extractVideos?: boolean
  maxReviews?: number
  priceMultiplier?: number
  timeout?: number
}

export interface PlatformDetectionResult {
  platform: Platform
  pageType: PageType
  productId?: string
  confidence: number
}

export interface ExtractionResult<T = any> {
  success: boolean
  data?: T
  error?: string
  source: 'api' | 'html' | 'json-ld' | 'og' | 'markdown' | 'fallback'
  confidence: number
}
