/**
 * Hook: useProductCollections — CRUD collections/catégories canoniques
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { ProductCollection } from '@/domains/commerce/types'

export function useProductCollections(userId?: string) {
  const qc = useQueryClient()
  const key = ['product-collections', userId]

  const query = useQuery({
    queryKey: key,
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_collections')
        .select('*')
        .eq('user_id', userId!)
        .order('name')
      if (error) throw error
      return data as ProductCollection[]
    },
  })

  const create = useMutation({
    mutationFn: async (input: { name: string; parent_id?: string }) => {
      const { data, error } = await supabase
        .from('product_collections')
        .insert({ user_id: userId!, ...input })
        .select()
        .single()
      if (error) throw error
      return data as ProductCollection
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_collections').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const linkProduct = useMutation({
    mutationFn: async ({ productId, collectionId }: { productId: string; collectionId: string }) => {
      const { error } = await supabase.from('product_collection_links').insert({ product_id: productId, collection_id: collectionId })
      if (error) throw error
    },
  })

  const unlinkProduct = useMutation({
    mutationFn: async ({ productId, collectionId }: { productId: string; collectionId: string }) => {
      const { error } = await supabase.from('product_collection_links').delete().eq('product_id', productId).eq('collection_id', collectionId)
      if (error) throw error
    },
  })

  return { ...query, create, remove, linkProduct, unlinkProduct }
}
