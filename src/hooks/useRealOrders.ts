import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { ApiService } from '@/services/api'
import type { Order } from '@/lib/supabase'

export const useRealOrders = (filters?: any) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['real-orders', filters],
    queryFn: () => ApiService.getOrders(filters),
  })

  const updateOrderStatus = useMutation({
    mutationFn: ({ 
      id, 
      status, 
      trackingNumber 
    }: { 
      id: string; 
      status: string; 
      trackingNumber?: string 
    }) => ApiService.updateOrderStatus(id, status, trackingNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-orders'] })
    }
  })

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    revenue: orders.reduce((sum, order) => sum + order.total_amount, 0)
  }

  return {
    orders,
    stats,
    isLoading,
    error,
    updateOrderStatus: updateOrderStatus.mutate,
    isUpdating: updateOrderStatus.isPending
  }
}