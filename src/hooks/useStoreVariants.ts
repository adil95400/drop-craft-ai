/**
 * Hook: useStoreVariants — Mapping variantes canoniques ↔ variantes boutiques
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { StoreVariant } from '@/domains/commerce/types'

export function useStoreVariants(userId?: string, storeId?: string, variantId?: string) {
  const qc = useQueryClient()
  const key = ['store-variants', userId, storeId, variantId]

  const query = useQuery({
    queryKey: key,
    enabled: !!userId,
    queryFn: async () => {
      let q = supabase.from('store_variants').select('*').eq('user_id', userId!)
      if (storeId) q = q.eq('store_id', storeId)
      if (variantId) q = q.eq('variant_id', variantId)
      const { data, error } = await q
      if (error) throw error
      return data as StoreVariant[]
    },
  })

  const upsert = useMutation({
    mutationFn: async (input: Omit<StoreVariant, 'id'> & { id?: string }) => {
      const { data, error } = await supabase
        .from('store_variants')
        .upsert({ ...input, user_id: userId! })
        .select()
        .single()
      if (error) throw error
      return data as StoreVariant
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { ...query, upsert }
}
