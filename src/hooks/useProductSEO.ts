/**
 * Hook: useProductSEO — SEO appliqué + versions (audit trail)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { ProductSEO, ProductSEOVersion } from '@/domains/commerce/types'

export function useProductSEO(userId?: string, productId?: string, storeId?: string, language = 'fr') {
  const qc = useQueryClient()
  const key = ['product-seo', userId, productId, storeId, language]

  const query = useQuery({
    queryKey: key,
    enabled: !!userId && !!productId,
    queryFn: async () => {
      let q = supabase.from('product_seo').select('*').eq('user_id', userId!).eq('product_id', productId!).eq('language', language)
      if (storeId) q = q.eq('store_id', storeId)
      else q = q.is('store_id', null)
      const { data, error } = await q.maybeSingle()
      if (error) throw error
      return data as ProductSEO | null
    },
  })

  const upsert = useMutation({
    mutationFn: async (input: Partial<ProductSEO> & { product_id: string }) => {
      const { data, error } = await supabase
        .from('product_seo')
        .upsert({ ...input, user_id: userId!, language })
        .select()
        .single()
      if (error) throw error
      // Create version snapshot
      await supabase.from('product_seo_versions').insert({
        user_id: userId!,
        product_id: input.product_id,
        store_id: input.store_id || null,
        language,
        version: Date.now(),
        fields_json: { seo_title: input.seo_title, meta_description: input.meta_description, handle: input.handle },
        source: 'manual',
      })
      return data as ProductSEO
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { ...query, upsert }
}

export function useProductSEOVersions(userId?: string, productId?: string) {
  return useQuery({
    queryKey: ['product-seo-versions', userId, productId],
    enabled: !!userId && !!productId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_seo_versions')
        .select('*')
        .eq('user_id', userId!)
        .eq('product_id', productId!)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data as ProductSEOVersion[]
    },
  })
}
