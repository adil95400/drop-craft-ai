import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export function useProductTracking() {
  const trackView = useMutation({
    mutationFn: async ({ 
      productId, 
      userId, 
      source = 'catalog' 
    }: { 
      productId: string
      userId: string
      source?: string 
    }) => {
      const { data, error } = await supabase.functions.invoke('track-product-view', {
        body: { productId, userId, source }
      })

      if (error) throw error
      return data
    }
  })

  return { trackView }
}
