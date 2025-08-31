import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { customerBehaviorAnalytics, BehaviorAnalysisRequest, CustomerBehaviorData } from '@/services/CustomerBehaviorAnalytics';

export function useCustomerBehavior() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch behavior analyses
  const {
    data: analyses = [],
    isLoading: isLoadingAnalyses,
    error: analysesError
  } = useQuery({
    queryKey: ['customer-behavior', 'analyses'],
    queryFn: () => customerBehaviorAnalytics.getBehaviorHistory(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Generate new behavior analysis
  const analyzeBehaviorMutation = useMutation({
    mutationFn: (params: BehaviorAnalysisRequest) => customerBehaviorAnalytics.analyzeBehavior(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-behavior'] });
      toast({
        title: "Analyse comportementale générée",
        description: "L'analyse du comportement client a été générée avec succès.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de générer l'analyse comportementale.",
        variant: "destructive",
      });
    },
  });

  // Delete analysis
  const deleteAnalysisMutation = useMutation({
    mutationFn: (id: string) => customerBehaviorAnalytics.deleteBehaviorAnalysis(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-behavior'] });
      toast({
        title: "Analyse supprimée",
        description: "L'analyse comportementale a été supprimée avec succès.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'analyse.",
        variant: "destructive",
      });
    },
  });

  // Fetch single analysis
  const getBehaviorAnalysis = (id: string) => {
    return useQuery({
      queryKey: ['customer-behavior', 'analysis', id],
      queryFn: () => customerBehaviorAnalytics.getBehaviorById(id),
      enabled: !!id,
    });
  };

  // Calculate statistics
  const stats = {
    totalAnalyses: analyses.length,
    avgBehavioralScore: analyses.length > 0 
      ? Math.round(analyses.reduce((sum, a) => sum + a.behavioral_score, 0) / analyses.length)
      : 0,
    avgLifetimeValue: analyses.length > 0 
      ? analyses.filter(a => a.lifetime_value).reduce((sum, a) => sum + (a.lifetime_value || 0), 0) / analyses.filter(a => a.lifetime_value).length
      : 0,
    highRiskCustomers: analyses.filter(a => (a.churn_probability || 0) >= 75).length,
    avgChurnProbability: analyses.length > 0 
      ? Math.round(analyses.reduce((sum, a) => sum + (a.churn_probability || 0), 0) / analyses.length)
      : 0,
  };

  return {
    // Data
    analyses,
    stats,
    
    // States
    isLoadingAnalyses,
    isAnalyzing: analyzeBehaviorMutation.isPending,
    isDeleting: deleteAnalysisMutation.isPending,
    
    // Actions
    analyzeBehavior: analyzeBehaviorMutation.mutate,
    deleteAnalysis: deleteAnalysisMutation.mutate,
    getBehaviorAnalysis,
    
    // Errors
    analysesError,
    
    // Utils
    getSegmentColor: customerBehaviorAnalytics.getSegmentColor,
    getChurnRiskLevel: customerBehaviorAnalytics.getChurnRiskLevel,
    formatLifetimeValue: customerBehaviorAnalytics.formatLifetimeValue,
    getBehaviorIcon: customerBehaviorAnalytics.getBehaviorIcon,
  };
}