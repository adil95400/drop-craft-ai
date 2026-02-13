/**
 * useAdvancedAI — Hook for Advanced AI business intelligence via API V1
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import {
  advancedAIApi,
  type AIPricingSuggestion,
  type AITrendingProduct,
  type AIPerformanceReport,
  type AIBusinessSummary,
} from '@/services/api/client'
import { toast } from 'sonner'

export function useBusinessSummary() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['ai-business-summary', user?.id],
    queryFn: () => advancedAIApi.businessSummary(),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useTrendingProducts(limit = 10) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['ai-trending-products', user?.id, limit],
    queryFn: () => advancedAIApi.trendingProducts(limit),
    enabled: !!user?.id,
    staleTime: 3 * 60 * 1000,
  })
}

export function usePricingSuggestions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { product_ids?: string[]; strategy?: string }) =>
      advancedAIApi.pricingSuggestions(params),
    onSuccess: () => {
      toast.success('Suggestions de prix générées par l\'IA')
      queryClient.invalidateQueries({ queryKey: ['ai-pricing-suggestions'] })
    },
    onError: (err: Error) => {
      if (err.message.includes('429') || err.message.includes('Too many')) {
        toast.error('Limite de requêtes atteinte, réessayez dans quelques instants')
      } else if (err.message.includes('402') || err.message.includes('Credits')) {
        toast.error('Crédits IA épuisés, veuillez recharger')
      } else {
        toast.error(`Erreur IA: ${err.message}`)
      }
    },
  })
}

export function usePerformanceAnalysis() {
  return useMutation({
    mutationFn: (params: { time_range?: string; focus?: string }) =>
      advancedAIApi.performanceAnalysis(params),
    onSuccess: () => toast.success('Analyse de performance IA terminée'),
    onError: (err: Error) => toast.error(`Erreur: ${err.message}`),
  })
}

export type { AIPricingSuggestion, AITrendingProduct, AIPerformanceReport, AIBusinessSummary }
