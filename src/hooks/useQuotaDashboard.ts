/**
 * useQuotaDashboard – Fetches all quota usage for the current user
 * Provides real-time usage data for display in dashboard widgets
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface QuotaUsageItem {
  quota_key: string;
  current_usage: number;
  limit: number;
  period_start: string;
  period_end: string;
  percentage: number;
  status: 'ok' | 'warning' | 'critical' | 'exceeded';
}

export interface QuotaDashboardData {
  plan: string;
  items: QuotaUsageItem[];
  total_actions_this_month: number;
}

const QUOTA_LABELS: Record<string, string> = {
  products_imported: 'Produits importés',
  ai_generations: 'Générations IA',
  seo_audits: 'Audits SEO',
  seo_generations: 'Générations SEO',
  seo_applies: 'Applications SEO',
  orders_created: 'Commandes créées',
  imports_monthly: 'Imports mensuels',
};

export function getQuotaLabel(key: string): string {
  return QUOTA_LABELS[key] || key;
}

export function useQuotaDashboard() {
  return useQuery({
    queryKey: ['quota-dashboard'],
    queryFn: async (): Promise<QuotaDashboardData> => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      const userId = userData.user.id;

      // Fetch profile for plan
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_plan, plan')
        .eq('id', userId)
        .maybeSingle();

      const plan = (profile as any)?.subscription_plan || (profile as any)?.plan || 'free';

      // Fetch plan limits
      const { data: limits } = await supabase
        .from('plan_limits')
        .select('limit_key, limit_value')
        .eq('plan_name', plan);

      const limitMap = new Map<string, number>();
      (limits || []).forEach((l: any) => limitMap.set(l.limit_key, l.limit_value));

      // Fetch current usage
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data: usage } = await supabase
        .from('quota_usage')
        .select('quota_key, current_usage, period_start, period_end')
        .eq('user_id', userId)
        .gte('period_start', periodStart);

      const items: QuotaUsageItem[] = [];
      let totalActions = 0;

      // Build items from limits (show all, even unused)
      for (const [limitKey, limitValue] of limitMap) {
        const usageRow = (usage || []).find((u: any) => u.quota_key === limitKey);
        const currentUsage = usageRow?.current_usage || 0;
        totalActions += currentUsage;

        const isUnlimited = limitValue === -1;
        const percentage = isUnlimited ? 0 : limitValue > 0 ? Math.round((currentUsage / limitValue) * 100) : 0;

        let status: QuotaUsageItem['status'] = 'ok';
        if (!isUnlimited) {
          if (currentUsage >= limitValue) status = 'exceeded';
          else if (percentage >= 80) status = 'critical';
          else if (percentage >= 60) status = 'warning';
        }

        items.push({
          quota_key: limitKey,
          current_usage: currentUsage,
          limit: limitValue,
          period_start: usageRow?.period_start || periodStart,
          period_end: usageRow?.period_end || new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
          percentage,
          status,
        });
      }

      // Sort: exceeded first, then critical, warning, ok
      const statusOrder = { exceeded: 0, critical: 1, warning: 2, ok: 3 };
      items.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

      return { plan, items, total_actions_this_month: totalActions };
    },
    staleTime: 60_000, // 1 min cache
    refetchInterval: 120_000, // Refresh every 2 min
  });
}
