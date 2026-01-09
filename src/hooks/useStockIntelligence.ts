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
  product_name?: string;
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
  product_name?: string;
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

  // Generate predictions via AI
  const generatePredictions = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('stock-intelligence-ai', {
        body: { action: 'generate-predictions' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stock-predictions'] });
      queryClient.invalidateQueries({ queryKey: ['reorder-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['stock-intelligence-alerts'] });
      toast.success(`Prédictions générées: ${data.predictions} produits analysés`);
    },
    onError: (error) => {
      console.error('Generation error:', error);
      toast.error('Erreur lors de la génération des prédictions');
    },
  });

  // Fetch stock predictions with product names
  const {
    data: predictions = [],
    isLoading: isLoadingPredictions,
  } = useQuery({
    queryKey: ['stock-predictions'],
    queryFn: async () => {
      const { data: predictionsData, error } = await supabase
        .from('stock_predictions')
        .select('*')
        .order('reorder_urgency', { ascending: false })
        .order('predicted_days_until_stockout', { ascending: true });

      if (error) throw error;
      
      // Get product names
      const productIds = (predictionsData || []).map((p: any) => p.product_id);
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('id, title')
          .in('id', productIds);
        
        const productMap = new Map((products || []).map((p: any) => [p.id, p.title]));
        return (predictionsData || []).map((p: any) => ({
          ...p,
          product_name: productMap.get(p.product_id) || p.product_id,
        })) as StockPrediction[];
      }
      
      return (predictionsData || []) as StockPrediction[];
    },
  });

  // Fetch reorder suggestions with product names
  const {
    data: suggestions = [],
    isLoading: isLoadingSuggestions,
  } = useQuery({
    queryKey: ['reorder-suggestions'],
    queryFn: async () => {
      const { data: suggestionsData, error } = await supabase
        .from('reorder_suggestions')
        .select('*')
        .eq('status', 'pending')
        .order('priority_score', { ascending: false });

      if (error) throw error;
      
      // Get product names
      const productIds = (suggestionsData || []).map((s: any) => s.product_id);
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('id, title')
          .in('id', productIds);
        
        const productMap = new Map((products || []).map((p: any) => [p.id, p.title]));
        return (suggestionsData || []).map((s: any) => ({
          ...s,
          product_name: productMap.get(s.product_id) || s.product_id,
        })) as ReorderSuggestion[];
      }
      
      return (suggestionsData || []) as ReorderSuggestion[];
    },
  });

  // Fetch stock alerts
  const {
    data: alerts = [],
    isLoading: isLoadingAlerts,
  } = useQuery({
    queryKey: ['stock-intelligence-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_alerts')
        .select('*')
        .eq('is_resolved', false)
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as StockAlert[];
    },
  });

  // Sync rules - disabled (table doesn't exist)
  const syncRules: StockSyncRule[] = [];
  const isLoadingSyncRules = false;

  // Approve reorder suggestion
  const approveSuggestion = useMutation({
    mutationFn: async (suggestionId: string) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('reorder_suggestions')
        .update({
          status: 'approved',
          approved_by: userData.user?.id,
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
      const { error } = await supabase
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
      const { error } = await supabase
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
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('stock_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: userData.user?.id,
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

  // Toggle sync rule - disabled
  const toggleSyncRule = (_params: { ruleId: string; isActive: boolean }) => {
    toast.info('Synchronisation non disponible');
  };

  return {
    predictions,
    suggestions,
    alerts,
    syncRules,
    isLoadingPredictions,
    isLoadingSuggestions,
    isLoadingAlerts,
    isLoadingSyncRules,
    generatePredictions: generatePredictions.mutate,
    isGeneratingPredictions: generatePredictions.isPending,
    approveSuggestion: approveSuggestion.mutate,
    rejectSuggestion: rejectSuggestion.mutate,
    markAlertAsRead: markAlertAsRead.mutate,
    resolveAlert: resolveAlert.mutate,
    toggleSyncRule,
    isApprovingSuggestion: approveSuggestion.isPending,
    isRejectingSuggestion: rejectSuggestion.isPending,
    isResolvingAlert: resolveAlert.isPending,
  };
}
