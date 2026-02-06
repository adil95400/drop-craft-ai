import { useQuery, useMutation } from '@tanstack/react-query';
import { shopOptiApi } from '@/services/api/ShopOptiApiClient';

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
      const queryParams = new URLSearchParams({
        start_date: params.startDate,
        end_date: params.endDate,
      });
      if (params.marketplace) queryParams.set('marketplace', params.marketplace);
      
      const res = await shopOptiApi.request<ConversionMetrics>(
        `/analytics/conversions?${queryParams.toString()}`
      );
      if (!res.success) throw new Error(res.error || 'Failed to fetch conversion metrics');
      return res.data;
    },
    enabled: !!params.startDate && !!params.endDate
  });

  const trackProductView = useMutation({
    mutationFn: async ({ productId, marketplace, source }: {
      productId: string;
      marketplace?: string;
      source?: string;
    }) => {
      const res = await shopOptiApi.request('/analytics/conversions/track-view', {
        method: 'POST',
        body: { product_id: productId, marketplace, source },
      });
      if (!res.success) throw new Error(res.error || 'Failed to track view');
      return res.data;
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
      const res = await shopOptiApi.request(
        `/analytics/products/${productId}/performance?days=${days}`
      );
      if (!res.success) throw new Error(res.error || 'Failed to fetch product performance');
      return res.data;
    },
    enabled: !!productId
  });
}
