import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export interface Order {
  id: string
  user_id: string
  customer_id?: string
  order_number: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total_amount: number
  currency: string
  order_items?: any[]
  shipping_address: any
  billing_address: any
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
  tracking_number?: string
  tracking_status?: string
  carrier?: string
  notes?: string
  created_at: string
  updated_at: string
  customers?: any
}

export interface OrderStats {
  total: number
  pending: number
  processing: number
  shipped: number
  delivered: number
  cancelled: number
  totalRevenue: number
  revenue: number
  averageOrderValue: number
}

export const useRealOrders = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as any[]
    }
  })

  const { data: stats } = useQuery({
    queryKey: ['order-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('status, total_amount')

      if (error) throw error

      const stats: OrderStats = {
        total: data.length,
        pending: data.filter(o => o.status === 'pending').length,
        processing: data.filter(o => o.status === 'processing').length,
        shipped: data.filter(o => o.status === 'shipped').length,
        delivered: data.filter(o => o.status === 'delivered').length,
        cancelled: data.filter(o => o.status === 'cancelled').length,
        totalRevenue: data.reduce((sum, order) => sum + order.total_amount, 0),
        revenue: data.reduce((sum, order) => sum + order.total_amount, 0),
        averageOrderValue: data.length > 0 ? data.reduce((sum, order) => sum + order.total_amount, 0) / data.length : 0
      }

      return stats
    }
  })

  const addOrderMutation = useMutation({
    mutationFn: async (newOrder: Omit<Order, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('orders')
        .insert([newOrder])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order-stats'] })
      toast({
        title: "Succès",
        description: "Commande créée avec succès"
      })
    },
    onError: (error) => {
      console.error('Error adding order:', error)
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande",
        variant: "destructive"
      })
    }
  })

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Order> }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order-stats'] })
      toast({
        title: "Succès",
        description: "Commande mise à jour"
      })
    },
    onError: (error) => {
      console.error('Error updating order:', error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la commande",
        variant: "destructive"
      })
    }
  })

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order-stats'] })
      toast({
        title: "Succès",
        description: "Commande supprimée"
      })
    },
    onError: (error) => {
      console.error('Error deleting order:', error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la commande",
        variant: "destructive"
      })
    }
  })

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    return updateOrderMutation.mutateAsync({ 
      id: orderId, 
      updates: { status }
    })
  }

  return {
    orders,
    stats: stats || {
      total: 0,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      totalRevenue: 0,
      revenue: 0,
      averageOrderValue: 0
    },
    isLoading,
    error,
    addOrder: addOrderMutation.mutateAsync,
    updateOrder: updateOrderMutation.mutateAsync,
    deleteOrder: deleteOrderMutation.mutateAsync,
    updateOrderStatus,
    isAdding: addOrderMutation.isPending,
    isUpdating: updateOrderMutation.isPending,
    isDeleting: deleteOrderMutation.isPending
  }
}