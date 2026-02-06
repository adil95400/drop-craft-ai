/**
 * useApiOrders - Hook pour les opérations commandes via Supabase direct
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export function useApiOrders() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['unified-orders'] })
  }

  const fulfillOrder = useMutation({
    mutationFn: async (params: { orderId: string; supplierId?: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'processing', fulfillment_status: 'in_progress' })
        .eq('id', params.orderId)
      if (error) throw error
      return { success: true }
    },
    onSuccess: () => {
      toast({ title: 'Fulfillment lancé' })
      invalidate()
    },
  })

  const bulkFulfill = useMutation({
    mutationFn: async (params: { orderIds: string[]; supplierPreference?: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'processing', fulfillment_status: 'in_progress' })
        .in('id', params.orderIds)
      if (error) throw error
      return { success: true }
    },
    onSuccess: () => {
      toast({ title: 'Fulfillment bulk lancé' })
      invalidate()
    },
  })

  const updateStatus = useMutation({
    mutationFn: async (params: { orderId: string; status: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status: params.status })
        .eq('id', params.orderId)
      if (error) throw error
      return { success: true }
    },
    onSuccess: () => {
      toast({ title: 'Statut mis à jour' })
      invalidate()
    },
  })

  return {
    fulfillOrder,
    bulkFulfill,
    updateStatus,
    isFulfilling: fulfillOrder.isPending,
    isBulkFulfilling: bulkFulfill.isPending,
    isUpdating: updateStatus.isPending,
  }
}
