import { useQuery } from '@tanstack/react-query'
import { trackingApi } from '@/services/api/client'

export function useSupplierComparison(productId: string, userId: string) {
  return useQuery({
    queryKey: ['supplier-comparison', productId],
    queryFn: async () => {
      return trackingApi.compareSuppliers({ productId })
    },
    enabled: !!productId && !!userId,
    staleTime: 5 * 60 * 1000,
  })
}
