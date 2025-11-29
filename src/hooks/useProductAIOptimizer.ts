import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

/**
 * Hook pour optimiser les produits avec l'IA OpenAI
 * 
 * @example
 * const { optimizeProduct, isOptimizing } = useProductAIOptimizer();
 * 
 * // Optimiser le titre
 * await optimizeProduct({
 *   productId: 'xxx',
 *   productSource: 'products',
 *   optimizationType: 'title',
 *   tone: 'professional',
 *   currentData: { name: 'Old title', category: 'Electronics', price: 99.99 }
 * });
 */
export function useProductAIOptimizer() {
  const queryClient = useQueryClient();

  const optimizeProductMutation = useMutation({
    mutationFn: async (request: AIOptimizationRequest): Promise<AIOptimizationResult> => {
      console.log('[AI Optimizer] Starting optimization:', request.optimizationType);
      
      const { data, error } = await supabase.functions.invoke('ai-product-optimizer', {
        body: request
      });

      if (error) {
        console.error('[AI Optimizer] Error:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Optimization failed');
      }

      console.log('[AI Optimizer] Success:', data);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`✨ ${data.optimizationType} optimisé avec succès !`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-optimization-history'] });
    },
    onError: (error: any) => {
      console.error('[AI Optimizer] Mutation error:', error);
      toast.error(`Erreur: ${error.message || 'Échec de l\'optimisation'}`);
    }
  });

  return {
    optimizeProduct: optimizeProductMutation.mutateAsync,
    optimizeProductSync: optimizeProductMutation.mutate,
    isOptimizing: optimizeProductMutation.isPending,
    optimizationResult: optimizeProductMutation.data,
    optimizationError: optimizeProductMutation.error
  };
}
