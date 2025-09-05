/**
 * Hook simplifié pour la gestion unifiée des données
 * Version corrigée avec types statiques
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

// Types unifiés simplifiés
export interface UnifiedProduct {
  id: string
  name: string
  description?: string
  price: number
  cost_price?: number
  stock_quantity?: number
  status: string
  category?: string
  sku?: string
  image_urls?: string[]
  supplier_name?: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface UnifiedSupplier {
  id: string
  name: string
  supplier_type: string
  country?: string
  sector?: string
  connection_status: string
  product_count: number
  rating?: number
  user_id: string
  created_at: string
  updated_at: string
}

export interface UnifiedCustomer {
  id: string
  name: string
  email: string
  phone?: string
  status: string
  total_spent: number
  total_orders: number
  user_id: string
  created_at: string
  updated_at: string
}

// Hooks spécialisés pour chaque entité
export function useUnifiedProducts(filters?: any) {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['unified-products', user?.id, filters],
    queryFn: async () => {
      if (!user) return []
      
      let query = supabase
        .from('imported_products')
        .select('*')
        .eq('user_id', user.id)
      
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.category) {
        query = query.eq('category', filters.category)
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
      }
      
      query = query.order('created_at', { ascending: false })
      
      const { data, error } = await query
      if (error) throw error
      
      return data?.map((item: any): UnifiedProduct => ({
        id: item.id,
        name: item.name || 'Produit sans nom',
        description: item.description,
        price: item.price || 0,
        cost_price: item.cost_price,
        stock_quantity: item.stock_quantity,
        status: item.status || 'draft',
        category: item.category,
        sku: item.sku,
        image_urls: item.image_urls || [],
        supplier_name: item.supplier_name,
        user_id: item.user_id,
        created_at: item.created_at,
        updated_at: item.updated_at
      })) || []
    },
    enabled: !!user
  })

  const addMutation = useMutation({
    mutationFn: async (newItem: Partial<UnifiedProduct>) => {
      if (!user) throw new Error('Non authentifié')
      
      const { data, error } = await supabase
        .from('imported_products')
        .insert([{ ...newItem, user_id: user.id, name: newItem.name || 'Nouveau produit', price: newItem.price || 0 }])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-products'] })
      toast({
        title: "Succès",
        description: "Produit ajouté avec succès",
      })
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<UnifiedProduct> }) => {
      const { data, error } = await supabase
        .from('imported_products')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-products'] })
      toast({
        title: "Succès",
        description: "Produit mis à jour avec succès",
      })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('imported_products')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-products'] })
      toast({
        title: "Succès",
        description: "Produit supprimé avec succès",
      })
    }
  })

  const stats = {
    total: data.length,
    active: data.filter(item => item.status === 'active').length,
    inactive: data.filter(item => item.status === 'inactive').length,
    lowStock: data.filter(item => (item.stock_quantity || 0) < 10).length,
    totalValue: data.reduce((sum, item) => sum + ((item.price || 0) * (item.stock_quantity || 0)), 0)
  }

  return {
    data,
    stats,
    isLoading,
    error,
    add: addMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['unified-products'] })
  }
}

export function useUnifiedSuppliers(filters?: any) {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['unified-suppliers', user?.id, filters],
    queryFn: async () => {
      if (!user) return []
      
      let query = supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
      
      if (filters?.status) {
        query = query.eq('connection_status', filters.status)
      }
      
      query = query.order('created_at', { ascending: false })
      
      const { data, error } = await query
      if (error) throw error
      
      return data?.map((item: any): UnifiedSupplier => ({
        id: item.id,
        name: item.name,
        supplier_type: item.supplier_type || 'api',
        country: item.country,
        sector: item.sector,
        connection_status: item.connection_status || 'disconnected',
        product_count: item.product_count || 0,
        rating: item.rating,
        user_id: item.user_id,
        created_at: item.created_at,
        updated_at: item.updated_at
      })) || []
    },
    enabled: !!user
  })

  const stats = {
    total: data.length,
    connected: data.filter(item => item.connection_status === 'connected').length,
    totalProducts: data.reduce((sum, item) => sum + (item.product_count || 0), 0)
  }

  return {
    data,
    stats,
    isLoading,
    error,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['unified-suppliers'] })
  }
}

export function useUnifiedCustomers(filters?: any) {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['unified-customers', user?.id, filters],
    queryFn: async () => {
      if (!user) return []
      
      let query = supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
      
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      
      query = query.order('created_at', { ascending: false })
      
      const { data, error } = await query
      if (error) throw error
      
      return data?.map((item: any): UnifiedCustomer => ({
        id: item.id,
        name: item.name,
        email: item.email,
        phone: item.phone,
        status: item.status || 'active',
        total_spent: item.total_spent || 0,
        total_orders: item.total_orders || 0,
        user_id: item.user_id,
        created_at: item.created_at,
        updated_at: item.updated_at
      })) || []
    },
    enabled: !!user
  })

  const stats = {
    total: data.length,
    active: data.filter(item => item.status === 'active').length,
    totalRevenue: data.reduce((sum, item) => sum + (item.total_spent || 0), 0),
    avgOrderValue: data.length > 0 ? data.reduce((sum, item) => sum + (item.total_spent || 0), 0) / data.reduce((sum, item) => sum + (item.total_orders || 1), 1) : 0
  }

  return {
    data,
    stats,
    isLoading,
    error,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['unified-customers'] })
  }
}