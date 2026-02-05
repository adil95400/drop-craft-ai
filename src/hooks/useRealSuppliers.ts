/**
 * @deprecated Use useSuppliersUnified from '@/hooks/unified' instead
 * This file is kept for backward compatibility and will be removed in a future version
 */
import { useSuppliersUnified, UnifiedSupplier } from '@/hooks/unified'

// Re-export Supplier type for backward compatibility
export interface Supplier {
  id: string
  name: string
  website?: string
  country?: string
  status: 'active' | 'inactive'
  rating?: number
  api_endpoint?: string
  user_id: string
  created_at: string
  updated_at: string
  credentials_updated_at?: string
  last_access_at?: string
  access_count?: number
  has_api_key?: boolean
  has_encrypted_credentials?: boolean
  contact_email_masked?: string
  contact_phone_masked?: string
}

export const useRealSuppliers = (filters?: any) => {
  const result = useSuppliersUnified({
    category: filters?.category,
    status: filters?.status,
    search: filters?.search
  })

  // Map UnifiedSupplier to legacy Supplier format
  const suppliers: Supplier[] = result.suppliers.map((s: UnifiedSupplier) => ({
    id: s.id,
    name: s.name,
    website: s.website,
    country: s.country,
    status: s.status === 'verified' ? 'active' as const : 'inactive' as const,
    rating: s.rating,
    api_endpoint: s.api_endpoint,
    user_id: s.user_id,
    created_at: s.created_at,
    updated_at: s.updated_at,
    credentials_updated_at: s.credentials_updated_at,
    last_access_at: s.last_access_at,
    access_count: s.access_count,
    has_api_key: false,
    has_encrypted_credentials: false
  }))

  const stats = {
    total: suppliers.length,
    active: suppliers.filter(s => s.status === 'active').length,
    inactive: suppliers.filter(s => s.status === 'inactive').length,
    averageRating: suppliers.length > 0 
      ? suppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / suppliers.length 
      : 0,
    topCountries: suppliers.reduce((acc: Record<string, number>, supplier) => {
      if (supplier.country) {
        acc[supplier.country] = (acc[supplier.country] || 0) + 1
      }
      return acc
    }, {})
  }

  return {
    suppliers,
    stats,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
    addSupplier: async (_data: any) => { result.refetch() },
    updateSupplier: () => {},
    deleteSupplier: async () => {},
    isAdding: false,
    isUpdating: false,
    isDeleting: false
  }
}
