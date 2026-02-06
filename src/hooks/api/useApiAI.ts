/**
 * useApiAI - Hook pour les opérations IA via Edge Functions
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'

export function useApiAI() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const invalidateAfterJob = () => {
    queryClient.invalidateQueries({ queryKey: ['api-jobs'] })
    queryClient.invalidateQueries({ queryKey: ['products-unified'] })
  }

  const generateContent = useMutation({
    mutationFn: async (params: {
      productId: string
      contentTypes: string[]
      language?: string
      tone?: string
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-content-generator', {
        body: {
          product_id: params.productId,
          content_types: params.contentTypes,
          language: params.language || 'fr',
          tone: params.tone || 'professional',
        },
      })
      if (error) throw error
      return { success: true, data }
    },
    onSuccess: () => {
      toast({ title: 'Contenu IA généré' })
      invalidateAfterJob()
    },
    onError: () => toast({ title: 'Erreur', description: 'Génération impossible', variant: 'destructive' }),
  })

  const optimizeSeo = useMutation({
    mutationFn: async (params: {
      productIds: string[]
      targetKeywords?: string[]
      language?: string
    }) => {
      const { data, error } = await supabase.functions.invoke('seo-optimizer', {
        body: {
          product_ids: params.productIds,
          target_keywords: params.targetKeywords,
          language: params.language || 'fr',
        },
      })
      if (error) throw error
      return { success: true, data }
    },
    onSuccess: () => {
      toast({ title: 'Optimisation SEO lancée' })
      invalidateAfterJob()
    },
  })

  const analyzePricing = useMutation({
    mutationFn: async (params: {
      productIds: string[]
      competitorAnalysis?: boolean
      marketPositioning?: 'budget' | 'competitive' | 'premium'
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-pricing-optimizer', {
        body: {
          product_ids: params.productIds,
          competitor_analysis: params.competitorAnalysis ?? true,
          market_positioning: params.marketPositioning || 'competitive',
        },
      })
      if (error) throw error
      return { success: true, data }
    },
    onSuccess: () => {
      toast({ title: 'Analyse pricing lancée' })
      invalidateAfterJob()
    },
  })

  const bulkEnrich = useMutation({
    mutationFn: async (params: {
      filterCriteria: Record<string, any>
      enrichmentTypes: string[]
      limit?: number
    }) => {
      const { data, error } = await supabase.functions.invoke('bulk-ai-optimizer', {
        body: {
          filter_criteria: params.filterCriteria,
          enrichment_types: params.enrichmentTypes,
          limit: params.limit,
        },
      })
      if (error) throw error
      return { success: true, data }
    },
    onSuccess: () => {
      toast({ title: 'Enrichissement bulk lancé' })
      invalidateAfterJob()
    },
  })

  return {
    generateContent,
    optimizeSeo,
    analyzePricing,
    bulkEnrich,
    aiUsage: null,
    isGenerating: generateContent.isPending,
    isOptimizingSeo: optimizeSeo.isPending,
    isAnalyzingPricing: analyzePricing.isPending,
    isBulkEnriching: bulkEnrich.isPending,
  }
}
