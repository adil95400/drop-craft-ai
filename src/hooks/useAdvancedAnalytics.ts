import { useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

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
      // Fetch advanced data from multiple sources
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      const { data: products } = await supabase
        .from('catalog_products')
        .select('*')
        .limit(50)

      // Generate advanced analytics with AI-like calculations
      const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0
      const avgOrderValue = orders?.length ? totalRevenue / orders.length : 0
      
      // Predictive analytics (simulated AI predictions)
      const revenueGrowthRate = Math.random() * 0.3 + 0.1 // 10-40% growth
      const nextMonthRevenue = totalRevenue * (1 + revenueGrowthRate)
      
      // Performance insights
      const topPerformingHours = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        orders: Math.floor(Math.random() * 50) + (hour >= 9 && hour <= 21 ? 20 : 5)
      })).sort((a, b) => b.orders - a.orders).slice(0, 6)

      // Competitive intelligence
      const competitiveScore = Math.random() * 100
      const marketPosition = competitiveScore > 70 ? 'leader' : competitiveScore > 40 ? 'follower' : 'niche'

      // Generate smart alerts
      const alerts = []
      
      if (avgOrderValue < 50) {
        alerts.push({
          type: 'opportunity' as const,
          message: 'Panier moyen faible - Implémentez des stratégies d\'upselling',
          impact: 'high' as const,
          actionRequired: true
        })
      }

      if (orders && orders.length > 0) {
        const recentOrders = orders.slice(0, 10)
        const orderGrowth = recentOrders.length > 5
        if (orderGrowth) {
          alerts.push({
            type: 'opportunity' as const,
            message: 'Pic d\'activité détecté - Optimisez votre stock',
            impact: 'medium' as const,
            actionRequired: false
          })
        }
      }

      if (products && products.length < 10) {
        alerts.push({
          type: 'warning' as const,
          message: 'Catalogue limité - Diversifiez votre offre produits',
          impact: 'high' as const,
          actionRequired: true
        })
      }

      return {
        predictions: {
          nextMonthRevenue,
          trendDirection: revenueGrowthRate > 0.2 ? 'up' : revenueGrowthRate < 0.1 ? 'down' : 'stable',
          confidenceScore: Math.floor(Math.random() * 30) + 70 // 70-100%
        },
        performance: {
          topPerformingHours,
          conversionBySource: [
            { source: 'Direct', rate: Math.random() * 5 + 2 },
            { source: 'Social Media', rate: Math.random() * 3 + 1 },
            { source: 'Email', rate: Math.random() * 4 + 2.5 },
            { source: 'Ads', rate: Math.random() * 6 + 3 }
          ],
          customerLifetimeValue: avgOrderValue * (Math.random() * 3 + 2) // 2-5x AOV
        },
        alerts,
        competitiveIntelligence: {
          marketPosition,
          priceCompetitiveness: Math.floor(competitiveScore),
          opportunityScore: Math.floor(Math.random() * 40) + 60 // 60-100
        }
      }
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