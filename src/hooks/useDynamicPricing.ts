import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DynamicPricingService, DynamicPricing } from '@/services/DynamicPricingService';
import { toast } from 'sonner';

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
    onSuccess: () => {
      toast.success('Prix optimisé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur d'optimisation: ${error.message}`);
    },
  });
}

export function useApprovePricingRecommendation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (recommendationId: string) => 
      DynamicPricingService.approvePricingRecommendation(recommendationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-recommendations'] });
      toast.success('Recommandation approuvée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
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
      toast.success('Recommandation rejetée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
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
      toast.success('Prix appliqué avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur d'application: ${error.message}`);
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
    onSuccess: (data) => {
      toast.success(`${data?.length || 0} prix optimisés`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur d'optimisation en masse: ${error.message}`);
    },
  });
}

export function useMarketTrends() {
  return useQuery({
    queryKey: ['market-trends'],
    queryFn: () => DynamicPricingService.getMarketTrends(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}