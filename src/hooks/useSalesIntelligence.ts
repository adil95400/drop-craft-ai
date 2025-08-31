import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { salesIntelligenceService, ForecastRequest, SalesIntelligenceData } from '@/services/SalesIntelligenceService';

export function useSalesIntelligence() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch forecast history
  const {
    data: forecasts = [],
    isLoading: isLoadingForecasts,
    error: forecastsError
  } = useQuery({
    queryKey: ['sales-intelligence', 'forecasts'],
    queryFn: () => salesIntelligenceService.getForecastHistory(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Generate new forecast
  const generateForecastMutation = useMutation({
    mutationFn: (params: ForecastRequest) => salesIntelligenceService.generateForecast(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-intelligence'] });
      toast({
        title: "Prédiction générée",
        description: "L'analyse prédictive des ventes a été générée avec succès.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de générer la prédiction des ventes.",
        variant: "destructive",
      });
    },
  });

  // Delete forecast
  const deleteForecastMutation = useMutation({
    mutationFn: (id: string) => salesIntelligenceService.deleteForecast(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-intelligence'] });
      toast({
        title: "Prédiction supprimée",
        description: "L'analyse a été supprimée avec succès.",
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

  // Fetch single forecast
  const getForecast = (id: string) => {
    return useQuery({
      queryKey: ['sales-intelligence', 'forecast', id],
      queryFn: () => salesIntelligenceService.getForecastById(id),
      enabled: !!id,
    });
  };

  // Calculate statistics
  const stats = {
    totalForecasts: forecasts.length,
    avgConfidenceScore: forecasts.length > 0 
      ? Math.round(forecasts.reduce((sum, f) => sum + f.confidence_score, 0) / forecasts.length)
      : 0,
    highConfidenceForecasts: forecasts.filter(f => f.confidence_score >= 80).length,
    recentForecasts: forecasts.filter(f => {
      const forecastDate = new Date(f.created_at);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return forecastDate >= sevenDaysAgo;
    }).length,
  };

  return {
    // Data
    forecasts,
    stats,
    
    // States
    isLoadingForecasts,
    isGenerating: generateForecastMutation.isPending,
    isDeleting: deleteForecastMutation.isPending,
    
    // Actions
    generateForecast: generateForecastMutation.mutate,
    deleteForecast: deleteForecastMutation.mutate,
    getForecast,
    
    // Errors
    forecastsError,
    
    // Utils
    formatCurrency: salesIntelligenceService.formatCurrency,
    getPriorityColor: salesIntelligenceService.getPriorityColor,
    getConfidenceLevel: salesIntelligenceService.getConfidenceLevel,
    calculateGrowthRate: salesIntelligenceService.calculateGrowthRate,
  };
}