import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StockPrediction {
  id: string;
  user_id: string;
  product_id: string;
  store_id: string | null;
  current_stock: number;
  predicted_stockout_date: string | null;
  predicted_days_until_stockout: number | null;
  confidence_score: number;
  daily_sale_velocity: number;
  trend_direction: string;
  recommendation: string | null;
  reorder_quantity: number | null;
  reorder_urgency: string;
  last_calculated_at: string;
  created_at: string;
  updated_at: string;
}

export interface ReorderSuggestion {
  id: string;
  user_id: string;
  product_id: string;
  supplier_id: string | null;
  store_id: string | null;
  suggested_quantity: number;
  suggested_reorder_point: number | null;
  estimated_cost: number | null;
  priority_score: number | null;
  reasoning: any;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  order_placed_at: string | null;
  expected_delivery_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockAlert {
  id: string;
  user_id: string;
  product_id: string;
  store_id: string | null;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  current_stock: number | null;
  threshold_value: number | null;
  recommended_action: string | null;
  action_data: any;
  is_read: boolean;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockSyncRule {
  id: string;
  user_id: string;
  rule_name: string;
  source_store_id: string;
  target_store_ids: string[];
  sync_mode: string;
  sync_frequency: string | null;
  product_filters: any;
  allocation_strategy: string;
  allocation_config: any;
  is_active: boolean;
  last_sync_at: string | null;
  next_sync_at: string | null;
  sync_stats: any;
  created_at: string;
  updated_at: string;
}

export function useStockIntelligence() {
  const queryClient = useQueryClient();

  // Fetch stock predictions
  const {
    data: predictions = [],
    isLoading: isLoadingPredictions,
  } = useQuery({
    queryKey: ['stock-predictions'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('stock_predictions')
        .select('*')
        .order('reorder_urgency', { ascending: false })
        .order('predicted_days_until_stockout', { ascending: true });

      if (error) throw error;
      return (data || []) as StockPrediction[];
    },
  });

  // Fetch reorder suggestions
  const {
    data: suggestions = [],
    isLoading: isLoadingSuggestions,
  } = useQuery({
    queryKey: ['reorder-suggestions'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('reorder_suggestions')
        .select('*')
        .eq('status', 'pending')
        .order('priority_score', { ascending: false });

      if (error) throw error;
      return (data || []) as ReorderSuggestion[];
    },
  });

  // Fetch stock alerts
  const {
    data: alerts = [],
    isLoading: isLoadingAlerts,
  } = useQuery({
    queryKey: ['stock-intelligence-alerts'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('stock_alerts')
        .select('*')
        .eq('is_resolved', false)
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false});

      if (error) throw error;
      return (data || []) as StockAlert[];
    },
  });

  // Fetch sync rules
  const {
    data: syncRules = [],
    isLoading: isLoadingSyncRules,
  } = useQuery({
    queryKey: ['stock-sync-rules'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('stock_sync_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as StockSyncRule[];
    },
  });

  // Approve reorder suggestion
  const approveSuggestion = useMutation({
    mutationFn: async (suggestionId: string) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from('reorder_suggestions')
        .update({
          status: 'approved',
          approved_by: user.user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', suggestionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reorder-suggestions'] });
      toast.success('Suggestion de réassort approuvée');
    },
    onError: () => {
      toast.error('Erreur lors de l\'approbation');
    },
  });

  // Reject reorder suggestion
  const rejectSuggestion = useMutation({
    mutationFn: async (suggestionId: string) => {
      const { error } = await (supabase as any)
        .from('reorder_suggestions')
        .update({ status: 'rejected' })
        .eq('id', suggestionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reorder-suggestions'] });
      toast.success('Suggestion rejetée');
    },
    onError: () => {
      toast.error('Erreur lors du rejet');
    },
  });

  // Mark alert as read
  const markAlertAsRead = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await (supabase as any)
        .from('stock_alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-intelligence-alerts'] });
    },
  });

  // Resolve alert
  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from('stock_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user.user?.id,
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-intelligence-alerts'] });
      toast.success('Alerte résolue');
    },
    onError: () => {
      toast.error('Erreur lors de la résolution');
    },
  });

  // Toggle sync rule
  const toggleSyncRule = useMutation({
    mutationFn: async ({ ruleId, isActive }: { ruleId: string; isActive: boolean }) => {
      const { error } = await (supabase as any)
        .from('stock_sync_rules')
        .update({ is_active: isActive })
        .eq('id', ruleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-sync-rules'] });
      toast.success('Règle de synchronisation mise à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });

  return {
    predictions,
    suggestions,
    alerts,
    syncRules,
    isLoadingPredictions,
    isLoadingSuggestions,
    isLoadingAlerts,
    isLoadingSyncRules,
    approveSuggestion: approveSuggestion.mutate,
    rejectSuggestion: rejectSuggestion.mutate,
    markAlertAsRead: markAlertAsRead.mutate,
    resolveAlert: resolveAlert.mutate,
    toggleSyncRule: toggleSyncRule.mutate,
    isApprovingSuggestion: approveSuggestion.isPending,
    isRejectingSuggestion: rejectSuggestion.isPending,
    isResolvingAlert: resolveAlert.isPending,
  };
}
