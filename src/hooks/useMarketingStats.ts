import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useMarketingStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['marketing-engagement-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      const { data: campaigns } = await supabase.from('marketing_campaigns')
        .select('*').eq('user_id', user.id);
      const c = campaigns || [];
      return {
        emailOpenRate: 0, emailClickRate: 0,
        conversionRate: c.length > 0 ? c.reduce((s: number, x: any) => s + (x.conversions || 0), 0) / Math.max(c.reduce((s: number, x: any) => s + (x.clicks || 1), 0), 1) * 100 : 0,
        socialMetrics: { likes: 0, shares: 0, comments: 0, organicReach: 0 },
        totalConversions: c.reduce((s: number, x: any) => s + (x.conversions || 0), 0),
        totalEvents: c.length,
      };
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });
}
