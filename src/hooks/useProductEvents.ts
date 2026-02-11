/**
 * Hook: useProductEvents — Audit log produit (lecture)
 */
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { ProductEvent } from '@/domains/commerce/types'

export function useProductEvents(userId?: string, productId?: string, limit = 50) {
  return useQuery({
    queryKey: ['product-events', userId, productId, limit],
    enabled: !!userId,
    queryFn: async () => {
      let q = supabase.from('product_events').select('*').eq('user_id', userId!)
      if (productId) q = q.eq('product_id', productId)
      const { data, error } = await q.order('created_at', { ascending: false }).limit(limit)
      if (error) throw error
      return data as ProductEvent[]
    },
  })
}
