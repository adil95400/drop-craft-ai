/**
 * Types for AdSpy Module - Minea-style Intelligence
 */

export interface Ad {
  id: string
  platform: 'facebook' | 'tiktok' | 'instagram' | 'pinterest' | 'google' | 'snapchat'
  type: 'image' | 'video' | 'carousel'
  advertiser: string
  advertiserUrl?: string
  title: string
  description?: string
  mediaUrl: string
  thumbnailUrl?: string
  cta?: string
  landingPageUrl?: string
  productUrl?: string
  
  // Performance metrics
  likes: number
  comments: number
  shares: number
  views?: number
  engagementRate: number
  
  // Dates
  firstSeen: string
  lastSeen: string
  daysRunning: number
  
  // Targeting
  country: string
  countries?: string[]
  language?: string
  targetAudience?: string
  
  // Analysis
  winnerScore: number
  saturationLevel: 'low' | 'medium' | 'high' | 'saturated'
  estimatedBudget?: number
  estimatedRevenue?: number
  competitorCount: number
  
  // Product info
  productName?: string
  productPrice?: number
  productCategory?: string
  supplierUrl?: string
  aliexpressUrl?: string
  
  // Tags
  tags: string[]
  niche?: string
}

export interface TrendingProduct {
  id: string
  name: string
  image: string
  images?: string[]
  price: number
  originalPrice?: number
  currency: string
  
  // Source
  supplier: string
  supplierUrl?: string
  aliexpressId?: string
  
  // Platform presence
  platforms: ('tiktok' | 'facebook' | 'instagram' | 'pinterest')[]
  primaryPlatform: string
  
  // Metrics
  trendScore: number
  viralScore: number
  saturationScore: number
  profitPotential: number
  
  // Sales estimates
  estimatedSales: number
  salesGrowth: number
  revenueEstimate: number
  
  // Competition
  adCount: number
  competitorCount: number
  averagePrice: number
  priceRange: { min: number; max: number }
  
  // Category
  category: string
  subcategory?: string
  niche?: string
  tags: string[]
  
  // Dates
  firstDetected: string
  lastUpdated: string
  peakDate?: string
  
  // AI Analysis
  aiSummary?: string
  aiRecommendation?: 'import' | 'watch' | 'avoid'
  riskLevel?: 'low' | 'medium' | 'high'
}

export interface Competitor {
  id: string
  name: string
  domain: string
  logoUrl?: string
  
  // Store info
  platform: 'shopify' | 'woocommerce' | 'prestashop' | 'custom'
  country: string
  language?: string
  currency?: string
  
  // Metrics
  estimatedRevenue: number
  estimatedOrders: number
  productCount: number
  averagePrice: number
  
  // Activity
  adsRunning: number
  totalAdsDetected: number
  lastAdDate?: string
  
  // Performance
  trafficEstimate?: number
  socialFollowers?: {
    facebook?: number
    instagram?: number
    tiktok?: number
  }
  
  // Analysis
  competitionScore: number
  threatLevel: 'low' | 'medium' | 'high'
  
  // Tracking
  isTracked: boolean
  trackedSince?: string
  lastChecked: string
  
  // Top products
  topProducts?: {
    id: string
    name: string
    price: number
    adCount: number
  }[]
}

export interface Influencer {
  id: string
  username: string
  displayName: string
  platform: 'tiktok' | 'instagram' | 'youtube' | 'facebook'
  profileUrl: string
  avatarUrl?: string
  
  // Metrics
  followers: number
  avgViews: number
  avgEngagement: number
  
  // E-commerce
  productsPromoted: number
  estimatedRevenue?: number
  conversionRate?: number
  
  // Categories
  niches: string[]
  country: string
  language?: string
  
  // Analysis
  influenceScore: number
  authenticity: number
  isVerified: boolean
  
  // Tracking
  isTracked: boolean
  lastPost?: string
}

export interface AdSpyFilters {
  platforms?: string[]
  countries?: string[]
  dateRange?: { start: string; end: string }
  minEngagement?: number
  maxEngagement?: number
  categories?: string[]
  saturationLevels?: string[]
  adTypes?: string[]
  languages?: string[]
  sortBy?: 'engagement' | 'date' | 'score' | 'views' | 'likes'
  sortOrder?: 'asc' | 'desc'
  searchQuery?: string
  minDaysRunning?: number
  maxDaysRunning?: number
  hasVideo?: boolean
}

export interface MarketAnalysis {
  category: string
  totalAds: number
  averageEngagement: number
  topPlatform: string
  saturationLevel: string
  growthRate: number
  topProducts: TrendingProduct[]
  topCompetitors: Competitor[]
  priceAnalysis: {
    min: number
    max: number
    average: number
    median: number
  }
  recommendations: string[]
}

export interface AdSpyStats {
  totalAdsAnalyzed: number
  totalProducts: number
  totalCompetitors: number
  averageWinnerScore: number
  topPlatform: string
  topCategory: string
  trendingNiches: { name: string; count: number; growth: number }[]
  recentActivity: {
    date: string
    adsFound: number
    productsDetected: number
  }[]
}
