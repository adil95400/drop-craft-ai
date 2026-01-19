/**
 * @deprecated Use useOrdersUnified from '@/hooks/unified' instead
 * This file is kept for backward compatibility and will be removed in a future version
 */
import { useOrdersUnified, UnifiedOrder } from '@/hooks/unified'

// Re-export Order type for backward compatibility
export type Order = UnifiedOrder

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
  console.warn('[DEPRECATED] useRealOrders - utilisez useOrdersUnified de @/hooks/unified')
  
  const result = useOrdersUnified()

  return {
    orders: result.orders,
    stats: {
      total: result.stats.total,
      pending: result.stats.pending,
      processing: result.stats.processing,
      shipped: result.stats.shipped,
      delivered: result.stats.delivered,
      cancelled: result.stats.cancelled,
      totalRevenue: result.stats.revenue,
      revenue: result.stats.revenue,
      averageOrderValue: result.stats.avgOrderValue
    } as OrderStats,
    isLoading: result.isLoading,
    error: result.error,
    addOrder: async () => { throw new Error('Use useOrdersUnified for mutations') },
    updateOrder: result.updateAsync,
    deleteOrder: async () => { throw new Error('Use useOrdersUnified for mutations') },
    updateOrderStatus: async (orderId: string, status: Order['status']) => {
      return result.updateAsync({ id: orderId, updates: { status } })
    },
    isAdding: false,
    isUpdating: result.isUpdating,
    isDeleting: false
  }
}
