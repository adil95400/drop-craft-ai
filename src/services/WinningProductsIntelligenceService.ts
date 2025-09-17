import { supabase } from '@/integrations/supabase/client'
import { socialMediaAnalysisService } from './SocialMediaAnalysisService'
import { winnersService } from '@/domains/winners/services/winnersService'

export interface WinningProductIntelligence {
  product_id: string
  name: string
  category: string
  price: number
  supplier: string
  
  // AI Scoring
  ai_score: number // 0-100
  profit_potential: number // 0-100
  risk_level: 'low' | 'medium' | 'high'
  
  // Market Intelligence
  market_demand: number
  competition_level: number
  saturation_score: number
  trend_momentum: number
  
  // Social Signals
  social_proof: {
    total_mentions: number
    sentiment_score: number
    viral_potential: number
    influencer_endorsements: number
  }
  
  // Financial Projections
  projected_roi: number
  estimated_daily_sales: number
  break_even_point: number
  market_opportunity_size: number
  
  // Competitive Analysis
  competitor_count: number
  price_positioning: 'budget' | 'mid' | 'premium'
  differentiation_score: number
  
  // Recommendations
  recommended_actions: string[]
  optimal_launch_timing: string
  suggested_pricing: {
    min: number
    optimal: number
    max: number
  }
  
  // Metadata
  last_analyzed: string
  data_sources: string[]
  confidence_level: number
}

export interface MarketplaceValidation {
  product_name: string
  marketplaces: {
    [key: string]: {
      present: boolean
      avg_price: number
      sales_volume: number
      reviews_count: number
      avg_rating: number
      top_sellers: string[]
    }
  }
  overall_validation_score: number
  market_gaps: string[]
  opportunities: string[]
}

export class WinningProductsIntelligenceService {
  private static instance: WinningProductsIntelligenceService
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly cacheTimeout = 15 * 60 * 1000 // 15 minutes

  public static getInstance(): WinningProductsIntelligenceService {
    if (!WinningProductsIntelligenceService.instance) {
      WinningProductsIntelligenceService.instance = new WinningProductsIntelligenceService()
    }
    return WinningProductsIntelligenceService.instance
  }

  async analyzeProductIntelligence(productName: string, category?: string): Promise<WinningProductIntelligence> {
    const cacheKey = `intelligence_${productName}_${category || 'all'}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }

    try {
      // Parallel data gathering
      const [socialSignals, marketData, competitorData] = await Promise.all([
        socialMediaAnalysisService.getProductSocialSignals(productName),
        this.getMarketData(productName, category),
        this.getCompetitorAnalysis(productName)
      ])

      // AI Analysis
      const { data, error } = await supabase.functions.invoke('ai-product-intelligence', {
        body: {
          product_name: productName,
          category,
          social_signals: socialSignals,
          market_data: marketData,
          competitor_data: competitorData,
          analysis_depth: 'comprehensive'
        }
      })

      if (error) throw error

      const intelligence = {
        ...data.intelligence,
        social_proof: {
          total_mentions: socialSignals.total_mentions,
          sentiment_score: socialSignals.sentiment_score,
          viral_potential: socialSignals.viral_potential,
          influencer_endorsements: socialSignals.influencer_mentions.length
        }
      }

      this.cache.set(cacheKey, { data: intelligence, timestamp: Date.now() })
      return intelligence
    } catch (error) {
      console.error('Product intelligence analysis failed:', error)
      throw error
    }
  }

  async getTopWinningProducts(filters: {
    category?: string
    minScore?: number
    maxRisk?: 'low' | 'medium' | 'high'
    priceRange?: { min: number; max: number }
    socialTrending?: boolean
  } = {}): Promise<WinningProductIntelligence[]> {
    try {
      const { data, error } = await supabase.functions.invoke('winning-products-aggregator', {
        body: {
          action: 'get_top_winners',
          filters,
          limit: 50,
          include_intelligence: true,
          sort_by: 'ai_score'
        }
      })

      if (error) throw error
      return data.products || []
    } catch (error) {
      console.error('Top winning products fetch failed:', error)
      throw error
    }
  }

  async validateProductOnMarketplaces(productName: string, marketplaces: string[] = ['amazon', 'ebay', 'aliexpress']): Promise<MarketplaceValidation> {
    const cacheKey = `marketplace_validation_${productName}_${marketplaces.join('_')}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }

    try {
      const { data, error } = await supabase.functions.invoke('marketplace-validator', {
        body: {
          product_name: productName,
          marketplaces,
          include_pricing: true,
          include_reviews: true,
          analyze_competition: true
        }
      })

      if (error) throw error

      this.cache.set(cacheKey, { data, timestamp: Date.now() })
      return data.validation || {}
    } catch (error) {
      console.error('Marketplace validation failed:', error)
      throw error
    }
  }

  async generateProductRecommendations(userPreferences: {
    budget?: number
    experience_level?: 'beginner' | 'intermediate' | 'advanced'
    preferred_categories?: string[]
    risk_tolerance?: 'low' | 'medium' | 'high'
    target_roi?: number
  }): Promise<WinningProductIntelligence[]> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-product-recommendations', {
        body: {
          user_preferences: userPreferences,
          include_social_trends: true,
          include_market_analysis: true,
          personalization_level: 'high'
        }
      })

      if (error) throw error
      return data.recommendations || []
    } catch (error) {
      console.error('Product recommendations generation failed:', error)
      throw error
    }
  }

  async trackProductEvolution(productId: string, timeframe: '7d' | '30d' | '90d' = '30d'): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('product-evolution-tracker', {
        body: {
          product_id: productId,
          timeframe,
          track_metrics: ['price', 'demand', 'competition', 'social_signals'],
          include_predictions: true
        }
      })

      if (error) throw error
      return data.evolution || {}
    } catch (error) {
      console.error('Product evolution tracking failed:', error)
      throw error
    }
  }

  private async getMarketData(productName: string, category?: string): Promise<any> {
    // Get market data from various sources
    try {
      const winnersData = await winnersService.searchWinners({
        query: productName,
        category,
        limit: 20,
        sources: ['trends', 'amazon', 'ebay']
      })

      return {
        products_found: winnersData.products?.length || 0,
        avg_price: winnersData.products?.reduce((sum, p) => sum + p.price, 0) / (winnersData.products?.length || 1),
        market_presence: winnersData.products?.length > 10 ? 'high' : winnersData.products?.length > 5 ? 'medium' : 'low'
      }
    } catch (error) {
      console.error('Market data retrieval failed:', error)
      return {}
    }
  }

  private async getCompetitorAnalysis(productName: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('competitive-analysis', {
        body: {
          product_name: productName,
          analysis_type: 'product_focused',
          include_pricing: true,
          include_features: true
        }
      })

      if (error) throw error
      return data.analysis || {}
    } catch (error) {
      console.error('Competitor analysis failed:', error)
      return {}
    }
  }

  clearCache(): void {
    this.cache.clear()
  }
}

export const winningProductsIntelligenceService = WinningProductsIntelligenceService.getInstance()