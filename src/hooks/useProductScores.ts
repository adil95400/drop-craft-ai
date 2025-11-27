import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export function useProductScores() {
  const queryClient = useQueryClient()

  const calculateScores = useMutation({
    mutationFn: async ({ productIds, userId }: { productIds: string[], userId: string }) => {
      const { data, error } = await supabase.functions.invoke('calculate-product-scores', {
        body: { productIds, userId }
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast.success(`Scores calculés pour ${data.processed} produit(s)`)
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['user-products'] })
    },
    onError: (error) => {
      console.error('Error calculating scores:', error)
      toast.error('Erreur lors du calcul des scores')
    }
  })

  const detectDuplicates = useMutation({
    mutationFn: async ({ userId, threshold = 0.8 }: { userId: string, threshold?: number }) => {
      const { data, error } = await supabase.functions.invoke('detect-duplicates', {
        body: { userId, threshold }
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      if (data.duplicateGroups > 0) {
        toast.info(`${data.totalDuplicates} doublon(s) détecté(s) dans ${data.duplicateGroups} groupe(s)`)
      } else {
        toast.success('Aucun doublon détecté')
      }
    },
    onError: (error) => {
      console.error('Error detecting duplicates:', error)
      toast.error('Erreur lors de la détection des doublons')
    }
  })

  const optimizeProduct = useMutation({
    mutationFn: async ({ 
      productId, 
      userId, 
      optimizations = ['title', 'description', 'price', 'tags'] 
    }: { 
      productId: string
      userId: string
      optimizations?: string[]
    }) => {
      const { data, error } = await supabase.functions.invoke('optimize-product-content', {
        body: { productId, userId, optimizations }
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast.success(`Produit optimisé: ${data.optimizations.join(', ')}`)
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['user-products'] })
    },
    onError: (error) => {
      console.error('Error optimizing product:', error)
      toast.error('Erreur lors de l\'optimisation')
    }
  })

  const recommendPricing = useMutation({
    mutationFn: async ({ 
      productId, 
      userId, 
      strategy = 'balanced' 
    }: { 
      productId: string
      userId: string
      strategy?: 'aggressive' | 'balanced' | 'premium' | 'competitive'
    }) => {
      const { data, error } = await supabase.functions.invoke('recommend-pricing', {
        body: { productId, userId, strategy }
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      const change = parseFloat(data.recommendation.priceChange)
      const changeText = change > 0 ? `+${change}%` : `${change}%`
      toast.info(`Prix recommandé: ${data.recommendation.recommendedPrice}€ (${changeText})`)
    },
    onError: (error) => {
      console.error('Error recommending pricing:', error)
      toast.error('Erreur lors du calcul du prix')
    }
  })

  return {
    calculateScores,
    detectDuplicates,
    optimizeProduct,
    recommendPricing,
    isCalculating: calculateScores.isPending,
    isDetecting: detectDuplicates.isPending,
    isOptimizing: optimizeProduct.isPending,
    isRecommending: recommendPricing.isPending
  }
}
