import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { AdvancedAnalyticsService } from '@/services/AdvancedAnalyticsService'

export const useAdvancedAnalyticsService = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: performanceMetrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['performance-metrics'],
    queryFn: () => AdvancedAnalyticsService.getPerformanceMetrics(),
  })

  const { data: reports, isLoading: isLoadingReports } = useQuery({
    queryKey: ['advanced-reports'],
    queryFn: () => AdvancedAnalyticsService.getAdvancedReports(),
  })

  const { data: predictiveAnalytics, isLoading: isLoadingPredictive } = useQuery({
    queryKey: ['predictive-analytics'],
    queryFn: () => AdvancedAnalyticsService.getPredictiveAnalytics(),
  })

  const { data: abTests, isLoading: isLoadingABTests } = useQuery({
    queryKey: ['ab-tests'],
    queryFn: () => AdvancedAnalyticsService.getABTests(),
  })

  const generateReportMutation = useMutation({
    mutationFn: AdvancedAnalyticsService.generateAdvancedReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-reports'] })
      toast({
        title: "Rapport généré",
        description: "Le rapport avancé a été généré avec succès",
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de générer le rapport",
        variant: "destructive"
      })
    }
  })

  const createABTestMutation = useMutation({
    mutationFn: AdvancedAnalyticsService.createABTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab-tests'] })
      toast({
        title: "Test A/B créé",
        description: "Le test A/B a été créé avec succès",
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le test A/B",
        variant: "destructive"
      })
    }
  })

  const runPredictiveAnalysisMutation = useMutation({
    mutationFn: AdvancedAnalyticsService.runPredictiveAnalysis,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictive-analytics'] })
      toast({
        title: "Analyse prédictive lancée",
        description: "L'analyse prédictive a été démarrée",
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de lancer l'analyse prédictive",
        variant: "destructive"
      })
    }
  })

  return {
    performanceMetrics,
    reports,
    predictiveAnalytics,
    abTests,
    isLoading: isLoadingMetrics || isLoadingReports || isLoadingPredictive || isLoadingABTests,
    generateReport: generateReportMutation.mutate,
    createABTest: createABTestMutation.mutate,
    runPredictiveAnalysis: runPredictiveAnalysisMutation.mutate,
    isGeneratingReport: generateReportMutation.isPending,
    isCreatingABTest: createABTestMutation.isPending,
    isRunningPredictive: runPredictiveAnalysisMutation.isPending,
  }
}