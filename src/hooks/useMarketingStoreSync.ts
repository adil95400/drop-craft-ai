import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface SyncStats { active_rules: number; total_rules: number; total_executions: number; success_rate: number; estimated_savings: number; connected_platforms: number; recent_syncs: any[]; }
interface AutomationRule { id: string; name: string; description: string | null; trigger_type: string; action_type: string; is_active: boolean; trigger_count: number; last_triggered_at: string | null; trigger_config: any; action_config: any; }

export function useMarketingStoreSync() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: rules = [], isLoading: isLoadingRules } = useQuery<AutomationRule[]>({
    queryKey: ['marketing-automation-rules', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.from('automation_rules')
        .select('*').eq('user_id', user.id);
      if (error) throw error;
      return (data || []) as AutomationRule[];
    },
    enabled: !!user?.id,
  });

  const stats: SyncStats = {
    active_rules: rules.filter(r => r.is_active).length, total_rules: rules.length,
    total_executions: rules.reduce((s, r) => s + (r.trigger_count || 0), 0),
    success_rate: 100, estimated_savings: 0, connected_platforms: 0, recent_syncs: [],
  };

  const syncCoupons = useMutation({
    mutationFn: async () => { toast.success('Synchronisation des coupons non disponible pour le moment'); },
  });

  const importCustomers = useMutation({
    mutationFn: async () => { toast.success("Import des clients non disponible pour le moment"); },
  });

  const toggleRule = useMutation({
    mutationFn: async ({ ruleId, isActive }: { ruleId: string; isActive: boolean }) => {
      const { error } = await supabase.from('automation_rules').update({ is_active: isActive } as any).eq('id', ruleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-automation-rules'] });
      toast.success('Règle mise à jour');
    },
  });

  return {
    stats, isLoadingStats: isLoadingRules, rules, isLoadingRules,
    syncCoupons: syncCoupons.mutate, isSyncingCoupons: syncCoupons.isPending,
    importCustomers: importCustomers.mutate, isImportingCustomers: importCustomers.isPending,
    toggleRule: toggleRule.mutate, isTogglingRule: toggleRule.isPending,
  };
}
