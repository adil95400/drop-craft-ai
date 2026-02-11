/**
 * Hook: useProductCosts — Coûts fournisseurs par variante
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { ProductCost } from '@/domains/commerce/types'

export function useProductCosts(userId?: string, variantId?: string) {
  const qc = useQueryClient()
  const key = ['product-costs', userId, variantId]

  const query = useQuery({
    queryKey: key,
    enabled: !!userId,
    queryFn: async () => {
      let q = supabase.from('product_costs').select('*').eq('user_id', userId!)
      if (variantId) q = q.eq('variant_id', variantId)
      const { data, error } = await q.order('updated_at', { ascending: false })
      if (error) throw error
      return data as ProductCost[]
    },
  })

  const upsert = useMutation({
    mutationFn: async (input: Omit<ProductCost, 'id' | 'updated_at'> & { id?: string }) => {
      const { data, error } = await supabase
        .from('product_costs')
        .upsert({ ...input, user_id: userId! })
        .select()
        .single()
      if (error) throw error
      return data as ProductCost
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { ...query, upsert }
}
