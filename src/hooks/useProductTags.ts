/**
 * Hook: useProductTags — CRUD tags normalisés
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { ProductTag } from '@/domains/commerce/types'

export function useProductTags(userId?: string) {
  const qc = useQueryClient()
  const key = ['product-tags', userId]

  const query = useQuery({
    queryKey: key,
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_tags')
        .select('*')
        .eq('user_id', userId!)
        .order('name')
      if (error) throw error
      return data as ProductTag[]
    },
  })

  const create = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('product_tags')
        .insert({ user_id: userId!, name })
        .select()
        .single()
      if (error) throw error
      return data as ProductTag
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const remove = useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase.from('product_tags').delete().eq('id', tagId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const linkTag = useMutation({
    mutationFn: async ({ productId, tagId }: { productId: string; tagId: string }) => {
      const { error } = await supabase.from('product_tag_links').insert({ product_id: productId, tag_id: tagId })
      if (error) throw error
    },
  })

  const unlinkTag = useMutation({
    mutationFn: async ({ productId, tagId }: { productId: string; tagId: string }) => {
      const { error } = await supabase.from('product_tag_links').delete().eq('product_id', productId).eq('tag_id', tagId)
      if (error) throw error
    },
  })

  return { ...query, create, remove, linkTag, unlinkTag }
}
