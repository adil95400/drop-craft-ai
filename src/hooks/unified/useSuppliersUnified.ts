/**
 * useSuppliersUnified - Hook unifié pour les fournisseurs
 * Reads directly from the suppliers table
 */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'

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

function mapSupplier(item: any): UnifiedSupplier {
  return {
    id: item.id,
    name: item.name,
    display_name: item.name,
    description: item.description,
    supplier_type: item.supplier_type || item.api_type || 'api',
    category: item.sector || 'General',
    country: item.country,
    sector: item.sector,
    status: item.status || 'active',
    connection_status: item.status === 'active' ? 'connected' : 'disconnected',
    product_count: item.product_count || 0,
    rating: item.rating || 0,
    success_rate: 100,
    error_count: 0,
    access_count: 0,
    is_premium: item.is_featured || false,
    tags: item.tags || [],
    user_id: item.user_id,
    created_at: item.created_at,
    updated_at: item.updated_at,
    logo_url: item.logo_url,
    website: item.website,
    api_endpoint: item.api_endpoint,
    last_sync_at: item.last_sync_at,
  }
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
      
      const { data: items, error: dbError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (dbError) {
        console.error('Error fetching suppliers:', dbError)
        throw dbError
      }

      let result = (items || []).map(mapSupplier)

      if (filters?.category) {
        result = result.filter(s => s.category === filters.category)
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase()
        result = result.filter(s => s.name.toLowerCase().includes(q))
      }
      if (filters?.status) {
        result = result.filter(s => s.status === filters.status)
      }

      return result
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
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
