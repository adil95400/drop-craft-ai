import { useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface QueueItem {
  id: string
  order_id: string
  user_id: string
  supplier_type: 'cj' | 'aliexpress' | 'bigbuy' | 'bts' | 'generic'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retry' | 'cancelled'
  retry_count: number
  max_retries: number
  payload: any
  result?: any
  error_message?: string
  next_retry_at?: string
  created_at: string
  updated_at: string
}

interface QueueStats {
  pending: number
  processing: number
  completed: number
  failed: number
  retry: number
}

export function useAutoOrderQueue(userId?: string) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch queue status
  const { data: queueData, isLoading, refetch } = useQuery({
    queryKey: ['auto-order-queue', userId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('auto-order-queue', {
        body: { action: 'get_status', userId }
      })

      if (error) throw error
      return data as { items: QueueItem[], stats: QueueStats }
    },
    enabled: !!userId,
    refetchInterval: 10000 // Refresh every 10 seconds
  })

  // Enqueue order mutation
  const enqueueMutation = useMutation({
    mutationFn: async (params: {
      orderId: string
      userId: string
      supplierType: 'cj' | 'aliexpress' | 'bigbuy' | 'bts' | 'generic'
      payload: any
    }) => {
      const { data, error } = await supabase.functions.invoke('auto-order-queue', {
        body: { action: 'enqueue', ...params }
      })

      if (error) throw error
      if (!data.success) throw new Error(data.error)
      return data
    },
    onSuccess: () => {
      toast({
        title: "Commande ajoutée",
        description: "La commande a été ajoutée à la file d'attente"
      })
      queryClient.invalidateQueries({ queryKey: ['auto-order-queue'] })
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Cancel order mutation
  const cancelMutation = useMutation({
    mutationFn: async (params: { queueId: string, userId: string }) => {
      const { data, error } = await supabase.functions.invoke('auto-order-queue', {
        body: { action: 'cancel', ...params }
      })

      if (error) throw error
      if (!data.success) throw new Error(data.error || 'Failed to cancel')
      return data
    },
    onSuccess: () => {
      toast({
        title: "Commande annulée",
        description: "La commande a été retirée de la file"
      })
      queryClient.invalidateQueries({ queryKey: ['auto-order-queue'] })
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Retry failed order mutation
  const retryMutation = useMutation({
    mutationFn: async (params: { queueId: string, userId: string }) => {
      const { data, error } = await supabase.functions.invoke('auto-order-queue', {
        body: { action: 'retry_now', ...params }
      })

      if (error) throw error
      if (!data.success) throw new Error(data.error || 'Failed to retry')
      return data
    },
    onSuccess: () => {
      toast({
        title: "Nouvelle tentative",
        description: "La commande sera retraitée"
      })
      queryClient.invalidateQueries({ queryKey: ['auto-order-queue'] })
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Direct CJ order
  const cjOrderMutation = useMutation({
    mutationFn: async (params: { userId: string, orderData: any }) => {
      const { data, error } = await supabase.functions.invoke('auto-order-queue', {
        body: { action: 'cj_order', ...params }
      })

      if (error) throw error
      if (!data.success) throw new Error(data.error)
      return data
    },
    onSuccess: (data) => {
      toast({
        title: "Commande CJ créée",
        description: `Order ID: ${data.result?.data?.orderId}`
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur CJ",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  return {
    // Data
    queueItems: queueData?.items || [],
    stats: queueData?.stats || { pending: 0, processing: 0, completed: 0, failed: 0, retry: 0 },
    isLoading,

    // Actions
    enqueueOrder: enqueueMutation.mutate,
    cancelOrder: cancelMutation.mutate,
    retryOrder: retryMutation.mutate,
    createCJOrder: cjOrderMutation.mutate,
    refetch,

    // Mutation states
    isEnqueuing: enqueueMutation.isPending,
    isCancelling: cancelMutation.isPending,
    isRetrying: retryMutation.isPending,
    isCreatingCJOrder: cjOrderMutation.isPending
  }
}
