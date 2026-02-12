/**
 * Hook: useProductPrices — Prix multi-boutiques par variante (via API V1)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pricesApi } from '@/services/api/client'
import type { ProductPrice } from '@/domains/commerce/types'

export function useProductPrices(userId?: string, variantId?: string, storeId?: string) {
  const qc = useQueryClient()
  const key = ['product-prices', userId, variantId, storeId]

  const query = useQuery({
    queryKey: key,
    enabled: !!userId,
    queryFn: async () => {
      const resp = await pricesApi.list({ variant_id: variantId, store_id: storeId })
      return (resp.items ?? []) as ProductPrice[]
    },
  })

  const upsert = useMutation({
    mutationFn: async (input: Omit<ProductPrice, 'id' | 'updated_at'> & { id?: string }) => {
      return pricesApi.upsert(input) as Promise<ProductPrice>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { ...query, upsert }
}
