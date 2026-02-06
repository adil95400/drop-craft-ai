import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['conversion-analytics', params, user?.id],
    queryFn: async (): Promise<ConversionMetrics | undefined> => {
      if (!user?.id) return undefined;
      
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', params.startDate)
        .lte('created_at', params.endDate);
      if (error) throw error;

      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((s, o) => s + (o.total_amount || 0), 0) || 0;

      return {
        overview: {
          total_orders: totalOrders,
          total_revenue: totalRevenue,
          total_views: 0,
          conversion_rate: 0,
          average_order_value: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        },
        top_products: [],
        by_marketplace: {},
        time_series: [],
      };
    },
    enabled: !!params.startDate && !!params.endDate && !!user?.id,
  });

  const trackProductView = useMutation({
    mutationFn: async ({ productId }: { productId: string; marketplace?: string; source?: string }) => {
      // Product view tracking would require a dedicated table
      console.log('Track product view:', productId);
    }
  });

  return {
    metrics: data,
    isLoading,
    trackProductView: trackProductView.mutate,
  };
}

export function useProductPerformance(productId: string, days: number = 30) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['product-performance', productId, days, user?.id],
    queryFn: async () => {
      if (!user?.id || !productId) return null;
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .limit(50);
      if (error) throw error;
      return { orders: data?.length || 0, revenue: data?.reduce((s, o) => s + (o.total_amount || 0), 0) || 0 };
    },
    enabled: !!productId && !!user?.id,
  });
}
