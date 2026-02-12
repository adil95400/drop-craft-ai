/**
 * useProductSeoScoring — Product-level SEO scoring via API V1
 * Provides audit, scores, history, generation, and apply actions
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { seoApi, type ProductSeoResult, type ProductSeoScoresResponse, type ProductSeoHistoryItem } from '@/services/api/seoApi'
import type { PaginatedResponse } from '@/services/api/client'

export function useProductSeoScores(params?: {
  page?: number
  per_page?: number
  status?: string
  sort?: string
}) {
  return useQuery({
    queryKey: ['product-seo-scores', params],
    queryFn: async () => {
      try {
        return await seoApi.listProductScores(params as any)
      } catch {
        return { items: [], stats: { avg_score: 0, critical: 0, needs_work: 0, optimized: 0, total: 0 }, meta: { page: 1, per_page: 20, total: 0 } } as ProductSeoScoresResponse
      }
    },
    staleTime: 30_000,
  })
}

export function useProductSeoScore(productId?: string) {
  return useQuery({
    queryKey: ['product-seo-score', productId],
    queryFn: () => seoApi.getProductScore(productId!),
    enabled: !!productId,
  })
}

export function useProductSeoHistory(productId?: string) {
  return useQuery({
    queryKey: ['product-seo-history', productId],
    queryFn: () => seoApi.getProductHistory(productId!, { per_page: 20 }),
    enabled: !!productId,
  })
}

export function useAuditProductsSeo() {
  const { toast } = useToast()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (productIds: string[]) =>
      seoApi.auditProducts({ product_ids: productIds }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['product-seo-scores'] })
      toast({ title: 'Audit SEO terminé', description: `${data.total} produit(s) analysé(s)` })
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' })
    },
  })
}

export function useGenerateProductSeo() {
  const { toast } = useToast()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (params: { productId: string; actions?: string[]; tone?: string }) =>
      seoApi.generate({
        target_type: 'product',
        target_id: params.productId,
        actions: params.actions ?? ['title', 'description', 'meta', 'tags'],
        tone: params.tone ?? 'conversion',
        language: 'fr',
      }),
    onSuccess: () => {
      toast({ title: 'Génération SEO lancée', description: 'Le contenu IA est en cours de génération' })
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' })
    },
  })
}

export function useApplyProductSeo() {
  const { toast } = useToast()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (params: { productId: string; fields: Record<string, any>; jobId?: string }) =>
      seoApi.apply({
        target_type: 'product',
        target_id: params.productId,
        fields: params.fields,
        job_id: params.jobId,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product-seo-scores'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast({ title: 'SEO appliqué', description: 'Les optimisations ont été appliquées' })
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' })
    },
  })
}
