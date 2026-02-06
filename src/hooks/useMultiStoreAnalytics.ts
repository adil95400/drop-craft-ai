import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StorePerformanceAnalytics {
  id: string;
  user_id: string;
  store_identifier: string | null;
  store_name: string | null;
  analysis_period_start: string;
  analysis_period_end: string;
  total_revenue: number;
  total_orders: number;
  avg_order_value: number;
  conversion_rate: number;
  customer_acquisition_cost: number;
  customer_lifetime_value: number;
  inventory_turnover_rate: number;
  profit_margin: number;
  top_products: any[];
  top_categories: any[];
  customer_segments: any;
  sales_trends: any;
  performance_score: number;
  recommendations: any[];
  created_at: string;
  updated_at: string;
}

export interface ComparativeAnalytics {
  id: string;
  user_id: string;
  comparison_name: string;
  store_identifiers: string[];
  comparison_period_start: string;
  comparison_period_end: string;
  comparison_data: any;
  insights: any[];
  best_performers: any[];
  underperformers: any[];
  optimization_opportunities: any[];
  created_at: string;
  updated_at: string;
}

export interface PredictiveAnalytics {
  id: string;
  user_id: string;
  store_identifier: string | null;
  store_name: string | null;
  prediction_type: string;
  prediction_period_start: string;
  prediction_period_end: string;
  predictions: any;
  confidence_score: number;
  factors_analyzed: any[];
  recommendations: any[];
  actual_results: any;
  accuracy_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsInsight {
  id: string;
  user_id: string;
  store_identifier: string | null;
  store_name: string | null;
  insight_type: string;
  insight_category: string;
  title: string;
  description: string;
  severity: string;
  impact_score: number;
  confidence_level: number;
  data_points: any;
  recommended_actions: any[];
  is_acknowledged: boolean;
  acknowledged_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useStorePerformanceAnalytics(storeId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['store-performance-analytics', storeId, user?.id],
    queryFn: async (): Promise<StorePerformanceAnalytics[]> => {
      if (!user?.id) return [];
      // Use analytics_snapshots as proxy
      const { data, error } = await supabase
        .from('analytics_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .eq('snapshot_type', 'store_performance')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data || []).map(d => ({
        id: d.id,
        user_id: d.user_id,
        store_identifier: null,
        store_name: null,
        analysis_period_start: d.snapshot_date,
        analysis_period_end: d.snapshot_date,
        total_revenue: (d.metrics as any)?.revenue || 0,
        total_orders: (d.metrics as any)?.orders || 0,
        avg_order_value: (d.metrics as any)?.avg_order_value || 0,
        conversion_rate: (d.metrics as any)?.conversion_rate || 0,
        customer_acquisition_cost: 0,
        customer_lifetime_value: 0,
        inventory_turnover_rate: 0,
        profit_margin: 0,
        top_products: [],
        top_categories: [],
        customer_segments: {},
        sales_trends: {},
        performance_score: 0,
        recommendations: [],
        created_at: d.created_at,
        updated_at: d.created_at,
      }));
    },
    enabled: !!user?.id,
  });
}

export function useComparativeAnalytics() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['comparative-analytics', user?.id],
    queryFn: async (): Promise<ComparativeAnalytics[]> => {
      return []; // No real table for this yet
    },
    enabled: !!user?.id,
  });
}

export function usePredictiveAnalytics(storeId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['predictive-analytics-store', storeId, user?.id],
    queryFn: async (): Promise<PredictiveAnalytics[]> => {
      return []; // Requires AI backend
    },
    enabled: !!user?.id,
  });
}

export function useAnalyticsInsights(acknowledged?: boolean) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['analytics-insights', acknowledged, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('analytics_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as any as AnalyticsInsight[];
    },
    enabled: !!user?.id,
  });
}

export function useAcknowledgeInsightMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (insightId: string) => {
      const { error } = await supabase
        .from('analytics_insights')
        .update({ metadata: { acknowledged: true } })
        .eq('id', insightId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics-insights'] });
    },
  });
}

export function useCreateComparison() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      // No real table for comparisons yet
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparative-analytics'] });
    },
  });
}
