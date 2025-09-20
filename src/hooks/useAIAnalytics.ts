import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AIAnalyticsEngine, AnalyticsInsight, PredictiveAnalysis, PerformanceOptimization } from "@/services/analytics/AIAnalyticsEngine";

const aiEngine = new AIAnalyticsEngine();

export function useAIAnalytics() {
  const queryClient = useQueryClient();

  const insightsQuery = useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => aiEngine.generateInsights("current-user"),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const predictionsQuery = useQuery({
    queryKey: ['ai-predictions'],
    queryFn: () => aiEngine.predictDemand("current-user"),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const optimizationsQuery = useQuery({
    queryKey: ['ai-optimizations'],
    queryFn: () => aiEngine.getPerformanceOptimizations("current-user"),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  const refreshAnalytics = useMutation({
    mutationFn: async () => {
      const [insights, predictions, optimizations] = await Promise.all([
        aiEngine.generateInsights("current-user"),
        aiEngine.predictDemand("current-user"),
        aiEngine.getPerformanceOptimizations("current-user")
      ]);
      return { insights, predictions, optimizations };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['ai-insights'], data.insights);
      queryClient.setQueryData(['ai-predictions'], data.predictions);
      queryClient.setQueryData(['ai-optimizations'], data.optimizations);
      toast.success("Analytics refreshed successfully");
    },
    onError: () => {
      toast.error("Failed to refresh analytics");
    }
  });

  return {
    insights: insightsQuery.data || [],
    predictions: predictionsQuery.data || [],
    optimizations: optimizationsQuery.data || [],
    isLoading: insightsQuery.isLoading || predictionsQuery.isLoading || optimizationsQuery.isLoading,
    error: insightsQuery.error || predictionsQuery.error || optimizationsQuery.error,
    refreshAnalytics: refreshAnalytics.mutate,
    isRefreshing: refreshAnalytics.isPending
  };
}