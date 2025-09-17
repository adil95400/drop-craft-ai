import { supabase } from '@/integrations/supabase/client'

export interface SocialMediaTrend {
  platform: 'tiktok' | 'instagram' | 'facebook' | 'youtube'
  keyword: string
  volume: number
  engagement_rate: number
  trend_direction: 'up' | 'down' | 'stable'
  hashtags: string[]
  top_creators: string[]
  demographics: {
    age_groups: Record<string, number>
    countries: Record<string, number>
  }
  viral_content: {
    videos: number
    posts: number
    avg_views: number
  }
}

export interface ProductSocialSignals {
  product_name: string
  total_mentions: number
  sentiment_score: number // -1 to 1
  viral_potential: number // 0 to 100
  platforms: {
    tiktok: { mentions: number; views: number; engagement: number }
    instagram: { mentions: number; likes: number; comments: number }
    facebook: { mentions: number; shares: number; reactions: number }
    youtube: { mentions: number; views: number; subscribers: number }
  }
  trending_hashtags: string[]
  influencer_mentions: {
    name: string
    followers: number
    engagement_rate: number
  }[]
}

export class SocialMediaAnalysisService {
  private static instance: SocialMediaAnalysisService
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly cacheTimeout = 10 * 60 * 1000 // 10 minutes

  public static getInstance(): SocialMediaAnalysisService {
    if (!SocialMediaAnalysisService.instance) {
      SocialMediaAnalysisService.instance = new SocialMediaAnalysisService()
    }
    return SocialMediaAnalysisService.instance
  }

  async analyzeTrendingProducts(platforms: string[] = ['tiktok', 'instagram']): Promise<SocialMediaTrend[]> {
    const cacheKey = `trending_${platforms.join('_')}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }

    try {
      const { data, error } = await supabase.functions.invoke('social-media-analyzer', {
        body: {
          action: 'analyze_trends',
          platforms,
          categories: ['tech', 'fashion', 'home', 'beauty', 'fitness'],
          timeframe: '7d'
        }
      })

      if (error) throw error

      this.cache.set(cacheKey, { data, timestamp: Date.now() })
      return data.trends || []
    } catch (error) {
      console.error('Social media trends analysis failed:', error)
      throw error
    }
  }

  async getProductSocialSignals(productName: string, keywords: string[] = []): Promise<ProductSocialSignals> {
    const cacheKey = `product_signals_${productName}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }

    try {
      const { data, error } = await supabase.functions.invoke('social-media-analyzer', {
        body: {
          action: 'analyze_product',
          product_name: productName,
          keywords: [...keywords, productName],
          platforms: ['tiktok', 'instagram', 'facebook', 'youtube'],
          sentiment_analysis: true,
          influencer_tracking: true
        }
      })

      if (error) throw error

      this.cache.set(cacheKey, { data, timestamp: Date.now() })
      return data.signals || {}
    } catch (error) {
      console.error('Product social signals analysis failed:', error)
      throw error
    }
  }

  async detectViralProducts(minViralScore: number = 70): Promise<any[]> {
    try {
      const { data, error } = await supabase.functions.invoke('social-media-analyzer', {
        body: {
          action: 'detect_viral',
          min_viral_score: minViralScore,
          timeframe: '24h',
          platforms: ['tiktok', 'instagram'],
          include_metrics: true
        }
      })

      if (error) throw error
      return data.viral_products || []
    } catch (error) {
      console.error('Viral products detection failed:', error)
      throw error
    }
  }

  async getInfluencerInsights(niche: string): Promise<any[]> {
    try {
      const { data, error } = await supabase.functions.invoke('social-media-analyzer', {
        body: {
          action: 'influencer_insights',
          niche,
          min_followers: 10000,
          platforms: ['tiktok', 'instagram', 'youtube'],
          include_product_mentions: true
        }
      })

      if (error) throw error
      return data.influencers || []
    } catch (error) {
      console.error('Influencer insights failed:', error)
      throw error
    }
  }

  async trackCompetitorSocialPresence(competitors: string[]): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('social-media-analyzer', {
        body: {
          action: 'competitor_tracking',
          competitors,
          platforms: ['tiktok', 'instagram', 'facebook', 'youtube'],
          metrics: ['followers', 'engagement', 'content_volume', 'hashtag_usage'],
          timeframe: '30d'
        }
      })

      if (error) throw error
      return data.competitor_analysis || {}
    } catch (error) {
      console.error('Competitor social tracking failed:', error)
      throw error
    }
  }

  clearCache(): void {
    this.cache.clear()
  }
}

export const socialMediaAnalysisService = SocialMediaAnalysisService.getInstance()