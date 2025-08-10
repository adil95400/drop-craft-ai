import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

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

interface TrackingOrder {
  id: string
  order_number: string
  tracking_number: string
  carrier: string
  status: string
  created_at: string
  customer_name?: string
  shipping_address?: any
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
          status,
          created_at,
          customers(name),
          shipping_address
        `)
        .not('tracking_number', 'is', null)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as TrackingOrder[]
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