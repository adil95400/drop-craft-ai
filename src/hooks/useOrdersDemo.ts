import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export interface Order {
  id: string
  order_number: string
  customer_id?: string
  customer_name?: string
  customer_email?: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total_amount: number
  currency: string
  created_at: string
  updated_at: string
  tracking_number?: string
  notes?: string
  items?: OrderItem[]
  shipping_address?: any
  billing_address?: any
}

export interface OrderItem {
  id: string
  product_name: string
  product_sku?: string
  quantity: number
  unit_price: number
  total_price: number
}

export const useOrdersDemo = (filters: any = {}) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders-real', filters],
    queryFn: async () => {
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false })
      
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      // Apply search filter in memory if needed
      if (filters.search && data) {
        return data.filter(order => 
          order.order_number.toLowerCase().includes(filters.search.toLowerCase())
        )
      }
      
      return data || []
    }
  })

  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status: status as Order['status'], updated_at: new Date().toISOString() })
        .eq('id', orderId)
      
      if (error) throw error
      return { orderId, status }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders-real'] })
      toast({ title: "Statut mis à jour", description: "Le statut de la commande a été modifié." })
    }
  })

  const addTrackingNumber = useMutation({
    mutationFn: async ({ orderId, trackingNumber }: { orderId: string; trackingNumber: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ tracking_number: trackingNumber, updated_at: new Date().toISOString() })
        .eq('id', orderId)
      
      if (error) throw error
      return { orderId, trackingNumber }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders-real'] })
      toast({ title: "Numéro de suivi ajouté", description: "Le numéro de tracking a été enregistré." })
    }
  })

  // Calculer les statistiques
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    revenue: orders.reduce((sum, order) => sum + order.total_amount, 0),
    averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + order.total_amount, 0) / orders.length : 0
  }

  return {
    orders,
    stats,
    isLoading,
    updateOrderStatus: updateOrderStatus.mutate,
    addTrackingNumber: addTrackingNumber.mutate,
    isUpdating: updateOrderStatus.isPending,
    isAddingTracking: addTrackingNumber.isPending
  }
}