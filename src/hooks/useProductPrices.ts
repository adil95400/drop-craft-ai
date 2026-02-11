/**
 * Hook: useProductPrices — Prix multi-boutiques par variante
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { ProductPrice } from '@/domains/commerce/types'

export function useProductPrices(userId?: string, variantId?: string, storeId?: string) {
  const qc = useQueryClient()
  const key = ['product-prices', userId, variantId, storeId]

  const query = useQuery({
    queryKey: key,
    enabled: !!userId,
    queryFn: async () => {
      let q = supabase.from('product_prices').select('*').eq('user_id', userId!)
      if (variantId) q = q.eq('variant_id', variantId)
      if (storeId) q = q.eq('store_id', storeId)
      const { data, error } = await q.order('updated_at', { ascending: false })
      if (error) throw error
      return data as ProductPrice[]
    },
  })

  const upsert = useMutation({
    mutationFn: async (input: Omit<ProductPrice, 'id' | 'updated_at'> & { id?: string }) => {
      const { data, error } = await supabase
        .from('product_prices')
        .upsert({ ...input, user_id: userId! })
        .select()
        .single()
      if (error) throw error
      return data as ProductPrice
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { ...query, upsert }
}
