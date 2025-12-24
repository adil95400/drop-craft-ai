import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

export interface UnifiedOrder {
  id: string
  user_id: string
  customer_id?: string
  order_number: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total_amount: number
  currency: string
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  shipping_address?: any
  billing_address?: any
  tracking_number?: string
  notes?: string
  platform_order_id?: string
  items?: any[]
  created_at: string
  updated_at: string
}

export function useUnifiedOrders(filters?: {
  status?: UnifiedOrder['status']
  search?: string
  page?: number
  pageSize?: number
}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const page = filters?.page || 0
  const pageSize = filters?.pageSize || 50

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['unified-orders', user?.id, filters],
    queryFn: async () => {
      if (!user) return []

      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `, { count: 'exact' })
        .eq('user_id', user.id)

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.search) {
        query = query.or(`order_number.ilike.%${filters.search}%,tracking_number.ilike.%${filters.search}%`)
      }

      query = query
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      const { data, error, count } = await query

      if (error) {
        console.warn('Orders query error:', error)
        return []
      }

      const orders = (data || []).map((item: any): UnifiedOrder & { _totalCount?: number } => ({
        id: item.id,
        user_id: item.user_id,
        customer_id: item.customer_id,
        order_number: item.order_number,
        status: item.status || 'pending',
        total_amount: item.total_amount || 0,
        currency: item.currency || 'EUR',
        payment_status: item.payment_status || 'pending',
        shipping_address: item.shipping_address,
        billing_address: item.billing_address,
        tracking_number: item.tracking_number,
        notes: item.notes,
        platform_order_id: item.platform_order_id,
        items: item.order_items || [],
        created_at: item.created_at,
        updated_at: item.updated_at,
        _totalCount: count || 0
      }))
      
      return orders
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<UnifiedOrder> }) => {
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-orders'] })
      toast({
        title: "Commande mise à jour",
        description: "La commande a été mise à jour avec succès",
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la commande",
        variant: "destructive",
      })
    }
  })

  const totalCount = (data[0] as any)?._totalCount || data.length
  
  const stats = {
    total: data.length,
    totalCount,
    pending: data.filter(o => o.status === 'pending').length,
    processing: data.filter(o => o.status === 'processing').length,
    shipped: data.filter(o => o.status === 'shipped').length,
    delivered: data.filter(o => o.status === 'delivered').length,
    cancelled: data.filter(o => o.status === 'cancelled').length,
    revenue: data.reduce((sum, order) => sum + order.total_amount, 0),
    avgOrderValue: data.length > 0 ? data.reduce((sum, order) => sum + order.total_amount, 0) / data.length : 0,
    hasMore: (page + 1) * pageSize < totalCount,
    currentPage: page,
    pageSize
  }

  return {
    data,
    stats,
    isLoading,
    error,
    update: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['unified-orders'] })
  }
}
