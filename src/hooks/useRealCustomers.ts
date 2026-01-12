/**
 * @deprecated Use useCustomersUnified from '@/hooks/unified' instead
 * This file is kept for backward compatibility and will be removed in a future version
 */
import { useCustomersUnified, UnifiedCustomer } from '@/hooks/unified'

// Re-export Customer type for backward compatibility
export type Customer = UnifiedCustomer

export const useRealCustomers = (filters?: any) => {
  console.warn('[DEPRECATED] useRealCustomers - utilisez useCustomersUnified de @/hooks/unified')
  
  const result = useCustomersUnified({
    filters: {
      search: filters?.search,
      segment: filters?.segment
    }
  })

  return {
    customers: result.customers,
    stats: {
      ...result.stats,
      averageOrderValue: result.stats.avgOrderValue
    },
    isLoading: result.isLoading,
    error: result.error,
    addCustomer: result.add,
    updateCustomer: result.update,
    isAdding: result.isAdding,
    isUpdating: result.isUpdating
  }
}
