// DEPRECATED: Use useUnifiedOrders instead
// This file is kept for backward compatibility only
import { useUnifiedOrders } from './useUnifiedOrders'

export const useOrders = () => {
  const result = useUnifiedOrders()

  return {
    orders: result.data,
    stats: result.stats,
    isLoading: result.isLoading,
    error: result.error,
    updateOrderStatus: result.update,
    isUpdating: result.isUpdating
  }
}