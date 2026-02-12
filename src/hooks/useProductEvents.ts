/**
 * Hook: useProductEvents — Audit log produit (via API V1)
 */
import { useQuery } from '@tanstack/react-query'
import { eventsApi } from '@/services/api/client'
import type { ProductEvent } from '@/domains/commerce/types'

export function useProductEvents(userId?: string, productId?: string, limit = 50) {
  return useQuery({
    queryKey: ['product-events', userId, productId, limit],
    enabled: !!userId,
    queryFn: async () => {
      const resp = await eventsApi.list({ product_id: productId, limit })
      return (resp.items ?? []) as ProductEvent[]
    },
  })
}
