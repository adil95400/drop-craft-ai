import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { insightsApi } from '@/services/api/client';

export function usePriorityInsights() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['business-insights', 'priority', user?.id],
    queryFn: async () => {
      const resp = await insightsApi.list({ limit: 10 });
      return resp.items ?? [];
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useInsightMetrics() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['insight-metrics', user?.id],
    queryFn: async () => insightsApi.metrics(),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAcknowledgeInsight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (insightId: string) => {
      await insightsApi.acknowledge(insightId);
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
      await insightsApi.dismiss(insightId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-insights'] });
    },
  });
}

export function useGenerateInsights() {
  return useMutation({
    mutationFn: async ({ analysisType, timeRange }: { analysisType?: string; timeRange?: string }) => {
      return { message: 'Génération d\'insights disponible prochainement' };
    },
  });
}
