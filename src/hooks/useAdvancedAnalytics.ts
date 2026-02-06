import { useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { shopOptiApi } from '@/services/api/ShopOptiApiClient'

export interface AdvancedAnalytics {
  predictions: {
    nextMonthRevenue: number
    trendDirection: 'up' | 'down' | 'stable'
    confidenceScore: number
  }
  performance: {
    topPerformingHours: Array<{ hour: number; orders: number }>
    conversionBySource: Array<{ source: string; rate: number }>
    customerLifetimeValue: number
  }
  alerts: Array<{
    type: 'opportunity' | 'warning' | 'critical'
    message: string
    impact: 'high' | 'medium' | 'low'
    actionRequired: boolean
  }>
  competitiveIntelligence: {
    marketPosition: 'leader' | 'follower' | 'niche'
    priceCompetitiveness: number
    opportunityScore: number
  }
}

export const useAdvancedAnalytics = () => {
  const { toast } = useToast()

  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['advanced-analytics'],
    queryFn: async (): Promise<AdvancedAnalytics> => {
      const res = await shopOptiApi.getPredictiveInsights()
      if (!res.success || !res.data) {
        throw new Error(res.error || 'Failed to fetch advanced analytics')
      }
      return res.data as AdvancedAnalytics
    },
    meta: {
      onError: () => {
        toast({
          title: "Erreur d'analyse avancée",
          description: "Impossible de charger les analytics avancés",
          variant: "destructive"
        })
      }
    }
  })

  return {
    analytics,
    isLoading,
    error
  }
}
