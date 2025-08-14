import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export interface Order {
  id: string
  order_number: string
  status: string
  total_amount: number
  customer_id?: string
  tracking_number?: string
  carrier?: string
  created_at: string
  updated_at: string
  customers?: { name: string; email: string }
  order_items?: Array<{
    product_name: string
    qty: number
    unit_price: number
    total_price: number
  }>
}

export const useRealOrders = (filters?: any) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['real-orders', filters],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          customers(name, email),
          order_items(product_name, qty, unit_price, total_price)
        `)
      
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.customer_id) {
        query = query.eq('customer_id', filters.customer_id)
      }
      if (filters?.date_range) {
        query = query.gte('created_at', filters.date_range.start)
                   .lte('created_at', filters.date_range.end)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Order[]
    },
  })

  const updateOrderStatus = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      trackingNumber 
    }: { 
      id: string; 
      status: string; 
      trackingNumber?: string 
    }) => {
      const updates: any = { status }
      if (trackingNumber) updates.tracking_number = trackingNumber
      
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-orders'] })
      toast({
        title: "Commande mise à jour",
        description: "Le statut de la commande a été modifié",
      })
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