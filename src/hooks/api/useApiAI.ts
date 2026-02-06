/**
 * useApiAI - Hook pour les opérations IA via FastAPI
 * Enrichissement, SEO, pricing → toutes créent des jobs
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { shopOptiApi } from '@/services/api/ShopOptiApiClient'

export function useApiAI() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const invalidateAfterJob = () => {
    queryClient.invalidateQueries({ queryKey: ['api-jobs'] })
    queryClient.invalidateQueries({ queryKey: ['products-unified'] })
  }

  // Generate content for a single product
  const generateContent = useMutation({
    mutationFn: (params: {
      productId: string
      contentTypes: string[]
      language?: string
      tone?: string
    }) => shopOptiApi.generateContent(
      params.productId,
      params.contentTypes,
      { language: params.language, tone: params.tone }
    ),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: 'Contenu IA généré', description: `Job: ${res.job_id || 'terminé'}` })
        invalidateAfterJob()
      } else {
        toast({ title: 'Erreur IA', description: res.error, variant: 'destructive' })
      }
    },
    onError: () => toast({ title: 'Erreur', description: 'Génération impossible', variant: 'destructive' }),
  })

  // Optimize SEO for multiple products → job
  const optimizeSeo = useMutation({
    mutationFn: (params: {
      productIds: string[]
      targetKeywords?: string[]
      language?: string
    }) => shopOptiApi.optimizeSeo(params.productIds, {
      targetKeywords: params.targetKeywords,
      language: params.language,
    }),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: 'Optimisation SEO lancée', description: `Job: ${res.job_id || res.data?.job_id || 'en cours'}` })
        invalidateAfterJob()
      } else {
        toast({ title: 'Erreur SEO', description: res.error, variant: 'destructive' })
      }
    },
  })

  // Analyze pricing → job
  const analyzePricing = useMutation({
    mutationFn: (params: {
      productIds: string[]
      competitorAnalysis?: boolean
      marketPositioning?: 'budget' | 'competitive' | 'premium'
    }) => shopOptiApi.analyzePricing(params.productIds, {
      competitorAnalysis: params.competitorAnalysis,
      marketPositioning: params.marketPositioning,
    }),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: 'Analyse pricing lancée' })
        invalidateAfterJob()
      }
    },
  })

  // Bulk AI enrichment → job
  const bulkEnrich = useMutation({
    mutationFn: (params: {
      filterCriteria: Record<string, any>
      enrichmentTypes: string[]
      limit?: number
    }) => shopOptiApi.bulkEnrich(
      params.filterCriteria,
      params.enrichmentTypes,
      params.limit
    ),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: 'Enrichissement bulk lancé', description: `Job: ${res.job_id || res.data?.job_id || 'en cours'}` })
        invalidateAfterJob()
      } else {
        toast({ title: 'Erreur enrichissement', description: res.error, variant: 'destructive' })
      }
    },
  })

  // AI usage stats
  const { data: aiUsage } = useQuery({
    queryKey: ['api-ai-usage', user?.id],
    queryFn: async () => {
      const res = await shopOptiApi.getAiUsage()
      return res.success ? res.data : null
    },
    enabled: !!user,
    staleTime: 60_000,
  })

  return {
    generateContent,
    optimizeSeo,
    analyzePricing,
    bulkEnrich,
    aiUsage,
    isGenerating: generateContent.isPending,
    isOptimizingSeo: optimizeSeo.isPending,
    isAnalyzingPricing: analyzePricing.isPending,
    isBulkEnriching: bulkEnrich.isPending,
  }
}
