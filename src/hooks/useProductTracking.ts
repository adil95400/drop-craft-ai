import { useMutation } from '@tanstack/react-query'
import { trackingApi } from '@/services/api/client'

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
      return trackingApi.trackView({ productId, source })
    }
  })

  return { trackView }
}
