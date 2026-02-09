/**
 * useSEOOptimization — Apply SEO fixes via API V1
 * Zero direct Edge Function / DB calls
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { seoApi } from '@/services/api/seoApi';

export const useSEOOptimization = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const startOptimizationMutation = useMutation({
    mutationFn: async ({ targetId, fields }: { targetId: string; fields: Record<string, any>; jobId?: string }) => {
      return await seoApi.apply({
        target_type: 'product',
        target_id: targetId,
        fields,
      });
    },
    onSuccess: () => {
      toast({
        title: "Optimisations appliquées",
        description: "Les optimisations SEO ont été sauvegardées avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['seo-analyses'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: Error) => {
      toast({
        title: "Erreur",
        description: err.message || "Impossible d'appliquer les optimisations",
        variant: "destructive"
      });
    }
  });

  return {
    startOptimization: (params: { targetId: string; fields: Record<string, any>; jobId?: string }) => 
      startOptimizationMutation.mutate(params),
    isOptimizing: startOptimizationMutation.isPending,
  };
};
