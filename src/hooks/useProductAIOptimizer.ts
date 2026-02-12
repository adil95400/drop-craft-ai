import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/services/api/client';
import { toast } from 'sonner';

export interface AIOptimizationRequest {
  productId: string;
  productSource: 'products' | 'imported_products' | 'supplier_products';
  optimizationType: 'title' | 'description' | 'attributes' | 'seo_meta' | 'full';
  tone?: 'professional' | 'casual' | 'luxury' | 'technical';
  currentData: {
    name?: string;
    description?: string;
    category?: string;
    price?: number;
    [key: string]: any;
  };
}

export interface AIOptimizationResult {
  success: boolean;
  productId: string;
  optimizationType: string;
  result: {
    optimized_title?: string;
    optimized_description?: string;
    material?: string;
    color?: string;
    style?: string;
    brand?: string;
    meta_title?: string;
    meta_description?: string;
    keywords?: string[];
    [key: string]: any;
  };
  message: string;
}

export function useProductAIOptimizer() {
  const queryClient = useQueryClient();

  const optimizeProductMutation = useMutation({
    mutationFn: async (request: AIOptimizationRequest): Promise<AIOptimizationResult> => {
      console.log('[AI Optimizer] Starting optimization:', request.optimizationType);

      const resp = await productsApi.optimize(request.productId, {
        language: 'fr',
        tone: request.tone,
        targets: [request.optimizationType],
      });

      return {
        success: true,
        productId: resp.product_id,
        optimizationType: request.optimizationType,
        result: {},
        message: `Job ${resp.job_id} created`,
      };
    },
    onSuccess: (data) => {
      toast.success(`✨ ${data.optimizationType} optimisé avec succès !`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-optimization-history'] });
    },
    onError: (error: any) => {
      console.error('[AI Optimizer] Mutation error:', error);
      toast.error(`Erreur: ${error.message || "Échec de l'optimisation"}`);
    },
  });

  return {
    optimizeProduct: optimizeProductMutation.mutateAsync,
    optimizeProductSync: optimizeProductMutation.mutate,
    isOptimizing: optimizeProductMutation.isPending,
    optimizationResult: optimizeProductMutation.data,
    optimizationError: optimizeProductMutation.error,
  };
}
