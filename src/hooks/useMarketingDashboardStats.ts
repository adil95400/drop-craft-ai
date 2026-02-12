import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { marketingApi } from '@/services/api/client';

export interface MarketingDashboardStats {
  activeCampaigns: number; totalCampaigns: number; openRate: number; clickRate: number;
  conversions: number; conversionRate: number; avgROI: number; totalRevenue: number;
  totalSpend: number; emailsSent: number; automationsActive: number; segmentsCount: number; isDemo: boolean;
}

export function useMarketingDashboardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['marketing-dashboard-stats', user?.id],
    queryFn: async (): Promise<MarketingDashboardStats> => {
      return await marketingApi.dashboardStats();
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });
}
