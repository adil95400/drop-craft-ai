import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ConversionMetrics {
  overview: {
    total_orders: number;
    total_revenue: number;
    total_views: number;
    conversion_rate: number;
    average_order_value: number;
  };
  top_products: Array<{
    product_id: string;
    product_name: string;
    orders: number;
    revenue: number;
    views?: number;
    conversion_rate?: number;
  }>;
  by_marketplace: Record<string, { orders: number; revenue: number }>;
  time_series: Array<{ date: string; orders: number; revenue: number }>;
}

export function useConversionAnalytics(params: {
  startDate: string;
  endDate: string;
  marketplace?: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['conversion-analytics', params],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('conversion-analytics', {
        body: { action: 'get_conversion_metrics', ...params }
      });
      if (error) throw error;
      return data.metrics as ConversionMetrics;
    },
    enabled: !!params.startDate && !!params.endDate
  });

  const trackProductView = useMutation({
    mutationFn: async ({ productId, marketplace, source }: {
      productId: string;
      marketplace?: string;
      source?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('conversion-analytics', {
        body: { action: 'track_product_view', productId, marketplace, source }
      });
      if (error) throw error;
      return data;
    }
  });

  return {
    metrics: data,
    isLoading,
    trackProductView: trackProductView.mutate,
  };
}

export function useProductPerformance(productId: string, days: number = 30) {
  return useQuery({
    queryKey: ['product-performance', productId, days],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('conversion-analytics', {
        body: { action: 'get_product_performance', productId, days }
      });
      if (error) throw error;
      return data.performance;
    },
    enabled: !!productId
  });
}
