/**
 * Feed Optimization Hooks
 * React Query hooks pour l'optimisation IA des feeds
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Product {
  id: string;
  title: string;
  description: string;
  category?: string;
  price?: number;
  images?: string[];
  brand?: string;
  gtin?: string;
  sku?: string;
}

interface OptimizationResult {
  productId: string;
  originalTitle: string;
  optimizedTitle?: string;
  originalDescription: string;
  optimizedDescription?: string;
  score: number;
  issues: Array<{
    type: string;
    severity: 'high' | 'medium' | 'low';
    message: string;
    suggestion: string;
  }>;
  suggestions: string[];
}

interface Recommendation {
  priority: number;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  affectedProducts: number;
}

interface RecommendationsResponse {
  recommendations: Recommendation[];
  overallScore: number;
  summary: string;
}

// Fetch products from database
export function useOptimizableProducts() {
  return useQuery({
    queryKey: ['optimizable-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, title, description, category, price, images, brand, sku')
        .limit(100);

      if (error) throw error;
      
      // Map to Product interface
      return (data || []).map(p => ({
        id: p.id,
        title: p.title || '',
        description: p.description || '',
        category: p.category,
        price: p.price,
        images: p.images as string[] | undefined,
        brand: p.brand,
        sku: p.sku,
      })) as Product[];
    },
    staleTime: 60 * 1000,
  });
}

// Analyze products for optimization opportunities
export function useAnalyzeProducts() {
  return useMutation({
    mutationFn: async ({ products, feedType }: { products: Product[]; feedType?: string }) => {
      const { data, error } = await supabase.functions.invoke('feed-optimization-ai', {
        body: { action: 'analyze', products, feedType }
      });

      if (error) throw error;
      return data.results as OptimizationResult[];
    },
    onError: (error: Error) => {
      toast.error(`Erreur d'analyse: ${error.message}`);
    },
  });
}

// Optimize products with AI
export function useOptimizeProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ products, feedType }: { products: Product[]; feedType?: string }) => {
      const { data, error } = await supabase.functions.invoke('feed-optimization-ai', {
        body: { action: 'optimize', products, feedType }
      });

      if (error) throw error;
      return data.results as OptimizationResult[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optimizable-products'] });
      toast.success('Optimisation IA terminée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur d'optimisation: ${error.message}`);
    },
  });
}

// Get AI recommendations
export function useFeedRecommendations(products: Product[] | undefined, feedType?: string) {
  return useQuery({
    queryKey: ['feed-recommendations', products?.length, feedType],
    queryFn: async () => {
      if (!products || products.length === 0) {
        return {
          recommendations: [],
          overallScore: 0,
          summary: 'Aucun produit à analyser'
        } as RecommendationsResponse;
      }

      const { data, error } = await supabase.functions.invoke('feed-optimization-ai', {
        body: { action: 'recommendations', products, feedType }
      });

      if (error) throw error;
      return data.recommendations as RecommendationsResponse;
    },
    enabled: !!products && products.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

// Apply optimization to products
export function useApplyOptimization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (optimizations: OptimizationResult[]) => {
      const updates = optimizations
        .filter(opt => opt.optimizedTitle || opt.optimizedDescription)
        .map(opt => ({
          id: opt.productId,
          title: opt.optimizedTitle || undefined,
          description: opt.optimizedDescription || undefined,
        }));

      for (const update of updates) {
        const updateData: Record<string, string> = {};
        if (update.title) updateData.title = update.title;
        if (update.description) updateData.description = update.description;

        const { error } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', update.id);

        if (error) throw error;
      }

      return updates.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['optimizable-products'] });
      queryClient.invalidateQueries({ queryKey: ['feed-recommendations'] });
      toast.success(`${count} produit(s) mis à jour`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}
