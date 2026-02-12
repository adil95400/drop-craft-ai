import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { marketingApi } from '@/services/api/client';

export function useMarketingStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['marketing-engagement-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      const stats = await marketingApi.stats();
      return {
        emailOpenRate: 0, emailClickRate: 0,
        conversionRate: stats.conversionRate || 0,
        socialMetrics: { likes: 0, shares: 0, comments: 0, organicReach: 0 },
        totalConversions: stats.totalConversions || 0,
        totalEvents: stats.totalCampaigns || 0,
      };
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });
}
