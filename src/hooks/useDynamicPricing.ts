import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DynamicPricingService, DynamicPricing } from '@/services/DynamicPricingService';

export function usePricingRecommendations() {
  return useQuery({
    queryKey: ['pricing-recommendations'],
    queryFn: () => DynamicPricingService.getAllPricingRecommendations(),
  });
}

export function usePendingPricingRecommendations() {
  return useQuery({
    queryKey: ['pricing-recommendations', 'pending'],
    queryFn: () => DynamicPricingService.getPendingRecommendations(),
  });
}

export function useOptimizeProductPrice() {
  return useMutation({
    mutationFn: ({ productId, marketData }: { productId: string; marketData?: any }) => 
      DynamicPricingService.optimizeProductPrice(productId, marketData),
  });
}

export function useApprovePricingRecommendation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (recommendationId: string) => 
      DynamicPricingService.approvePricingRecommendation(recommendationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-recommendations'] });
    },
  });
}

export function useRejectPricingRecommendation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (recommendationId: string) => 
      DynamicPricingService.rejectPricingRecommendation(recommendationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-recommendations'] });
    },
  });
}

export function useApplyPricingRecommendation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (recommendationId: string) => 
      DynamicPricingService.applyPricingRecommendation(recommendationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function usePricingPerformanceMetrics() {
  return useQuery({
    queryKey: ['pricing-performance-metrics'],
    queryFn: () => DynamicPricingService.getPerformanceMetrics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBulkOptimizePricing() {
  return useMutation({
    mutationFn: ({ productIds, marketData }: { productIds: string[]; marketData?: any }) => 
      DynamicPricingService.bulkOptimizePricing(productIds, marketData),
  });
}

export function useMarketTrends() {
  return useQuery({
    queryKey: ['market-trends'],
    queryFn: () => DynamicPricingService.getMarketTrends(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}