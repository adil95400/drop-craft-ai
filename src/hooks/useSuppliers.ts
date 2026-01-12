/**
 * @deprecated Use useSuppliersUnified from '@/hooks/unified' instead
 * This file is kept for backward compatibility only
 */
import { useSuppliersUnified, UnifiedSupplier } from '@/hooks/unified'
import { useToast } from '@/hooks/use-toast'

export type Supplier = UnifiedSupplier

export interface SupplierTemplate {
  id: string
  name: string
  displayName: string
  description: string
  category: string
  status: 'available' | 'beta' | 'coming_soon'
  authType: 'api_key' | 'oauth' | 'credentials' | 'none'
  logo?: string
  features: {
    products: boolean
    inventory: boolean
    orders: boolean
    webhooks: boolean
  }
  rateLimits: {
    requestsPerMinute: number
    requestsPerHour: number
  }
  setupComplexity: 'easy' | 'medium' | 'advanced'
}

export interface CreateSupplierData {
  name: string
  supplier_type: 'api' | 'email' | 'csv' | 'xml' | 'ftp'
  country?: string
  sector?: string
  logo_url?: string
  website?: string
  description?: string
  api_endpoint?: string
  sync_frequency?: 'daily' | 'weekly' | 'manual' | 'hourly'
}

// Backward compatibility wrapper
export function useSuppliers(filters?: any) {
  console.warn('[DEPRECATED] useSuppliers - utilisez useSuppliersUnified de @/hooks/unified')
  
  const { toast } = useToast()
  const result = useSuppliersUnified(filters)

  const connectSupplier = async (template: SupplierTemplate, credentials: any) => {
    toast({
      title: "Info",
      description: "Utilisez useSuppliersUnified pour gérer les fournisseurs",
    })
    return false
  }

  const disconnectSupplier = async (supplierId: string) => {
    toast({
      title: "Info",
      description: "Utilisez useSuppliersUnified pour gérer les fournisseurs",
    })
  }

  const syncSupplier = async (supplierId: string) => {
    toast({
      title: "Info",
      description: "Utilisez useSuppliersUnified pour gérer les fournisseurs",
    })
  }

  const updateSupplierCredentials = async (supplierId: string, credentials: any) => {
    toast({
      title: "Info",
      description: "Utilisez useSuppliersUnified pour gérer les fournisseurs",
    })
  }

  return {
    suppliers: result.data,
    loading: result.isLoading,
    isLoading: result.isLoading,
    error: result.error,
    stats: result.stats,
    connectSupplier,
    disconnectSupplier,
    syncSupplier,
    updateSupplierCredentials,
    refetch: result.refetch,
    createSupplier: connectSupplier,
    updateSupplier: updateSupplierCredentials,
    deleteSupplier: disconnectSupplier
  }
}
