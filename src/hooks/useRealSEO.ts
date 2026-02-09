/**
 * useRealSEO — SEO hook backed by API V1 exclusively
 * Zero direct DB access. All operations go through /v1/seo/*
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { seoApi, type SeoAuditSummary, type SeoGenerationResult } from '@/services/api/seoApi'

export type SEOAnalysis = SeoAuditSummary & {
  overall_score: number
  domain: string
  analyzed_at: string
  user_id: string
  created_at: string
  updated_at: string
}

export type SEOKeyword = {
  id: string
  keyword: string
  search_volume?: number
  difficulty_score?: number
  cpc?: number
  current_position?: number
  target_url?: string
  competition?: string
  tracking_active: boolean
  related_keywords?: string[]
  trends?: any
  user_id: string
  created_at: string
  updated_at: string
}

export const useRealSEO = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // ── Audits (via API V1) ────────────────────────────────────────
  const { data: analyses = [], isLoading: isLoadingAnalyses } = useQuery({
    queryKey: ['seo-analyses'],
    queryFn: async () => {
      try {
        const resp = await seoApi.listAudits({ per_page: 50 })
        return resp.items.map(a => ({
          ...a,
          overall_score: a.score ?? 0,
          domain: a.url ? new URL(a.url).hostname : '',
          analyzed_at: a.completed_at ?? a.created_at,
          user_id: '',
          updated_at: a.completed_at ?? a.created_at,
        })) as SEOAnalysis[]
      } catch {
        return []
      }
    },
  })

  // ── Keywords (kept lightweight — no V1 route yet, returns empty) ─
  const { data: keywords = [], isLoading: isLoadingKeywords } = useQuery({
    queryKey: ['seo-keywords'],
    queryFn: async () => [] as SEOKeyword[],
    staleTime: 60_000,
  })

  // ── Analyze URL (POST /v1/seo/audit) ─────────────────────────
  const analyzeUrl = useMutation({
    mutationFn: async (url: string) => {
      const resp = await seoApi.audit({ url, scope: 'url', language: 'fr' })
      return resp
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-analyses'] })
      toast({ title: "Audit SEO lancé", description: "L'analyse est en cours, les résultats apparaîtront bientôt" })
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" })
    },
  })

  // ── Generate SEO content (POST /v1/seo/generate) ──────────────
  const generateContent = useMutation({
    mutationFn: async (params: { target_id: string; actions?: string[]; tone?: string; language?: string }) => {
      const resp = await seoApi.generate({
        target_type: 'product',
        target_id: params.target_id,
        actions: params.actions ?? ['title', 'description', 'meta'],
        tone: params.tone ?? 'conversion',
        language: params.language ?? 'fr',
      })
      return resp
    },
    onSuccess: () => {
      toast({ title: "Génération SEO lancée", description: "Le contenu IA est en cours de génération" })
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" })
    },
  })

  // ── Apply SEO content (POST /v1/seo/apply) ────────────────────
  const applyContent = useMutation({
    mutationFn: async (params: { target_id: string; fields: Record<string, any>; job_id?: string }) => {
      return await seoApi.apply({
        target_type: 'product',
        target_id: params.target_id,
        fields: params.fields,
        job_id: params.job_id,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({ title: "Contenu SEO appliqué", description: "Les optimisations ont été appliquées au catalogue" })
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" })
    },
  })

  const stats = {
    totalAnalyses: analyses.length,
    averageScore: analyses.length > 0
      ? analyses.reduce((sum, a) => sum + a.overall_score, 0) / analyses.length
      : 0,
    totalKeywords: keywords.length,
    achievedKeywords: 0,
    improvingKeywords: 0,
    trackingKeywords: 0,
    totalPages: analyses.length,
  }

  return {
    analyses,
    keywords,
    stats,
    seoData: analyses,
    isLoading: isLoadingAnalyses || isLoadingKeywords,
    analyzeUrl: analyzeUrl.mutate,
    analyzeSEO: analyzeUrl.mutate,
    generateContent: generateContent.mutate,
    applyContent: applyContent.mutate,
    addKeyword: (_data: any) => { /* Keywords API V1 not yet implemented */ },
    updateKeyword: (_data: any) => { /* Keywords API V1 not yet implemented */ },
    isAnalyzing: analyzeUrl.isPending,
    isGenerating: generateContent.isPending,
    isAddingKeyword: false,
    isUpdatingKeyword: false,
  }
}
