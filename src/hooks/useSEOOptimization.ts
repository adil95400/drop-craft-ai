import { useMutation } from '@tanstack/react-query';
import { seoService } from '@/services/seo.service';
import { useToast } from '@/hooks/use-toast';

export const useSEOOptimization = () => {
  const { toast } = useToast();

  const startOptimizationMutation = useMutation({
    mutationFn: ({ checkType, recommendations }: { checkType: string; recommendations: string[] }) =>
      seoService.runOptimization(checkType, recommendations),
    onSuccess: (data) => {
      toast({
        title: "Optimisation terminée",
        description: `Score d'amélioration: +${data.improvementScore} points`,
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de démarrer l'optimisation",
        variant: "destructive"
      });
    }
  });

  return {
    startOptimization: startOptimizationMutation.mutate,
    isOptimizing: startOptimizationMutation.isPending,
  };
};
