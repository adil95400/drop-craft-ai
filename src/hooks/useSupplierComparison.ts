import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export function useSupplierComparison(productId: string, userId: string) {
  return useQuery({
    queryKey: ['supplier-comparison', productId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('compare-supplier-prices', {
        body: { productId, userId }
      })

      if (error) throw error
      return data
    },
    enabled: !!productId && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
