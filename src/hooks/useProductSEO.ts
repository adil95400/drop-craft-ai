/**
 * Hook: useProductSEO — SEO appliqué + versions (via API V1)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productSeoApi } from '@/services/api/client'
import type { ProductSEO, ProductSEOVersion } from '@/domains/commerce/types'

export function useProductSEO(userId?: string, productId?: string, storeId?: string, language = 'fr') {
  const qc = useQueryClient()
  const key = ['product-seo', userId, productId, storeId, language]

  const query = useQuery({
    queryKey: key,
    enabled: !!userId && !!productId,
    queryFn: async () => {
      const resp = await productSeoApi.get({ product_id: productId!, store_id: storeId, language })
      return (resp.seo ?? null) as ProductSEO | null
    },
  })

  const upsert = useMutation({
    mutationFn: async (input: Partial<ProductSEO> & { product_id: string }) => {
      return productSeoApi.upsert({ ...input, language, source: 'manual' }) as Promise<ProductSEO>
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
      const resp = await productSeoApi.versions({ product_id: productId! })
      return (resp.items ?? []) as ProductSEOVersion[]
    },
  })
}
