import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { shopOptiApi } from '@/services/api/ShopOptiApiClient'

export const useAdvancedAnalyticsService = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: performanceMetrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['performance-metrics'],
    queryFn: async () => {
      const res = await shopOptiApi.request('/analytics/performance-metrics');
      if (!res.success) return [];
      return res.data || [];
    },
  })

  const { data: reports, isLoading: isLoadingReports } = useQuery({
    queryKey: ['advanced-reports'],
    queryFn: async () => {
      const res = await shopOptiApi.request('/reports');
      if (!res.success) return [];
      return res.data || [];
    },
  })

  const { data: predictiveAnalytics, isLoading: isLoadingPredictive } = useQuery({
    queryKey: ['predictive-analytics'],
    queryFn: async () => {
      const res = await shopOptiApi.getPredictiveInsights();
      if (!res.success) return [];
      return res.data || [];
    },
  })

  const { data: abTests, isLoading: isLoadingABTests } = useQuery({
    queryKey: ['ab-tests'],
    queryFn: async () => {
      const res = await shopOptiApi.request('/analytics/ab-tests');
      if (!res.success) return [];
      return res.data || [];
    },
  })

  const generateReportMutation = useMutation({
    mutationFn: async (config: { reportType: string; config: any }) => {
      const res = await shopOptiApi.generateReport(config.reportType, '30d', config.config);
      if (!res.success) throw new Error(res.error || 'Failed to generate report');
      return res.data;
    },
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
    mutationFn: async (testConfig: {
      experimentName: string;
      experimentType: string;
      hypothesis: string;
      controlVariant: any;
      testVariants: any[];
      successMetrics: any[];
      trafficAllocation: any;
    }) => {
      const res = await shopOptiApi.request('/analytics/ab-tests', {
        method: 'POST',
        body: testConfig,
      });
      if (!res.success) throw new Error(res.error || 'Failed to create AB test');
      return res.data;
    },
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
    mutationFn: async () => {
      const res = await shopOptiApi.request('/analytics/predictive/run', { method: 'POST' });
      if (!res.success) throw new Error(res.error || 'Failed to run predictive analysis');
      return res.data;
    },
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
