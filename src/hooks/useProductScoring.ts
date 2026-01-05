/**
 * Product Scoring Hooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ProductScoringService } from '@/services/ProductScoringService';

export function useProductScores(minScore?: number, maxScore?: number) {
  return useQuery({
    queryKey: ['product-scores', minScore, maxScore],
    queryFn: () => ProductScoringService.getScores(minScore, maxScore),
    staleTime: 60 * 1000,
  });
}

export function useProductScore(productId: string) {
  return useQuery({
    queryKey: ['product-score', productId],
    queryFn: () => ProductScoringService.getProductScore(productId),
    enabled: !!productId,
  });
}

export function useAnalyzeProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => ProductScoringService.analyzeProduct(productId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-scores'] });
      queryClient.invalidateQueries({ queryKey: ['product-score', data.product_id] });
      queryClient.invalidateQueries({ queryKey: ['scoring-stats'] });
      toast.success(`Score: ${data.overall_score.toFixed(0)}/100`);
    },
    onError: (error: Error) => toast.error(`Erreur: ${error.message}`),
  });
}

export function useRunBatchAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => ProductScoringService.runBatchAnalysis(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-scores'] });
      queryClient.invalidateQueries({ queryKey: ['scoring-batches'] });
      queryClient.invalidateQueries({ queryKey: ['scoring-stats'] });
      toast.success(`${data.products_analyzed} produits analysés - Score moyen: ${data.avg_score.toFixed(0)}`);
    },
    onError: (error: Error) => toast.error(`Erreur: ${error.message}`),
  });
}

export function useScoringRules(category?: string) {
  return useQuery({
    queryKey: ['scoring-rules', category],
    queryFn: () => ProductScoringService.getRules(category),
    staleTime: 5 * 60 * 1000,
  });
}

export function useScoringBatches(limit?: number) {
  return useQuery({
    queryKey: ['scoring-batches', limit],
    queryFn: () => ProductScoringService.getBatches(limit),
    staleTime: 30 * 1000,
  });
}

export function useScoringStats() {
  return useQuery({
    queryKey: ['scoring-stats'],
    queryFn: () => ProductScoringService.getStats(),
    staleTime: 60 * 1000,
  });
}

export function useCategoryOptions() {
  return ProductScoringService.getCategoryOptions();
}
