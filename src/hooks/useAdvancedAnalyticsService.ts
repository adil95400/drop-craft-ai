import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export const useAdvancedAnalyticsService = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const { data: performanceMetrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['performance-metrics', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('analytics_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('metric_type', 'performance')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!user?.id,
  })

  const { data: reports, isLoading: isLoadingReports } = useQuery({
    queryKey: ['advanced-reports', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('advanced_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!user?.id,
  })

  const { data: predictiveAnalytics, isLoading: isLoadingPredictive } = useQuery({
    queryKey: ['predictive-analytics', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('analytics_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('prediction_type', 'predictive')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!user?.id,
  })

  const { data: abTests, isLoading: isLoadingABTests } = useQuery({
    queryKey: ['ab-tests', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('ab_test_experiments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!user?.id,
  })

  const generateReportMutation = useMutation({
    mutationFn: async (config: { reportType: string; config: any }) => {
      if (!user?.id) throw new Error('Non authentifié')
      const { data, error } = await supabase
        .from('advanced_reports')
        .insert({
          user_id: user.id,
          report_name: `Rapport ${config.reportType}`,
          report_type: config.reportType,
          filters: config.config,
          status: 'generated',
          last_generated_at: new Date().toISOString(),
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-reports'] })
      toast({ title: 'Rapport généré', description: 'Le rapport a été généré avec succès' })
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de générer le rapport', variant: 'destructive' })
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
      if (!user?.id) throw new Error('Non authentifié')
      const { data, error } = await supabase
        .from('ab_test_experiments')
        .insert({
          user_id: user.id,
          name: testConfig.experimentName,
          description: testConfig.hypothesis,
          status: 'draft',
          variants: { control: testConfig.controlVariant, test: testConfig.testVariants },
          metrics: { success: testConfig.successMetrics, traffic: testConfig.trafficAllocation },
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab-tests'] })
      toast({ title: 'Test A/B créé', description: 'Le test A/B a été créé avec succès' })
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de créer le test A/B', variant: 'destructive' })
    }
  })

  const runPredictiveAnalysisMutation = useMutation({
    mutationFn: async () => {
      toast({ title: 'Info', description: 'Analyse prédictive disponible prochainement via IA' })
      return null
    },
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
