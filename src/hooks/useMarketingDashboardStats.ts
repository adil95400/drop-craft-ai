import { useQuery } from '@tanstack/react-query'
import { shopOptiApi } from '@/services/api/ShopOptiApiClient'
import { useAuth } from '@/contexts/AuthContext'

export interface MarketingDashboardStats {
  activeCampaigns: number; totalCampaigns: number; openRate: number; clickRate: number
  conversions: number; conversionRate: number; avgROI: number; totalRevenue: number
  totalSpend: number; emailsSent: number; automationsActive: number; segmentsCount: number
  isDemo: boolean
}

export function useMarketingDashboardStats() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['marketing-dashboard-stats', user?.id],
    queryFn: async (): Promise<MarketingDashboardStats> => {
      if (!user?.id) throw new Error('User not authenticated')
      const res = await shopOptiApi.request<MarketingDashboardStats>('/marketing/dashboard-stats')
      return res.data || {
        activeCampaigns: 8, totalCampaigns: 12, openRate: 34.2, clickRate: 4.8,
        conversions: 142, conversionRate: 2.8, avgROI: 328, totalRevenue: 15840,
        totalSpend: 3670, emailsSent: 4560, automationsActive: 5, segmentsCount: 6, isDemo: true
      }
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  })
}
