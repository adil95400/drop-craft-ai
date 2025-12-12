import { useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface AdData {
  id: string;
  platform: string;
  advertiser: string;
  title: string;
  description?: string;
  media_url?: string;
  thumbnail_url?: string;
  cta?: string;
  landing_url?: string;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views?: number;
  };
  engagement_rate: number;
  first_seen: string;
  last_seen: string;
  days_running: number;
  countries: string[];
  winner_score: number;
  product_info?: {
    name: string;
    price: number;
    category: string;
  };
}

export interface AdvertiserAnalysis {
  advertiser_id: string;
  total_ads: number;
  active_ads: number;
  estimated_spend: number;
  avg_engagement_rate: string;
  top_performing_ads: any[];
  ad_formats: {
    video: number;
    image: number;
    carousel: number;
  };
  targeting_insights: {
    age_groups: string[];
    interests: string[];
    countries: string[];
  };
  creative_patterns: {
    avg_video_length: string;
    common_ctas: string[];
    hook_style: string;
  };
  performance_trends: {
    last_7_days: string;
    last_30_days: string;
    trend: string;
  };
}

export function useAdSpyScraper() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [ads, setAds] = useState<AdData[]>([])
  const [trendingAds, setTrendingAds] = useState<AdData[]>([])
  const [advertiserAnalysis, setAdvertiserAnalysis] = useState<AdvertiserAnalysis | null>(null)

  const searchAds = useCallback(async (params: {
    keyword?: string;
    platform?: string;
    country?: string;
    filters?: {
      minEngagement?: number;
      minScore?: number;
      daysRunning?: number;
    };
    limit?: number;
  }) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('ad-spy-scraper', {
        body: {
          action: 'search_ads',
          keyword: params.keyword,
          platform: params.platform,
          country: params.country,
          filters: params.filters || {},
          limit: params.limit || 50
        }
      })

      if (error) throw error

      if (data?.success && data?.ads) {
        setAds(data.ads)
        toast({
          title: 'Recherche terminée',
          description: `${data.ads.length} publicités trouvées`
        })
        return data.ads
      }

      return []
    } catch (error: any) {
      console.error('Error searching ads:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de rechercher les publicités',
        variant: 'destructive'
      })
      return []
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const getTrendingAds = useCallback(async (platform?: string, country?: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('ad-spy-scraper', {
        body: {
          action: 'get_trending_ads',
          platform,
          country
        }
      })

      if (error) throw error

      if (data?.success && data?.trending_ads) {
        setTrendingAds(data.trending_ads)
        toast({
          title: 'Tendances chargées',
          description: `${data.trending_ads.length} publicités tendance`
        })
        return data.trending_ads
      }

      return []
    } catch (error: any) {
      console.error('Error getting trending ads:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de charger les tendances',
        variant: 'destructive'
      })
      return []
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const analyzeAdvertiser = useCallback(async (advertiserId: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('ad-spy-scraper', {
        body: {
          action: 'analyze_advertiser',
          filters: { advertiser_id: advertiserId }
        }
      })

      if (error) throw error

      if (data?.success && data?.analysis) {
        setAdvertiserAnalysis(data.analysis)
        toast({
          title: 'Analyse terminée',
          description: `${data.analysis.total_ads} publicités analysées`
        })
        return data.analysis
      }

      return null
    } catch (error: any) {
      console.error('Error analyzing advertiser:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'analyser l\'annonceur',
        variant: 'destructive'
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const trackProductAds = useCallback(async (productUrl: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('ad-spy-scraper', {
        body: {
          action: 'track_product_ads',
          filters: { product_url: productUrl }
        }
      })

      if (error) throw error

      if (data?.success && data?.product_ads) {
        toast({
          title: 'Suivi des publicités',
          description: `${data.product_ads.total_ads_found} publicités trouvées pour ce produit`
        })
        return data.product_ads
      }

      return null
    } catch (error: any) {
      console.error('Error tracking product ads:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de suivre les publicités',
        variant: 'destructive'
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  return {
    isLoading,
    ads,
    trendingAds,
    advertiserAnalysis,
    searchAds,
    getTrendingAds,
    analyzeAdvertiser,
    trackProductAds
  }
}
