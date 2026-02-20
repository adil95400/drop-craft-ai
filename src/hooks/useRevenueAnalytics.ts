import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RevenueMetrics {
  mrr: number;
  arr: number;
  mrr_growth: number;
  churn_rate: number;
  ltv: number;
  active_subscribers: number;
  canceled_last_30d: number;
  trend: Array<{ month: string; revenue: number }>;
  plan_distribution: Record<string, number>;
  revenue_last_30d: number;
  computed_at: string;
}

export function useRevenueAnalytics() {
  return useQuery<RevenueMetrics>({
    queryKey: ['revenue-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('revenue-analytics');
      if (error) throw error;
      return data as RevenueMetrics;
    },
    staleTime: 5 * 60_000, // 5 min
    refetchInterval: 10 * 60_000, // 10 min
  });
}
