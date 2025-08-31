import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { SystemMonitoringService } from '@/services/SystemMonitoringService'

export const useSystemMonitoring = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: healthMetrics, isLoading: isLoadingHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => SystemMonitoringService.getSystemHealth(),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const { data: performanceMetrics, isLoading: isLoadingPerformance } = useQuery({
    queryKey: ['system-performance'],
    queryFn: () => SystemMonitoringService.getPerformanceMetrics(),
    refetchInterval: 60000, // Refresh every minute
  })

  const runHealthCheckMutation = useMutation({
    mutationFn: SystemMonitoringService.runSystemHealthCheck,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-health'] })
      toast({
        title: "Vérification système terminée",
        description: "Le contrôle de santé du système a été effectué",
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer le contrôle de santé",
        variant: "destructive"
      })
    }
  })

  const optimizePerformanceMutation = useMutation({
    mutationFn: SystemMonitoringService.optimizeSystemPerformance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-performance'] })
      toast({
        title: "Optimisation lancée",
        description: "L'optimisation des performances a été démarrée",
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'optimiser les performances",
        variant: "destructive"
      })
    }
  })

  return {
    healthMetrics,
    performanceMetrics,
    isLoading: isLoadingHealth || isLoadingPerformance,
    runHealthCheck: runHealthCheckMutation.mutate,
    optimizePerformance: optimizePerformanceMutation.mutate,
    isRunningHealthCheck: runHealthCheckMutation.isPending,
    isOptimizingPerformance: optimizePerformanceMutation.isPending,
  }
}