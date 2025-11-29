import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { dynamicRepricingService } from '@/services/marketplace/DynamicRepricingService'
import { fulfillmentService } from '@/services/marketplace/FulfillmentService'
import { predictiveAnalyticsService } from '@/services/marketplace/PredictiveAnalyticsService'

/**
 * Hook pour le repricing dynamique
 */
export function useDynamicRepricing(userId: string) {
  const queryClient = useQueryClient()

  const dashboard = useQuery({
    queryKey: ['repricing-dashboard', userId],
    queryFn: () => dynamicRepricingService.getDashboard(userId),
  })

  const executeRepricing = useMutation({
    mutationFn: async (ruleId: string) => {
      return dynamicRepricingService.executeRepricingRule(ruleId)
    },
    onSuccess: (executions) => {
      queryClient.invalidateQueries({ queryKey: ['repricing-dashboard', userId] })
      toast.success(`${executions.length} produits repricés`)
    },
    onError: (error) => {
      toast.error(`Erreur repricing: ${error.message}`)
    },
  })

  return {
    dashboard: dashboard.data,
    isLoadingDashboard: dashboard.isLoading,
    executeRepricing: executeRepricing.mutate,
    isRepricingExecuting: executeRepricing.isPending,
  }
}

/**
 * Hook pour le fulfillment automatisé
 */
export function useAutoFulfillment(userId: string) {
  const queryClient = useQueryClient()

  const stats = useQuery({
    queryKey: ['fulfillment-stats', userId],
    queryFn: () => fulfillmentService.getStats(userId),
  })

  const autoFulfill = useMutation({
    mutationFn: async (orderId: string) => {
      return fulfillmentService.autoFulfillOrder(orderId)
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-stats', userId] })
      if (result.success) {
        toast.success(`Expédition créée - Tracking: ${result.trackingNumber}`)
      } else {
        toast.error(`Erreur: ${result.error}`)
      }
    },
    onError: (error) => {
      toast.error(`Erreur fulfillment: ${error.message}`)
    },
  })

  return {
    stats: stats.data,
    isLoadingStats: stats.isLoading,
    autoFulfill: autoFulfill.mutate,
    isAutoFulfilling: autoFulfill.isPending,
  }
}

/**
 * Hook pour l'analyse prédictive
 */
export function usePredictiveAnalytics(userId: string) {
  const dashboard = useQuery({
    queryKey: ['predictive-dashboard', userId],
    queryFn: () => predictiveAnalyticsService.getPredictiveDashboard(userId),
  })

  const generateForecast = useMutation({
    mutationFn: async ({ productId, horizonDays }: { productId: string; horizonDays: number }) => {
      return predictiveAnalyticsService.generateSalesForecast(productId, horizonDays)
    },
    onSuccess: () => {
      toast.success('Prévisions générées')
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`)
    },
  })

  return {
    dashboard: dashboard.data,
    isLoadingDashboard: dashboard.isLoading,
    generateForecast: generateForecast.mutate,
    isGenerating: generateForecast.isPending,
  }
}
