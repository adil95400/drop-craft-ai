import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthOptimized } from '@/shared/hooks/useAuthOptimized';
import { toast } from 'sonner';

export interface UpsellRule {
  id: string;
  user_id: string;
  name: string;
  rule_type: string;
  trigger_product_id: string | null;
  trigger_category: string | null;
  recommended_product_ids: string[];
  discount_percent: number;
  min_cart_value: number | null;
  display_location: string;
  priority: number;
  is_active: boolean;
  impressions: number;
  conversions: number;
  revenue_generated: number;
  created_at: string;
}

export function useUpsellRules() {
  const { user } = useAuthOptimized();
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['upsell-rules', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase
        .from('upsell_rules') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: false });
      if (error) throw error;
      return (data || []) as UpsellRule[];
    },
    enabled: !!user?.id,
  });

  const stats = {
    total: rules.length,
    active: rules.filter(r => r.is_active).length,
    totalImpressions: rules.reduce((s, r) => s + r.impressions, 0),
    totalConversions: rules.reduce((s, r) => s + r.conversions, 0),
    totalRevenue: rules.reduce((s, r) => s + Number(r.revenue_generated), 0),
    conversionRate: rules.reduce((s, r) => s + r.impressions, 0) > 0
      ? ((rules.reduce((s, r) => s + r.conversions, 0) / rules.reduce((s, r) => s + r.impressions, 0)) * 100).toFixed(1)
      : '0',
  };

  const createRule = useMutation({
    mutationFn: async (rule: Partial<UpsellRule>) => {
      if (!user) throw new Error('Non authentifié');
      const { error } = await (supabase
        .from('upsell_rules') as any)
        .insert({ ...rule, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsell-rules'] });
      toast.success('Règle créée');
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await (supabase
        .from('upsell_rules') as any)
        .update({ is_active: active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsell-rules'] });
      toast.success('Statut mis à jour');
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from('upsell_rules') as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsell-rules'] });
      toast.success('Règle supprimée');
    },
  });

  return {
    rules,
    isLoading,
    stats,
    createRule: createRule.mutate,
    isCreating: createRule.isPending,
    toggleRule: toggleRule.mutate,
    deleteRule: deleteRule.mutate,
  };
}
