import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface AuditResult {
  overallScore: number
  titleScore: number
  descriptionScore: number
  imageScore: number
  seoScore: number
  pricingScore: number
  variantsScore: number
  errors: Array<{ type: string; message: string; field: string }>
  warnings: Array<{ type: string; message: string; field: string }>
  recommendations: Array<{ type: string; message: string; priority: 'high' | 'medium' | 'low' }>
  suggestedTitle?: string
  suggestedDescription?: string
  suggestedTags?: string[]
}

export interface ProductAudit {
  id: string
  user_id: string
  product_id: string
  product_source: 'products' | 'imported_products' | 'supplier_products'
  audit_type: 'full' | 'quick' | 'seo_only'
  overall_score: number
  title_score: number
  description_score: number
  image_score: number
  seo_score: number
  pricing_score: number
  variants_score: number
  errors: any[]
  warnings: any[]
  recommendations: any[]
  suggested_title?: string
  suggested_description?: string
  suggested_tags?: string[]
  audit_duration_ms?: number
  created_at: string
  updated_at: string
}

export function useProductAudit() {
  const queryClient = useQueryClient()

  const auditProduct = useMutation({
    mutationFn: async ({
      productId,
      productSource,
      auditType = 'full',
      userId
    }: {
      productId: string
      productSource: 'products' | 'imported_products' | 'supplier_products'
      auditType?: 'full' | 'quick' | 'seo_only'
      userId: string
    }) => {
      const { data, error } = await supabase.functions.invoke('audit-product', {
        body: { productId, productSource, auditType, userId }
      })

      if (error) throw error
      return data as { success: boolean; audit: AuditResult }
    },
    onSuccess: (data) => {
      const score = data.audit.overallScore
      if (score >= 80) {
        toast.success(`Audit terminé - Score: ${score}/100 ✨`)
      } else if (score >= 60) {
        toast.info(`Audit terminé - Score: ${score}/100`)
      } else {
        toast.warning(`Audit terminé - Score: ${score}/100 - Améliorations recommandées`)
      }
      queryClient.invalidateQueries({ queryKey: ['product-audits'] })
      queryClient.invalidateQueries({ queryKey: ['audit-analytics'] })
    },
    onError: (error) => {
      console.error('Error auditing product:', error)
      toast.error('Erreur lors de l\'audit du produit')
    }
  })

  return {
    auditProduct,
    isAuditing: auditProduct.isPending
  }
}

export function useProductAudits(userId: string, limit = 50) {
  return useQuery({
    queryKey: ['product-audits', userId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_audits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data as ProductAudit[]
    },
  })
}

export function useProductAuditById(auditId: string) {
  return useQuery({
    queryKey: ['product-audit', auditId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_audits')
        .select('*')
        .eq('id', auditId)
        .single()

      if (error) throw error
      return data as ProductAudit
    },
    enabled: !!auditId,
  })
}

export function useAuditAnalytics(userId: string) {
  return useQuery({
    queryKey: ['audit-analytics', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_analytics')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(30)

      if (error) throw error
      return data
    },
  })
}