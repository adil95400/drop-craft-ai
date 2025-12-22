import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { TrackingOrder } from '@/types/database'

interface TrackingInfo {
  tracking_number: string
  carrier: string
  status: string
  location?: string
  estimated_delivery?: string
  checkpoints: Array<{
    date: string
    status: string
    location: string
    details: string
  }>
  last_updated: string
}

export const useRealTracking = () => {
  const { toast } = useToast()
  const [selectedProvider, setSelectedProvider] = useState('17track')

  // Fetch orders with tracking
  const {
    data: trackingOrders = [],
    isLoading: isLoadingOrders,
    refetch: refetchOrders
  } = useQuery({
    queryKey: ['tracking-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          tracking_number,
          carrier,
          status,
          created_at,
          customer_id,
          shipping_address
        `)
        .not('tracking_number', 'is', null)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // Get customer names separately
      const customerIds = [...new Set(data?.map(o => o.customer_id).filter(Boolean))]
      let customerMap: Record<string, string> = {}
      
      if (customerIds.length > 0) {
        const { data: customers } = await supabase
          .from('customers')
          .select('id, first_name, last_name, email')
          .in('id', customerIds)
        
        if (customers) {
          customerMap = customers.reduce((acc, c) => {
            acc[c.id] = `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email
            return acc
          }, {} as Record<string, string>)
        }
      }
      
      return (data || []).map(order => ({
        id: order.id,
        order_number: order.order_number,
        tracking_number: order.tracking_number || '',
        carrier: order.carrier || 'auto',
        status: order.status || 'pending',
        created_at: order.created_at,
        customer_name: order.customer_id ? customerMap[order.customer_id] : undefined,
        shipping_address: order.shipping_address
      })) as TrackingOrder[]
    }
  })

  // Track a package using real API
  const trackPackage = useMutation({
    mutationFn: async ({ 
      trackingNumber, 
      carrier = 'auto', 
      provider = '17track' 
    }: { 
      trackingNumber: string
      carrier?: string
      provider?: string 
    }) => {
      const { data, error } = await supabase.functions.invoke('tracking-integration', {
        body: {
          action: 'track',
          tracking_number: trackingNumber,
          carrier,
          provider
        }
      })
      
      if (error) throw error
      return data as TrackingInfo
    },
    onSuccess: (data) => {
      toast({
        title: "Suivi mis à jour",
        description: `Statut: ${data.status} - ${data.location || 'En transit'}`,
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de suivi",
        description: error.message || "Impossible de récupérer les informations de suivi",
        variant: "destructive",
      })
    }
  })

  // Bulk track multiple packages
  const bulkTrackPackages = useMutation({
    mutationFn: async (trackingNumbers: string[]) => {
      const results = await Promise.allSettled(
        trackingNumbers.map(trackingNumber =>
          supabase.functions.invoke('tracking-integration', {
            body: {
              action: 'track',
              tracking_number: trackingNumber,
              provider: selectedProvider
            }
          })
        )
      )
      
      return results.map((result, index) => ({
        tracking_number: trackingNumbers[index],
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value.data : null,
        error: result.status === 'rejected' ? result.reason : null
      }))
    },
    onSuccess: (results) => {
      const successful = results.filter(r => r.success).length
      const failed = results.filter(r => !r.success).length
      
      toast({
        title: "Suivi groupé terminé",
        description: `${successful} réussis, ${failed} échoués`,
      })
      
      refetchOrders()
    }
  })

  // Update order tracking status
  const updateOrderTracking = useMutation({
    mutationFn: async ({ 
      orderId, 
      trackingNumber, 
      status 
    }: { 
      orderId: string
      trackingNumber: string
      status: string 
    }) => {
      const { error } = await supabase
        .from('orders')
        .update({ 
          tracking_number: trackingNumber,
          status: status 
        })
        .eq('id', orderId)
      
      if (error) throw error
    },
    onSuccess: () => {
      refetchOrders()
      toast({
        title: "Commande mise à jour",
        description: "Le statut de suivi a été mis à jour",
      })
    }
  })

  // Get tracking statistics
  const getTrackingStats = () => {
    const stats = {
      total: trackingOrders.length,
      pending: trackingOrders.filter(o => o.status === 'pending').length,
      shipped: trackingOrders.filter(o => o.status === 'shipped').length,
      delivered: trackingOrders.filter(o => o.status === 'delivered').length,
      in_transit: trackingOrders.filter(o => o.status === 'in_transit').length
    }
    
    return stats
  }

  // Auto-refresh tracking for active orders
  const autoRefreshTracking = useMutation({
    mutationFn: async () => {
      const activeOrders = trackingOrders.filter(o => 
        ['shipped', 'in_transit'].includes(o.status) && 
        o.tracking_number
      )
      
      if (activeOrders.length === 0) return []
      
      const trackingNumbers = activeOrders.map(o => o.tracking_number)
      return bulkTrackPackages.mutateAsync(trackingNumbers)
    }
  })

  return {
    trackingOrders,
    isLoadingOrders,
    selectedProvider,
    setSelectedProvider,
    trackPackage: trackPackage.mutate,
    bulkTrackPackages: bulkTrackPackages.mutate,
    updateOrderTracking: updateOrderTracking.mutate,
    autoRefreshTracking: autoRefreshTracking.mutate,
    getTrackingStats,
    refetchOrders,
    isTracking: trackPackage.isPending,
    isBulkTracking: bulkTrackPackages.isPending,
    isUpdating: updateOrderTracking.isPending,
    isAutoRefreshing: autoRefreshTracking.isPending
  }
}
