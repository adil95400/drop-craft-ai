/**
 * useApiOrders - Hook pour les opérations commandes via FastAPI
 * Fulfillment, bulk fulfill → créent des jobs
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { shopOptiApi } from '@/services/api/ShopOptiApiClient'

export function useApiOrders() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['unified-orders'] })
    queryClient.invalidateQueries({ queryKey: ['api-jobs'] })
  }

  // Fulfill a single order → job
  const fulfillOrder = useMutation({
    mutationFn: (params: { orderId: string; supplierId?: string }) =>
      shopOptiApi.fulfillOrder(params.orderId, params.supplierId),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: 'Fulfillment lancé', description: `Job: ${res.job_id || res.data?.job_id || 'en cours'}` })
        invalidate()
      } else {
        toast({ title: 'Erreur fulfillment', description: res.error, variant: 'destructive' })
      }
    },
  })

  // Bulk fulfill orders → job
  const bulkFulfill = useMutation({
    mutationFn: (params: { orderIds: string[]; supplierPreference?: string }) =>
      shopOptiApi.bulkFulfillOrders(params.orderIds, params.supplierPreference),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: 'Fulfillment bulk lancé' })
        invalidate()
      }
    },
  })

  // Update order status via FastAPI
  const updateStatus = useMutation({
    mutationFn: (params: { orderId: string; status: string }) =>
      shopOptiApi.updateOrderStatus(params.orderId, params.status),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: 'Statut mis à jour' })
        invalidate()
      }
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
