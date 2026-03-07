import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export function useSupplierComparison(productId: string, userId: string, productTitle?: string) {
  return useQuery({
    queryKey: ['supplier-comparison', productId, productTitle],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('supplier-compare', {
        body: { productTitle: productTitle || productId, query: productTitle },
      })
      if (error) throw error
      return data as {
        comparisons: Array<{
          supplierId: string
          supplierName: string
          price: number
          stock: number
          shippingTime: number
          currency: string
          url: string
          image?: string
          isBestPrice?: boolean
          isFastest?: boolean
          score: number
        }>
        query: string
        totalResults: number
      }
    },
    enabled: !!productId && !!userId && !!productTitle,
    staleTime: 10 * 60 * 1000, // 10 min cache
  })
}
