import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface ContentRewrite {
  id: string
  user_id: string
  product_id: string
  product_source: 'products' | 'imported_products' | 'supplier_products'
  rewrite_type: 'title' | 'description' | 'both'
  tone: 'professional' | 'casual' | 'luxury' | 'technical' | 'creative'
  original_title?: string
  original_description?: string
  rewritten_title?: string
  rewritten_description?: string
  was_applied: boolean
  applied_at?: string
  ai_model?: string
  created_at: string
}

export function useContentRewriter() {
  const queryClient = useQueryClient()

  const rewriteContent = useMutation({
    mutationFn: async ({
      productId,
      productSource,
      userId,
      rewriteType,
      tone
    }: {
      productId: string
      productSource: 'products' | 'imported_products' | 'supplier_products'
      userId: string
      rewriteType: 'title' | 'description' | 'both'
      tone: 'professional' | 'casual' | 'luxury' | 'technical' | 'creative'
    }) => {
      const { data, error } = await supabase.functions.invoke('rewrite-product-content', {
        body: { productId, productSource, userId, rewriteType, tone }
      })

      if (error) throw error
      return data as { success: boolean; rewrite: ContentRewrite }
    },
    onSuccess: (data) => {
      toast.success('Contenu généré avec succès ✨')
      queryClient.invalidateQueries({ queryKey: ['product-rewrites'] })
    },
    onError: (error) => {
      console.error('Error rewriting content:', error)
      toast.error('Erreur lors de la génération du contenu')
    }
  })

  const applyRewrite = useMutation({
    mutationFn: async ({
      rewriteId,
      productId,
      productSource,
    }: {
      rewriteId: string
      productId: string
      productSource: 'products' | 'imported_products' | 'supplier_products'
    }) => {
      // Récupérer le rewrite
      const { data: rewrite, error: rewriteError } = await supabase
        .from('product_rewrites')
        .select('*')
        .eq('id', rewriteId)
        .single()

      if (rewriteError) throw rewriteError

      // Mettre à jour le produit
      const updateData: any = {}
      if (rewrite.rewritten_title) updateData.name = rewrite.rewritten_title
      if (rewrite.rewritten_description) updateData.description = rewrite.rewritten_description

      const { error: updateError } = await supabase
        .from(productSource)
        .update(updateData)
        .eq('id', productId)

      if (updateError) throw updateError

      // Marquer le rewrite comme appliqué
      const { error: markError } = await supabase
        .from('product_rewrites')
        .update({ was_applied: true, applied_at: new Date().toISOString() })
        .eq('id', rewriteId)

      if (markError) throw markError

      return { success: true }
    },
    onSuccess: () => {
      toast.success('Modifications appliquées au produit')
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product-rewrites'] })
    },
    onError: (error) => {
      console.error('Error applying rewrite:', error)
      toast.error('Erreur lors de l\'application')
    }
  })

  return {
    rewriteContent,
    applyRewrite,
    isRewriting: rewriteContent.isPending,
    isApplying: applyRewrite.isPending
  }
}

export function useProductRewrites(userId: string, productId?: string) {
  return useQuery({
    queryKey: ['product-rewrites', userId, productId],
    queryFn: async () => {
      let query = supabase
        .from('product_rewrites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (productId) {
        query = query.eq('product_id', productId)
      }

      const { data, error } = await query.limit(50)

      if (error) throw error
      return data as ContentRewrite[]
    },
    enabled: !!userId,
  })
}

export function useProductAttributes(userId: string, productId?: string) {
  return useQuery({
    queryKey: ['product-ai-attributes', userId, productId],
    queryFn: async () => {
      let query = supabase
        .from('product_ai_attributes')
        .select('*')
        .eq('user_id', userId)

      if (productId) {
        query = query.eq('product_id', productId)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    },
    enabled: !!userId,
  })
}

export function useGenerateAttributes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      productId,
      productSource,
      userId
    }: {
      productId: string
      productSource: 'products' | 'imported_products' | 'supplier_products'
      userId: string
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-product-attributes', {
        body: { productId, productSource, userId }
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('Attributs générés avec succès')
      queryClient.invalidateQueries({ queryKey: ['product-ai-attributes'] })
    },
    onError: (error) => {
      console.error('Error generating attributes:', error)
      toast.error('Erreur lors de la génération des attributs')
    }
  })
}