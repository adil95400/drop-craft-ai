// DEPRECATED: Use useUnifiedSuppliers instead
// This file is kept for backward compatibility only
import { useUnifiedSuppliers as useUnifiedSuppliersBase } from './useUnifiedData'
import { useToast } from '@/hooks/use-toast'

export interface Supplier {
  id: string
  user_id: string
  name: string
  display_name: string
  description?: string
  category: string
  logo_url?: string
  website?: string
  country?: string
  supplier_type: string
  sector?: string
  status: string
  connection_status: string
  product_count: number
  tags: string[]
  rating: number
  success_rate: number
  error_count: number
  last_sync_at?: string
  last_access_at?: string
  credentials_updated_at?: string
  access_count: number
  is_premium: boolean
  created_at: string
  updated_at: string
  api_endpoint?: string
  sync_frequency?: string
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

// Backward compatibility wrapper
export function useSuppliers() {
  const { toast } = useToast()
  const result = useUnifiedSuppliersBase()

  const connectSupplier = async (template: SupplierTemplate, credentials: any) => {
    toast({
      title: "Info",
      description: "Utilisez useUnifiedSuppliers pour gérer les fournisseurs",
    })
    return false
  }

  const disconnectSupplier = async (supplierId: string) => {
    toast({
      title: "Info",
      description: "Utilisez useUnifiedSuppliers pour gérer les fournisseurs",
    })
  }

  const syncSupplier = async (supplierId: string) => {
    toast({
      title: "Info",
      description: "Utilisez useUnifiedSuppliers pour gérer les fournisseurs",
    })
  }

  const updateSupplierCredentials = async (supplierId: string, credentials: any) => {
    toast({
      title: "Info",
      description: "Utilisez useUnifiedSuppliers pour gérer les fournisseurs",
    })
  }

  return {
    suppliers: result.data,
    loading: result.isLoading,
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