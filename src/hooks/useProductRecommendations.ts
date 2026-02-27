import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useProductRecommendations() {
  const queryClient = useQueryClient();

  const statsQuery = useQuery({
    queryKey: ['recommendation-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('product-recommendations', {
        body: { action: 'get_stats' }
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('product-recommendations', {
        body: { action: 'generate_recommendations' }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recommendation-stats'] });
      toast.success(`${data.recommendations?.length || 0} recommandations générées à partir de ${data.total_products_analyzed} produits`);
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const trackEvent = async (eventType: string, strategy: string, productId?: string, recommendedProductId?: string, recommendationId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await (supabase.from('recommendation_events' as any) as any).insert({
      user_id: user.id,
      event_type: eventType,
      strategy,
      product_id: productId,
      recommended_product_id: recommendedProductId,
      recommendation_id: recommendationId,
    });
  };

  return {
    stats: statsQuery.data?.stats,
    recommendations: statsQuery.data?.recommendations || [],
    isLoading: statsQuery.isLoading,
    generate: generateMutation.mutate,
    isGenerating: generateMutation.isPending,
    trackEvent,
  };
}
