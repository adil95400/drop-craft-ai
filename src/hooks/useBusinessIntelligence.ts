import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shopOptiApi } from '@/services/api/ShopOptiApiClient';

export function usePriorityInsights() {
  return useQuery({
    queryKey: ['business-insights', 'priority'],
    queryFn: async () => {
      const res = await shopOptiApi.request('/analytics/insights?priority=true');
      if (!res.success) return [];
      return res.data || [];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useInsightMetrics() {
  return useQuery({
    queryKey: ['insight-metrics'],
    queryFn: async () => {
      const res = await shopOptiApi.request('/analytics/insights/metrics');
      if (!res.success) return null;
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAcknowledgeInsight() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (insightId: string) => {
      const res = await shopOptiApi.request(`/analytics/insights/${insightId}/acknowledge`, {
        method: 'POST',
      });
      if (!res.success) throw new Error(res.error || 'Failed to acknowledge');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-insights'] });
    },
  });
}

export function useDismissInsight() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (insightId: string) => {
      const res = await shopOptiApi.request(`/analytics/insights/${insightId}/dismiss`, {
        method: 'POST',
      });
      if (!res.success) throw new Error(res.error || 'Failed to dismiss');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-insights'] });
    },
  });
}

export function useGenerateInsights() {
  return useMutation({
    mutationFn: async ({ analysisType, timeRange }: { analysisType?: string; timeRange?: string }) => {
      const res = await shopOptiApi.request('/analytics/insights/generate', {
        method: 'POST',
        body: { analysis_type: analysisType, time_range: timeRange },
      });
      if (!res.success) throw new Error(res.error || 'Failed to generate insights');
      return res.data;
    },
  });
}
