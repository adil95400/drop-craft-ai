// DEPRECATED: Use useCustomersUnified instead
// This file is kept for backward compatibility only
import { useCustomersUnified, useCustomerStatsUnified, type UnifiedCustomer } from './unified/useCustomersUnified'

export type Customer = UnifiedCustomer

// Backward compatibility wrapper
export function useCustomers(search?: string) {
  console.warn('[DEPRECATED] useCustomers - utilisez useCustomersUnified à la place')
  const result = useCustomersUnified({ filters: { search } })
  
  return {
    data: result.data,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch
  }
}

export function useUpdateCustomer() {
  const result = useCustomersUnified()
  
  return {
    mutate: result.update,
    mutateAsync: result.updateAsync,
    isPending: result.isUpdating
  }
}

export function useCustomerStats() {
  const result = useCustomerStatsUnified()
  
  return {
    data: result.data,
    isLoading: result.isLoading
  }
}
