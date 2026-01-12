/**
 * useCustomersUnified - Hook unifié pour la gestion des clients
 * Consolide: useCustomers, useCustomersOptimized, useRealCustomers, useUnifiedCustomers
 * 
 * Fonctionnalités:
 * - Recherche avancée
 * - Segmentation RFM (VIP, regular, new, inactive)
 * - Statistiques complètes
 * - Security monitoring intégré
 * - CRUD complet
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { CustomersService } from '@/services/customers.service'
import { fetchAllWithQuery } from '@/utils/supabaseUnlimited'

// ============= Types =============
export interface UnifiedCustomer {
  id: string
  name: string
  first_name?: string
  last_name?: string
  email: string
  phone?: string
  status: 'active' | 'inactive'
  total_spent: number
  total_orders: number
  last_order_date?: string
  address?: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
  }
  tags?: string[]
  notes?: string
  segment?: 'vip' | 'regular' | 'new' | 'inactive'
  user_id: string
  created_at: string
  updated_at: string
}

export interface CustomerFilters {
  search?: string
  segment?: 'vip' | 'regular' | 'new' | 'inactive'
  status?: 'active' | 'inactive'
}

export interface CustomerStats {
  total: number
  active: number
  inactive: number
  totalRevenue: number
  avgOrderValue: number
  avgLifetimeValue: number
  newCustomersThisMonth: number
  newCustomersLastMonth: number
  customerGrowth: number
}

export interface CustomerSegments {
  vip: UnifiedCustomer[]
  regular: UnifiedCustomer[]
  new: UnifiedCustomer[]
  inactive: UnifiedCustomer[]
}

export interface UseCustomersUnifiedOptions {
  filters?: CustomerFilters
}

// ============= Security Monitoring =============
async function monitorCustomerAccess(action: 'view' | 'create' | 'update' | 'delete', customerId?: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'customer_data_access',
      entity_type: 'customer',
      entity_id: customerId,
      description: `Customer ${action} action`,
      source: 'client'
    })
  } catch (error) {
    console.warn('Failed to log customer access:', error)
  }
}

// ============= Hook Principal =============
export function useCustomersUnified(options: UseCustomersUnifiedOptions = {}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const { filters } = options

  // ============= Query Principal =============
  const { data: customers = [], isLoading, error, refetch } = useQuery({
    queryKey: ['customers-unified', user?.id, filters],
    queryFn: async () => {
      if (!user) return []

      // Log security access
      await monitorCustomerAccess('view')
      
      // Fetch all customers (no limit)
      const { data: customersData } = await fetchAllWithQuery(async (offset, limit) => {
        let query = supabase
          .from('customers')
          .select('*')
          .eq('user_id', user.id)

        if (filters?.search) {
          query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
        }

        const { data, error } = await query
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)
        return { data, error }
      })
      
      if (!customersData || !Array.isArray(customersData)) {
        return []
      }
      
      // Normalize and add segment info
      const normalized = customersData.map((item: any): UnifiedCustomer => {
        const totalSpent = item.total_spent || 0
        const totalOrders = item.total_orders || 0
        
        // Determine segment
        let segment: UnifiedCustomer['segment'] = 'inactive'
        if (totalSpent > 1000) segment = 'vip'
        else if (totalSpent >= 100 && totalSpent <= 1000) segment = 'regular'
        else if (totalOrders < 2 && totalOrders > 0) segment = 'new'
        else if (totalOrders === 0) segment = 'inactive'

        return {
          id: item.id,
          name: `${item.first_name || ''} ${item.last_name || ''}`.trim() || item.email,
          first_name: item.first_name,
          last_name: item.last_name,
          email: item.email,
          phone: item.phone,
          status: totalOrders > 0 ? 'active' : 'inactive',
          total_spent: totalSpent,
          total_orders: totalOrders,
          last_order_date: item.last_order_date,
          address: item.address || {
            line1: item.address_line1,
            line2: item.address_line2,
            city: item.city,
            state: item.state,
            postal_code: item.postal_code,
            country: item.country
          },
          tags: item.tags,
          notes: item.notes,
          segment,
          user_id: item.user_id,
          created_at: item.created_at,
          updated_at: item.updated_at
        }
      })

      // Apply segment filter if specified
      if (filters?.segment) {
        return normalized.filter(c => c.segment === filters.segment)
      }

      return normalized
    },
    enabled: !!user,
    staleTime: 60 * 1000, // 1 minute cache
    gcTime: 5 * 60 * 1000,
    retry: 1
  })

  // ============= Segments =============
  const segments: CustomerSegments = {
    vip: customers.filter(c => c.segment === 'vip'),
    regular: customers.filter(c => c.segment === 'regular'),
    new: customers.filter(c => c.segment === 'new'),
    inactive: customers.filter(c => c.segment === 'inactive')
  }

  // ============= Stats =============
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const customersThisMonth = customers.filter(c => new Date(c.created_at) >= thisMonth)
  const customersLastMonth = customers.filter(c => 
    new Date(c.created_at) >= lastMonth && new Date(c.created_at) < thisMonth
  )

  const totalRevenue = customers.reduce((sum, c) => sum + c.total_spent, 0)
  const totalOrders = customers.reduce((sum, c) => sum + c.total_orders, 0)

  const stats: CustomerStats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    inactive: customers.filter(c => c.status === 'inactive').length,
    totalRevenue,
    avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    avgLifetimeValue: customers.length > 0 ? totalRevenue / customers.length : 0,
    newCustomersThisMonth: customersThisMonth.length,
    newCustomersLastMonth: customersLastMonth.length,
    customerGrowth: customersLastMonth.length > 0
      ? ((customersThisMonth.length - customersLastMonth.length) / customersLastMonth.length) * 100
      : 0
  }

  // ============= Mutations =============
  const addMutation = useMutation({
    mutationFn: async (newCustomer: Partial<UnifiedCustomer>) => {
      if (!user) throw new Error('Non authentifié')
      
      await monitorCustomerAccess('create')

      // Split name into first_name and last_name if provided
      let firstName = newCustomer.first_name
      let lastName = newCustomer.last_name
      
      if (newCustomer.name && (!firstName || !lastName)) {
        const nameParts = newCustomer.name.split(' ')
        firstName = firstName || nameParts[0] || ''
        lastName = lastName || nameParts.slice(1).join(' ') || ''
      }
      
      const { data, error } = await supabase
        .from('customers')
        .insert([{ 
          first_name: firstName,
          last_name: lastName,
          email: newCustomer.email,
          phone: newCustomer.phone,
          total_spent: newCustomer.total_spent || 0,
          total_orders: newCustomer.total_orders || 0,
          user_id: user.id 
        }])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      invalidateCustomerQueries()
      toast({ title: "Succès", description: "Client ajouté avec succès" })
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'ajouter le client", variant: "destructive" })
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<UnifiedCustomer> }) => {
      await monitorCustomerAccess('update', id)
      
      const dbUpdates: any = {}
      
      // Handle name splitting
      if (updates.name) {
        const nameParts = updates.name.split(' ')
        dbUpdates.first_name = nameParts[0] || ''
        dbUpdates.last_name = nameParts.slice(1).join(' ') || ''
      }
      if (updates.first_name !== undefined) dbUpdates.first_name = updates.first_name
      if (updates.last_name !== undefined) dbUpdates.last_name = updates.last_name
      if (updates.email !== undefined) dbUpdates.email = updates.email
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone
      if (updates.total_spent !== undefined) dbUpdates.total_spent = updates.total_spent
      if (updates.total_orders !== undefined) dbUpdates.total_orders = updates.total_orders
      if (updates.address !== undefined) dbUpdates.address = updates.address
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes

      const { data, error } = await supabase
        .from('customers')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      invalidateCustomerQueries()
      toast({ title: "Succès", description: "Client mis à jour" })
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le client", variant: "destructive" })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Non authentifié')
      await monitorCustomerAccess('delete', id)
      
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      invalidateCustomerQueries()
      toast({ title: "Succès", description: "Client supprimé" })
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer le client", variant: "destructive" })
    }
  })

  // ============= Helpers =============
  function invalidateCustomerQueries() {
    queryClient.invalidateQueries({ queryKey: ['customers-unified'] })
    queryClient.invalidateQueries({ queryKey: ['unified-customers'] })
    queryClient.invalidateQueries({ queryKey: ['customers'] })
    queryClient.invalidateQueries({ queryKey: ['real-customers'] })
    queryClient.invalidateQueries({ queryKey: ['customer-stats'] })
  }

  // ============= Return =============
  return {
    // Data
    customers,
    data: customers, // Alias for compatibility
    stats,
    segments,
    
    // Query states
    isLoading,
    error,
    
    // Mutations
    add: addMutation.mutate,
    addAsync: addMutation.mutateAsync,
    update: updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    delete: deleteMutation.mutate,
    deleteAsync: deleteMutation.mutateAsync,
    
    // Legacy aliases
    addCustomer: addMutation.mutate,
    updateCustomer: updateMutation.mutate,
    deleteCustomer: deleteMutation.mutate,
    createCustomer: addMutation.mutate,
    
    // Loading states
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isCreating: addMutation.isPending,
    
    // Utils
    refetch,
    invalidate: invalidateCustomerQueries,
    
    // Security
    monitorAccess: monitorCustomerAccess
  }
}

// ============= Hook for single customer =============
export function useCustomerUnified(id: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['customer-unified', id],
    queryFn: async () => {
      if (!user || !id) return null
      return CustomersService.getCustomer(id, user.id)
    },
    enabled: !!user && !!id
  })
}

// ============= Hook for customer stats only =============
export function useCustomerStatsUnified() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['customer-stats-unified', user?.id],
    queryFn: async () => {
      if (!user) return null
      return CustomersService.getCustomerStats(user.id)
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000
  })
}
