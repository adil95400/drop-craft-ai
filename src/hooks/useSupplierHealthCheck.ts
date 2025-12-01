import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useQuery } from '@tanstack/react-query'

export interface HealthCheckResult {
  supplierId: string
  supplierName: string
  status: 'healthy' | 'degraded' | 'down'
  responseTime: number
  lastSync: string | null
  productCount: number
  errors: string[]
}

export function useSupplierHealthCheck(supplierId?: string) {
  const [isChecking, setIsChecking] = useState(false)

  const checkHealth = async (targetSupplierId: string): Promise<HealthCheckResult> => {
    setIsChecking(true)
    try {
      const { data, error } = await supabase.functions.invoke('supplier-health-check', {
        body: { supplierId: targetSupplierId }
      })

      if (error) throw error

      return data.result
    } finally {
      setIsChecking(false)
    }
  }

  const healthQuery = useQuery({
    queryKey: ['supplier-health', supplierId],
    queryFn: () => checkHealth(supplierId!),
    enabled: !!supplierId,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 4 * 60 * 1000 // Consider stale after 4 minutes
  })

  return {
    checkHealth,
    isChecking,
    health: healthQuery.data,
    isLoading: healthQuery.isLoading,
    error: healthQuery.error,
    refetch: healthQuery.refetch
  }
}
