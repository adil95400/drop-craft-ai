import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { fetchAllWithQuery } from '@/utils/supabaseUnlimited'

export interface UnifiedSupplier {
  id: string
  name: string
  display_name: string
  description?: string
  supplier_type: string
  category: string
  country?: string
  sector?: string
  status: string
  connection_status: string
  product_count: number
  rating: number
  success_rate: number
  error_count: number
  access_count: number
  is_premium: boolean
  tags: string[]
  user_id: string
  created_at: string
  updated_at: string
  logo_url?: string
  website?: string
  api_endpoint?: string
  sync_frequency?: string
  last_sync_at?: string
  last_access_at?: string
  credentials_updated_at?: string
}

export function useSuppliersUnified(filters?: {
  category?: string
  status?: string
  search?: string
}) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ['unified-suppliers', user?.id, filters],
    queryFn: async () => {
      if (!user) return []
      
      // Suppliers - NO LIMIT
      const { data: suppliersData } = await fetchAllWithQuery(async (offset, limit) => {
        const { data, error } = await supabase
          .from('premium_suppliers')
          .select('*')
          .order('name')
          .range(offset, offset + limit - 1)
        return { data, error }
      })

      if (!suppliersData || !Array.isArray(suppliersData)) {
        return []
      }
      
      let result = suppliersData.map((item: any): UnifiedSupplier => ({
        id: item.id,
        name: item.name,
        display_name: item.name,
        description: item.description,
        supplier_type: item.api_type || 'api',
        category: item.category || 'General',
        country: item.country,
        sector: item.category,
        status: item.is_verified ? 'verified' : 'pending',
        connection_status: item.is_verified ? 'connected' : 'disconnected',
        product_count: 0,
        rating: item.rating || 0,
        success_rate: 100,
        error_count: 0,
        access_count: 0,
        is_premium: item.is_featured || false,
        tags: [],
        user_id: user.id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        logo_url: item.logo_url,
        website: item.website
      }))

      // Apply filters
      if (filters?.category) {
        result = result.filter(s => s.category === filters.category)
      }
      if (filters?.status) {
        result = result.filter(s => s.status === filters.status)
      }
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase()
        result = result.filter(s => 
          s.name.toLowerCase().includes(searchLower) ||
          s.description?.toLowerCase().includes(searchLower)
        )
      }

      return result
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  })

  const stats = {
    total: data.length,
    connected: data.filter(item => item.connection_status === 'connected').length,
    totalProducts: data.reduce((sum, item) => sum + (item.product_count || 0), 0),
    premium: data.filter(item => item.is_premium).length
  }

  return {
    suppliers: data,
    data,
    stats,
    isLoading,
    error,
    refetch: () => {
      refetch()
      queryClient.invalidateQueries({ queryKey: ['unified-suppliers'] })
    }
  }
}
