/**
 * @deprecated Use useOrdersUnified from '@/hooks/unified' instead
 * This file is kept for backward compatibility only
 */
import { useOrdersUnified, UnifiedOrder } from '@/hooks/unified'

export type Order = UnifiedOrder

export const useOrders = () => {
  console.warn('[DEPRECATED] useOrders - utilisez useOrdersUnified de @/hooks/unified')
  
  const result = useOrdersUnified()

  return {
    orders: result.data,
    stats: result.stats,
    isLoading: result.isLoading,
    error: result.error,
    updateOrderStatus: result.update,
    isUpdating: result.isUpdating
  }
}
