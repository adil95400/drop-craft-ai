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
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          products (
            id,
            name,
            image_url
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as (Order & { products?: any })[]
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
        .from('orders')
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