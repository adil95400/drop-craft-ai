import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  return useQuery({
    queryKey: ['store-performance-analytics', storeId],
    queryFn: async () => {
      let query = supabase
        .from('store_performance_analytics')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (storeId) {
        query = query.eq('store_identifier', storeId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as StorePerformanceAnalytics[];
    },
  });
}

export function useComparativeAnalytics() {
  return useQuery({
    queryKey: ['comparative-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_comparative_analytics')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ComparativeAnalytics[];
    },
  });
}

export function usePredictiveAnalytics(storeId?: string) {
  return useQuery({
    queryKey: ['predictive-analytics', storeId],
    queryFn: async () => {
      let query = supabase
        .from('predictive_analytics')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (storeId) {
        query = query.eq('store_identifier', storeId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as PredictiveAnalytics[];
    },
  });
}

export function useAnalyticsInsights(acknowledged?: boolean) {
  return useQuery({
    queryKey: ['analytics-insights', acknowledged],
    queryFn: async () => {
      let query = supabase
        .from('analytics_insights')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (acknowledged !== undefined) {
        query = query.eq('is_acknowledged', acknowledged);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as AnalyticsInsight[];
    },
  });
}

export function useAcknowledgeInsightMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (insightId: string) => {
      const { error } = await supabase
        .from('analytics_insights')
        .update({ 
          is_acknowledged: true,
          acknowledged_at: new Date().toISOString()
        })
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
      const { error } = await supabase
        .from('store_comparative_analytics')
        .insert([data]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparative-analytics'] });
    },
  });
}
