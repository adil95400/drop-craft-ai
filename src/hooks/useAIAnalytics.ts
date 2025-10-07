import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AIAnalyticsEngine, AnalyticsInsight, PredictiveAnalysis, PerformanceOptimization } from "@/services/analytics/AIAnalyticsEngine";

const aiEngine = new AIAnalyticsEngine();

export function useAIAnalytics() {
  const queryClient = useQueryClient();

  // Optimized queries avec cache agressif
  const insightsQuery = useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => aiEngine.generateInsights("current-user"),
    staleTime: 10 * 60 * 1000,          // 10 minutes
    gcTime: 30 * 60 * 1000,             // 30 minutes
    refetchOnWindowFocus: false,
  });

  const predictionsQuery = useQuery({
    queryKey: ['ai-predictions'],
    queryFn: () => aiEngine.predictDemand("current-user"),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const optimizationsQuery = useQuery({
    queryKey: ['ai-optimizations'],
    queryFn: () => aiEngine.getPerformanceOptimizations("current-user"),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Memoize refresh function
  const refreshAnalytics = useMutation({
    mutationFn: useCallback(async () => {
      const [insights, predictions, optimizations] = await Promise.all([
        aiEngine.generateInsights("current-user"),
        aiEngine.predictDemand("current-user"),
        aiEngine.getPerformanceOptimizations("current-user")
      ]);
      return { insights, predictions, optimizations };
    }, []),
    onSuccess: useCallback((data) => {
      queryClient.setQueryData(['ai-insights'], data.insights);
      queryClient.setQueryData(['ai-predictions'], data.predictions);
      queryClient.setQueryData(['ai-optimizations'], data.optimizations);
      toast.success("Analytics refreshed successfully");
    }, [queryClient]),
    onError: useCallback(() => {
      toast.error("Failed to refresh analytics");
    }, [])
  });

  // Memoize return object pour éviter re-rendus
  return useMemo(() => ({
    insights: insightsQuery.data || [],
    predictions: predictionsQuery.data || [],
    optimizations: optimizationsQuery.data || [],
    isLoading: insightsQuery.isLoading || predictionsQuery.isLoading || optimizationsQuery.isLoading,
    error: insightsQuery.error || predictionsQuery.error || optimizationsQuery.error,
    refreshAnalytics: refreshAnalytics.mutate,
    isRefreshing: refreshAnalytics.isPending
  }), [
    insightsQuery.data,
    insightsQuery.isLoading,
    insightsQuery.error,
    predictionsQuery.data,
    predictionsQuery.isLoading,
    predictionsQuery.error,
    optimizationsQuery.data,
    optimizationsQuery.isLoading,
    optimizationsQuery.error,
    refreshAnalytics.mutate,
    refreshAnalytics.isPending
  ]);
}