import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
      if (!user?.id) throw new Error('User not authenticated');
      const { data: campaigns } = await supabase.from('marketing_campaigns')
        .select('*').eq('user_id', user.id);
      const { data: automations } = await supabase.from('automated_campaigns')
        .select('id, is_active').eq('user_id', user.id);

      const c = campaigns || [];
      const a = automations || [];
      const active = c.filter((x: any) => x.status === 'active');

      return {
        activeCampaigns: active.length, totalCampaigns: c.length, openRate: 0, clickRate: 0,
        conversions: c.reduce((s: number, x: any) => s + (x.conversions || 0), 0),
        conversionRate: 0, avgROI: 0,
        totalRevenue: c.reduce((s: number, x: any) => s + (x.revenue || 0), 0),
        totalSpend: c.reduce((s: number, x: any) => s + (x.spent || 0), 0),
        emailsSent: 0, automationsActive: a.filter((x: any) => x.is_active).length,
        segmentsCount: 0, isDemo: c.length === 0,
      };
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });
}
