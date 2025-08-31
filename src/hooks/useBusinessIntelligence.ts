import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BusinessIntelligenceService } from '@/services/BusinessIntelligenceService';

export function usePriorityInsights() {
  return useQuery({
    queryKey: ['business-insights', 'priority'],
    queryFn: () => BusinessIntelligenceService.getPriorityInsights(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useInsightMetrics() {
  return useQuery({
    queryKey: ['insight-metrics'],
    queryFn: () => BusinessIntelligenceService.getInsightMetrics(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAcknowledgeInsight() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (insightId: string) => 
      BusinessIntelligenceService.acknowledgeInsight(insightId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-insights'] });
    },
  });
}

export function useDismissInsight() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (insightId: string) => 
      BusinessIntelligenceService.dismissInsight(insightId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-insights'] });
    },
  });
}

export function useGenerateInsights() {
  return useMutation({
    mutationFn: ({ analysisType, timeRange }: { analysisType?: string; timeRange?: string }) => 
      BusinessIntelligenceService.generateInsights(analysisType, timeRange),
  });
}