import { useMutation, useQueryClient } from '@tanstack/react-query';
import { seoService } from '@/services/seo.service';
import { useToast } from '@/hooks/use-toast';

export const useSEOOptimization = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const startOptimizationMutation = useMutation({
    mutationFn: ({ checkType, recommendations }: { checkType: string; recommendations: string[] }) =>
      seoService.runOptimization(checkType, recommendations),
    onSuccess: (data) => {
      toast({
        title: "Optimisations appliquées",
        description: "Les optimisations SEO ont été sauvegardées avec succès",
      });
      // Invalider le cache pour recharger les données
      queryClient.invalidateQueries({ queryKey: ['seo-analyses'] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'appliquer les optimisations",
        variant: "destructive"
      });
    }
  });

  return {
    startOptimization: startOptimizationMutation.mutate,
    isOptimizing: startOptimizationMutation.isPending,
  };
};
