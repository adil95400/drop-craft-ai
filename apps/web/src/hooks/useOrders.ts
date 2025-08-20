import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

type Order = {
  id: string
  user_id: string
  customer_id?: string
  order_number: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total_amount: number
  currency: string
  shipping_address?: any
  billing_address?: any
  tracking_number?: string
  notes?: string
  created_at: string
  updated_at: string
}

// Real API calls to FastAPI backend
const apiCall = async (endpoint: string, options?: RequestInit) => {
  const response = await fetch(`/api${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  })
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`)
  }
  
  return response.json()
}

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
      // Try API first, fallback to Supabase
      try {
        return await apiCall('/orders')
      } catch (apiError) {
        console.warn('API call failed, falling back to Supabase:', apiError)
        try {
          const { data, error } = await supabase
            .from('orders')
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
            shipping_address: item.shipping_address,
            billing_address: item.billing_address,
            tracking_number: item.tracking_number,
            notes: item.notes,
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at || new Date().toISOString(),
            order_items: item.order_items || []
          })) as (Order & { order_items?: any })[]
        } catch (err) {
          console.warn('Orders table not found, returning empty array')
          return [] as (Order & { order_items?: any })[]
        }
      }
    }
  })

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status, tracking_number }: { 
      id: string; 
      status: Order['status']; 
      tracking_number?: string 
    }) => {
      try {
        return await apiCall(`/orders/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ status, tracking_number })
        })
      } catch (apiError) {
        // Fallback to Supabase
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
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast({
        title: "Commande mise à jour",
        description: "Le statut de la commande a été mis à jour.",
      })
    }
  })

  // Shopify sync function
  const syncShopifyOrders = useMutation({
    mutationFn: async () => {
      return await apiCall('/shopify/sync-orders', { method: 'POST' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast({
        title: "Synchronisation réussie",
        description: "Les commandes Shopify ont été synchronisées.",
      })
    },
    onError: () => {
      toast({
        title: "Erreur de synchronisation",
        description: "Impossible de synchroniser les commandes Shopify.",
        variant: "destructive",
      })
    }
  })

  // Update tracking with 17Track
  const updateTracking = useMutation({
    mutationFn: async (orderIds: string[]) => {
      return await apiCall('/tracking/17track/sync', {
        method: 'POST',
        body: JSON.stringify({ order_ids: orderIds })
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast({
        title: "Tracking mis à jour",
        description: "Les informations de suivi ont été mises à jour.",
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
    syncShopifyOrders: syncShopifyOrders.mutate,
    updateTracking: updateTracking.mutate,
    isUpdating: updateOrderStatus.isPending,
    isSyncing: syncShopifyOrders.isPending,
    isUpdatingTracking: updateTracking.isPending
  }
}