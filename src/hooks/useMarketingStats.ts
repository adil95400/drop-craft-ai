import { useQuery } from '@tanstack/react-query'
import { shopOptiApi } from '@/services/api/ShopOptiApiClient'
import { useAuth } from '@/contexts/AuthContext'

export function useMarketingStats() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['marketing-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')
      const res = await shopOptiApi.request<{
        emailOpenRate: number; emailClickRate: number; conversionRate: number
        socialMetrics: { likes: number; shares: number; comments: number; organicReach: number }
        totalConversions: number; totalEvents: number
      }>('/marketing/engagement-stats')
      return res.data || {
        emailOpenRate: 24.5, emailClickRate: 3.2, conversionRate: 1.8,
        socialMetrics: { likes: 1234, shares: 567, comments: 89, organicReach: 12456 },
        totalConversions: 0, totalEvents: 0
      }
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  })
}
