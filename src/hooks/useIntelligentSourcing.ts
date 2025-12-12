import { useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface DiscoveredProduct {
  title: string;
  price: number;
  image: string;
  source: string;
  url: string;
  rating?: number;
  reviews?: number;
  orders?: number;
  trending_score?: number;
}

export interface NicheAnalysis {
  niche_name: string;
  market_size: string;
  saturation_level: string;
  growth_rate: number;
  competition_score: number;
  entry_difficulty: string;
  profit_potential: number;
  trending_keywords: string[];
  recommended_products: any[];
  market_gaps: string[];
  seasonality: {
    peak_months: string[];
    low_months: string[];
    stability_score: number;
  };
  target_demographics: {
    age_range: string;
    gender_split: { male: number; female: number };
    primary_countries: string[];
  };
}

export interface TrendData {
  category: string;
  overall_trend: string;
  trend_score: number;
  momentum: string;
  top_trending_products: Array<{ name: string; growth: string; score: number }>;
  emerging_keywords: string[];
  social_signals: {
    tiktok_mentions: number;
    instagram_posts: number;
    pinterest_pins: number;
    youtube_videos: number;
  };
  predicted_peak: {
    date: string;
    confidence: number;
  };
  related_niches: Array<{ name: string; growth: string }>;
}

export interface CompetitorAds {
  domain: string;
  platform: string;
  ads_detected: number;
  estimated_ad_spend: number;
  top_performing_ads: any[];
  ad_creatives: {
    video_ads: number;
    image_ads: number;
    carousel_ads: number;
  };
  targeting_insights: {
    primary_audience: string;
    interests: string[];
    behaviors: string[];
  };
  performance_metrics: {
    avg_ctr: string;
    avg_cpm: string;
    estimated_conversions: number;
  };
}

export function useIntelligentSourcing() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<DiscoveredProduct[]>([])
  const [nicheAnalysis, setNicheAnalysis] = useState<NicheAnalysis | null>(null)
  const [trends, setTrends] = useState<TrendData | null>(null)
  const [competitorData, setCompetitorData] = useState<CompetitorAds | null>(null)

  const discoverWinningProducts = useCallback(async (params: {
    query?: string;
    category?: string;
    filters?: {
      minPrice?: number;
      maxPrice?: number;
      minRating?: number;
      minOrders?: number;
    };
    limit?: number;
  }) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('intelligent-sourcing', {
        body: {
          action: 'discover_winning_products',
          query: params.query || '',
          category: params.category,
          filters: params.filters || {},
          limit: params.limit || 50
        }
      })

      if (error) throw error

      if (data?.success && data?.products) {
        setProducts(data.products)
        toast({
          title: 'Produits découverts',
          description: `${data.products.length} produits gagnants trouvés`
        })
        return data.products
      }

      return []
    } catch (error: any) {
      console.error('Error discovering products:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de découvrir les produits',
        variant: 'destructive'
      })
      return []
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const analyzeNiche = useCallback(async (niche: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('intelligent-sourcing', {
        body: {
          action: 'analyze_niche',
          query: niche
        }
      })

      if (error) throw error

      if (data?.success && data?.niche_analysis) {
        setNicheAnalysis(data.niche_analysis)
        toast({
          title: 'Analyse terminée',
          description: `Niche "${niche}" analysée avec succès`
        })
        return data.niche_analysis
      }

      return null
    } catch (error: any) {
      console.error('Error analyzing niche:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'analyser la niche',
        variant: 'destructive'
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const spyCompetitor = useCallback(async (domain: string, platform?: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('intelligent-sourcing', {
        body: {
          action: 'competitor_spy',
          query: domain,
          platform
        }
      })

      if (error) throw error

      if (data?.success && data?.competitor_data) {
        setCompetitorData(data.competitor_data)
        toast({
          title: 'Espionnage terminé',
          description: `${data.competitor_data.ads_detected} publicités détectées`
        })
        return data.competitor_data
      }

      return null
    } catch (error: any) {
      console.error('Error spying competitor:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'espionner le concurrent',
        variant: 'destructive'
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const detectTrends = useCallback(async (category: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('intelligent-sourcing', {
        body: {
          action: 'trend_detection',
          query: category
        }
      })

      if (error) throw error

      if (data?.success && data?.trends) {
        setTrends(data.trends)
        toast({
          title: 'Tendances détectées',
          description: `Score de tendance: ${data.trends.trend_score}%`
        })
        return data.trends
      }

      return null
    } catch (error: any) {
      console.error('Error detecting trends:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de détecter les tendances',
        variant: 'destructive'
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const calculateProductScore = useCallback(async (productUrl: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('intelligent-sourcing', {
        body: {
          action: 'product_score',
          filters: { product_url: productUrl }
        }
      })

      if (error) throw error

      if (data?.success && data?.score) {
        toast({
          title: 'Score calculé',
          description: `Score global: ${data.score.overall_score}%`
        })
        return data.score
      }

      return null
    } catch (error: any) {
      console.error('Error calculating score:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de calculer le score',
        variant: 'destructive'
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  return {
    isLoading,
    products,
    nicheAnalysis,
    trends,
    competitorData,
    discoverWinningProducts,
    analyzeNiche,
    spyCompetitor,
    detectTrends,
    calculateProductScore
  }
}
