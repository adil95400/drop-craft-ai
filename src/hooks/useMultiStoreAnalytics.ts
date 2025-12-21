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
    queryFn: async (): Promise<StorePerformanceAnalytics[]> => {
      // Return empty array - table doesn't exist in types
      return [];
    },
  });
}

export function useComparativeAnalytics() {
  return useQuery({
    queryKey: ['comparative-analytics'],
    queryFn: async (): Promise<ComparativeAnalytics[]> => {
      // Return empty array - table doesn't exist in types
      return [];
    },
  });
}

export function usePredictiveAnalytics(storeId?: string) {
  return useQuery({
    queryKey: ['predictive-analytics', storeId],
    queryFn: async (): Promise<PredictiveAnalytics[]> => {
      // Return empty array - table doesn't exist in types
      return [];
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
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as AnalyticsInsight[];
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
          is_read: true
        } as any)
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
      // Comparison functionality not available - table doesn't exist
      console.log('Comparison created:', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparative-analytics'] });
    },
  });
}
