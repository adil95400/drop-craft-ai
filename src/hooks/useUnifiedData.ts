/**
 * Hook simplifié pour la gestion unifiée des données
 * Version corrigée avec types statiques
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

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
  image_url?: string
  image_urls?: string[]
  supplier?: string
  supplier_name?: string
  profit_margin?: number
  tags?: string[]
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
  user_id: string
  created_at: string
  updated_at: string
}

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
      
      // Consolidate from all product sources
      const results: UnifiedProduct[] = []
      
      // 1. Products table
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1000) as { data: any[] | null; error: any }
      
      if (productsData) {
        results.push(...productsData.map((item: any): UnifiedProduct => ({
          id: item.id,
          name: item.title || 'Produit sans nom',
          description: item.description,
          price: item.price || 0,
          cost_price: item.cost_price,
          stock_quantity: item.stock_quantity,
          status: item.status || 'draft',
          category: item.category,
          sku: item.sku,
          image_url: item.image_url,
          image_urls: item.images ? (Array.isArray(item.images) ? item.images : []) : [],
          supplier: item.supplier,
          supplier_name: item.supplier,
          profit_margin: item.profit_margin,
          tags: item.tags || [],
          seo_title: item.seo_title,
          seo_description: item.seo_description,
          seo_keywords: item.seo_keywords || [],
          user_id: item.user_id,
          created_at: item.created_at,
          updated_at: item.updated_at
        })))
      }
      
      // 2. Imported products table
      const { data: importedData } = await supabase
        .from('imported_products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1000) as { data: any[] | null; error: any }
      
      if (importedData) {
        results.push(...importedData.map((item: any): UnifiedProduct => ({
          id: item.id,
          name: item.product_id || 'Produit importé',
          description: '',
          price: item.price || 0,
          cost_price: undefined,
          stock_quantity: undefined,
          status: item.status || 'draft',
          category: item.category,
          sku: '',
          image_url: undefined,
          image_urls: [],
          supplier: item.source_platform,
          supplier_name: item.source_platform,
          profit_margin: undefined,
          tags: [],
          seo_title: undefined,
          seo_description: undefined,
          seo_keywords: [],
          user_id: item.user_id,
          created_at: item.created_at,
          updated_at: item.created_at
        })))
      }
      
      // 3. Catalog products table
      const { data: catalogData } = await supabase
        .from('catalog_products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1000) as { data: any[] | null; error: any }
      
      if (catalogData) {
        results.push(...catalogData.map((item: any): UnifiedProduct => ({
          id: item.id,
          name: item.title || 'Produit catalogue',
          description: item.description,
          price: item.price || 0,
          cost_price: item.compare_at_price,
          stock_quantity: undefined,
          status: item.status || 'active',
          category: item.category,
          sku: '',
          image_url: item.image_urls?.[0],
          image_urls: item.image_urls || [],
          supplier: item.supplier_name,
          supplier_name: item.supplier_name,
          profit_margin: undefined,
          tags: [],
          seo_title: undefined,
          seo_description: undefined,
          seo_keywords: [],
          user_id: item.user_id,
          created_at: item.created_at,
          updated_at: item.updated_at
        })))
      }
      
      // Apply filters
      let filtered = results
      
      if (filters?.status) {
        filtered = filtered.filter(p => p.status === filters.status)
      }
      if (filters?.category) {
        filtered = filtered.filter(p => p.category === filters.category)
      }
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase()
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(searchLower) ||
          p.sku?.toLowerCase().includes(searchLower)
        )
      }
      
      return filtered
    },
    enabled: !!user
  })

  const addMutation = useMutation({
    mutationFn: async (newItem: Partial<UnifiedProduct>) => {
      if (!user) throw new Error('Non authentifié')
      
      const { data, error } = await supabase
        .from('products')
        .insert([{ 
          title: newItem.name || 'Nouveau produit',
          description: newItem.description,
          price: newItem.price || 0,
          cost_price: newItem.cost_price,
          stock_quantity: newItem.stock_quantity,
          status: newItem.status || 'draft',
          category: newItem.category,
          sku: newItem.sku,
          image_url: newItem.image_url,
          user_id: user.id 
        }])
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
        .from('products')
        .update({
          title: updates.name,
          description: updates.description,
          price: updates.price,
          cost_price: updates.cost_price,
          stock_quantity: updates.stock_quantity,
          status: updates.status,
          category: updates.category,
          sku: updates.sku,
          image_url: updates.image_url
        })
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
        .from('products')
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
  const queryClient = useQueryClient()
  
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['unified-suppliers', user?.id, filters],
    queryFn: async () => {
      if (!user) return []
      
      const { data, error } = await supabase
        .from('premium_suppliers')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching suppliers:', error);
        return [];
      }
      
      return (data || []).map((item: any): UnifiedSupplier => ({
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
        updated_at: item.updated_at
      }));
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
  const queryClient = useQueryClient()
  
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['unified-customers', user?.id, filters],
    queryFn: async () => {
      if (!user) return []
      
      let query = supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
      
      query = query.order('created_at', { ascending: false })
      
      const { data, error } = await query
      if (error) throw error
      
      return (data || []).map((item: any): UnifiedCustomer => ({
        id: item.id,
        name: `${item.first_name || ''} ${item.last_name || ''}`.trim() || item.email,
        email: item.email,
        phone: item.phone,
        status: (item.total_orders || 0) > 0 ? 'active' : 'inactive',
        total_spent: item.total_spent || 0,
        total_orders: item.total_orders || 0,
        user_id: item.user_id,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
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
