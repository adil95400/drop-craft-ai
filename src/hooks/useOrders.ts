import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, Order } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export const useOrders = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const {
    data: orders = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('orders' as any)
          .select(`
            *,
            order_items(*)
          `)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        return (data || []).map((item: any) => ({
          id: item.id || '',
          user_id: item.user_id || '',
          customer_id: item.customer_id,
          order_number: item.order_number || '',
          status: item.status || 'pending',
          total_amount: item.total_amount || 0,
          currency: item.currency || 'EUR',
          payment_status: item.payment_status || 'pending',
          shipping_address: item.shipping_address,
          billing_address: item.billing_address,
          tracking_number: item.tracking_number,
          notes: item.notes,
          platform_order_id: item.platform_order_id,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
          order_items: item.order_items || []
        })) as (Order & { order_items?: any })[]
      } catch (err) {
        console.warn('Orders table not found, returning empty array')
        return [] as (Order & { order_items?: any })[]
      }
    }
  })

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status, tracking_number }: { 
      id: string; 
      status: Order['status']; 
      tracking_number?: string 
    }) => {
      const updates: any = { status }
      if (tracking_number) updates.tracking_number = tracking_number

      const { data, error } = await supabase
        .from('orders' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast({
        title: "Commande mise à jour",
        description: "Le statut de la commande a été mis à jour.",
      })
    }
  })

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
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