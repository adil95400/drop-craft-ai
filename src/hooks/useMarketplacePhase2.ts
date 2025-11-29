import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { dynamicRepricingService } from '@/services/marketplace/DynamicRepricingService'
import { fulfillmentService } from '@/services/marketplace/FulfillmentService'
import { predictiveAnalyticsService } from '@/services/marketplace/PredictiveAnalyticsService'
import { promotionService } from '@/services/marketplace/PromotionService'

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

  const carriers = useQuery({
    queryKey: ['fulfillment-carriers', userId],
    queryFn: () => fulfillmentService.listCarriers(userId),
  })

  const rules = useQuery({
    queryKey: ['fulfillment-rules', userId],
    queryFn: () => fulfillmentService.listAutomationRules(userId),
  })

  const shipments = useQuery({
    queryKey: ['fulfillment-shipments', userId],
    queryFn: () => fulfillmentService.listShipments(userId),
  })

  const createCarrier = useMutation({
    mutationFn: (carrier: any) => fulfillmentService.createCarrier({ ...carrier, user_id: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-carriers', userId] })
      toast.success('Transporteur créé')
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`)
    },
  })

  const createRule = useMutation({
    mutationFn: (rule: any) => fulfillmentService.createAutomationRule({ ...rule, user_id: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-rules', userId] })
      toast.success('Règle créée')
    },
  })

  const autoFulfill = useMutation({
    mutationFn: async (orderId: string) => {
      return fulfillmentService.autoFulfillOrder(orderId)
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-stats', userId] })
      queryClient.invalidateQueries({ queryKey: ['fulfillment-shipments', userId] })
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
    carriers: carriers.data || [],
    isLoadingCarriers: carriers.isLoading,
    createCarrier: createCarrier.mutate,
    rules: rules.data || [],
    isLoadingRules: rules.isLoading,
    createRule: createRule.mutate,
    shipments: shipments.data || [],
    isLoadingShipments: shipments.isLoading,
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

/**
 * Hook pour les promotions automatisées
 */
export function usePromotionsAutomation(userId: string) {
  const queryClient = useQueryClient()

  const stats = useQuery({
    queryKey: ['promotions-stats', userId],
    queryFn: () => promotionService.getStats(userId),
  })

  const campaigns = useQuery({
    queryKey: ['promotion-campaigns', userId],
    queryFn: () => promotionService.listCampaigns(userId),
  })

  const rules = useQuery({
    queryKey: ['promotion-rules', userId],
    queryFn: () => promotionService.listAutomationRules(userId),
  })

  return {
    stats: stats.data,
    isLoadingStats: stats.isLoading,
    campaigns: campaigns.data || [],
    isLoadingCampaigns: campaigns.isLoading,
    rules: rules.data || [],
    isLoadingRules: rules.isLoading,
  }
}
