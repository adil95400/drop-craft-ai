/**
 * useProductsUnified - Hook unifié pour la gestion des produits
 * Consolide: useProducts, useProductsOptimized, useRealProducts, useUnifiedProducts
 * 
 * Fonctionnalités:
 * - Pagination automatique (gère plus de 1000 produits)
 * - Agrégation multi-tables (products, imported_products, catalog_products)
 * - Opérations bulk (suppression, mise à jour de statut)
 * - Optimisation AI
 * - Filtres avancés
 * - Cache optimisé avec staleTime
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { fetchAllWithQuery } from '@/utils/supabaseUnlimited'
import { ProductsService } from '@/services/products.service'

// ============= Types =============
export interface UnifiedProduct {
  id: string
  name: string
  title?: string // Alias for DB compatibility
  description?: string
  price: number
  cost_price?: number
  stock_quantity?: number
  status: 'active' | 'inactive' | 'draft' | 'archived'
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
  source?: 'products' | 'imported' | 'catalog'
  user_id: string
  created_at: string
  updated_at: string
  _totalCount?: number // For pagination info
}

export interface ProductFilters {
  status?: 'active' | 'inactive' | 'draft' | 'archived'
  category?: string
  search?: string
  low_stock?: boolean
  page?: number
  pageSize?: number
}

export interface ProductStats {
  total: number
  active: number
  inactive: number
  draft: number
  archived: number
  lowStock: number
  totalValue: number
  avgPrice: number
  totalMargin: number
  totalCount: number // Total across all pages
}

export interface UseProductsUnifiedOptions {
  filters?: ProductFilters
  includeCatalog?: boolean  // Include catalog_products table
  includeImported?: boolean // Include imported_products table
  paginationEnabled?: boolean
}

// ============= Hook Principal =============
export function useProductsUnified(options: UseProductsUnifiedOptions = {}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const { 
    filters, 
    includeCatalog = false, 
    includeImported = false,
    paginationEnabled = false 
  } = options
  
  const page = filters?.page || 0
  const pageSize = filters?.pageSize || 100

  // ============= Query Principal =============
  const { data: products = [], isLoading, error, refetch } = useQuery({
    queryKey: ['products-unified', user?.id, filters, includeCatalog, includeImported],
    queryFn: async () => {
      if (!user) return []
      
      const results: UnifiedProduct[] = []
      
      // 1. Products table (primary source)
      if (paginationEnabled) {
        // Use paginated query
        let query = supabase
          .from('products')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)

        // Apply filters
        if (filters?.status) query = query.eq('status', filters.status)
        if (filters?.category) query = query.eq('category', filters.category)
        if (filters?.search) {
          query = query.or(`title.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
        }
        if (filters?.low_stock) query = query.lt('stock_quantity', 10)

        const { data: productsData, count } = await query
          .order('created_at', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1)

        if (productsData) {
          results.push(...normalizeProducts(productsData, 'products', count || 0))
        }
      } else {
        // Fetch all products (no limit)
        const { data: productsData } = await fetchAllWithQuery(async (offset, limit) => {
          let query = supabase
            .from('products')
            .select('*')
            .eq('user_id', user.id)

          if (filters?.status) query = query.eq('status', filters.status)
          if (filters?.category) query = query.eq('category', filters.category)

          const { data, error } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)
          return { data, error }
        })
        
        if (productsData && Array.isArray(productsData)) {
          results.push(...normalizeProducts(productsData, 'products'))
        }
      }
      
      // 2. Imported products table (optional)
      if (includeImported) {
        const { data: importedData } = await fetchAllWithQuery(async (offset, limit) => {
          const { data, error } = await supabase
            .from('imported_products')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)
          return { data, error }
        })
        
        if (importedData && Array.isArray(importedData)) {
          results.push(...importedData.map((item: any): UnifiedProduct => ({
            id: item.id,
            name: item.product_id || 'Produit importé',
            description: '',
            price: item.price || 0,
            cost_price: undefined,
            stock_quantity: undefined,
            status: (item.status as any) || 'draft',
            category: item.category,
            sku: '',
            image_url: undefined,
            image_urls: [],
            supplier: item.source_platform,
            supplier_name: item.source_platform,
            profit_margin: undefined,
            tags: [],
            source: 'imported',
            user_id: item.user_id,
            created_at: item.created_at,
            updated_at: item.created_at
          })))
        }
      }
      
      // 3. Catalog products table (optional)
      if (includeCatalog) {
        const { data: catalogData } = await fetchAllWithQuery(async (offset, limit) => {
          const { data, error } = await supabase
            .from('catalog_products')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)
          return { data, error }
        })
        
        if (catalogData && Array.isArray(catalogData)) {
          results.push(...catalogData.map((item: any): UnifiedProduct => ({
            id: item.id,
            name: item.title || 'Produit catalogue',
            description: item.description,
            price: item.price || 0,
            cost_price: item.compare_at_price,
            stock_quantity: undefined,
            status: (item.status as any) || 'active',
            category: item.category,
            sku: '',
            image_url: item.image_urls?.[0],
            image_urls: item.image_urls || [],
            supplier: item.supplier_name,
            supplier_name: item.supplier_name,
            profit_margin: undefined,
            tags: [],
            source: 'catalog',
            user_id: item.user_id,
            created_at: item.created_at,
            updated_at: item.updated_at
          })))
        }
      }
      
      // Apply client-side search filter (for non-paginated mode)
      let filtered = results
      if (!paginationEnabled && filters?.search) {
        const searchLower = filters.search.toLowerCase()
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(searchLower) ||
          p.sku?.toLowerCase().includes(searchLower)
        )
      }
      
      return filtered
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds cache
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    retry: 1
  })

  // ============= Mutations =============
  const addMutation = useMutation({
    mutationFn: async (newProduct: Partial<UnifiedProduct>) => {
      if (!user) throw new Error('Non authentifié')
      
      const { data, error } = await supabase
        .from('products')
        .insert([{ 
          title: newProduct.name || newProduct.title || 'Nouveau produit',
          description: newProduct.description,
          price: newProduct.price || 0,
          cost_price: newProduct.cost_price,
          stock_quantity: newProduct.stock_quantity,
          status: newProduct.status || 'draft',
          category: newProduct.category,
          sku: newProduct.sku,
          image_url: newProduct.image_url,
          tags: newProduct.tags,
          user_id: user.id 
        }])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      invalidateProductQueries()
      toast({ title: "Succès", description: "Produit ajouté avec succès" })
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'ajouter le produit", variant: "destructive" })
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<UnifiedProduct> }) => {
      const dbUpdates: any = {}
      if (updates.name) dbUpdates.title = updates.name
      if (updates.title) dbUpdates.title = updates.title
      if (updates.description !== undefined) dbUpdates.description = updates.description
      if (updates.price !== undefined) dbUpdates.price = updates.price
      if (updates.cost_price !== undefined) dbUpdates.cost_price = updates.cost_price
      if (updates.stock_quantity !== undefined) dbUpdates.stock_quantity = updates.stock_quantity
      if (updates.status) dbUpdates.status = updates.status
      if (updates.category !== undefined) dbUpdates.category = updates.category
      if (updates.sku !== undefined) dbUpdates.sku = updates.sku
      if (updates.image_url !== undefined) dbUpdates.image_url = updates.image_url
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags

      const { data, error } = await supabase
        .from('products')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      invalidateProductQueries()
      toast({ title: "Succès", description: "Produit mis à jour" })
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le produit", variant: "destructive" })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Non authentifié')

      // Try to delete from all product tables
      const deletePromises = [
        supabase.from('products').delete().eq('id', id).eq('user_id', user.id),
        supabase.from('imported_products').delete().eq('id', id).eq('user_id', user.id) as any,
        supabase.from('catalog_products').delete().eq('id', id).eq('user_id', user.id) as any
      ]

      const results = await Promise.allSettled(deletePromises)
      const successCount = results.filter(r => r.status === 'fulfilled' && !(r.value as any).error).length
      
      if (successCount === 0) {
        throw new Error('Impossible de supprimer le produit')
      }
    },
    onSuccess: () => {
      invalidateProductQueries()
      toast({ title: "Succès", description: "Produit supprimé" })
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer le produit", variant: "destructive" })
    }
  })

  // Bulk operations
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!user) throw new Error('Non authentifié')
      return ProductsService.bulkDelete(ids, user.id)
    },
    onSuccess: () => {
      invalidateProductQueries()
      toast({ title: "Succès", description: "Produits supprimés" })
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer les produits", variant: "destructive" })
    }
  })

  const bulkUpdateStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      if (!user) throw new Error('Non authentifié')
      return ProductsService.bulkUpdateStatus(ids, user.id, status)
    },
    onSuccess: () => {
      invalidateProductQueries()
      toast({ title: "Succès", description: "Statuts mis à jour" })
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre à jour les statuts", variant: "destructive" })
    }
  })

  // AI Optimization
  const optimizeMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Non authentifié')
      return ProductsService.optimizeProduct(id, user.id)
    },
    onSuccess: () => {
      invalidateProductQueries()
      toast({ title: "Succès", description: "Produit optimisé par IA" })
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'optimiser le produit", variant: "destructive" })
    }
  })

  // ============= Helpers =============
  function invalidateProductQueries() {
    queryClient.invalidateQueries({ queryKey: ['products-unified'] })
    queryClient.invalidateQueries({ queryKey: ['unified-products'] })
    queryClient.invalidateQueries({ queryKey: ['products'] })
    queryClient.invalidateQueries({ queryKey: ['real-products'] })
    queryClient.invalidateQueries({ queryKey: ['product-stats'] })
  }

  // ============= Stats =============
  const stats: ProductStats = {
    total: products.length,
    active: products.filter(item => item.status === 'active').length,
    inactive: products.filter(item => item.status === 'inactive').length,
    draft: products.filter(item => item.status === 'draft').length,
    archived: products.filter(item => item.status === 'archived').length,
    lowStock: products.filter(item => (item.stock_quantity || 0) < 10).length,
    totalValue: products.reduce((sum, item) => sum + ((item.price || 0) * (item.stock_quantity || 1)), 0),
    avgPrice: products.length > 0 
      ? products.reduce((sum, item) => sum + (item.price || 0), 0) / products.length 
      : 0,
    totalMargin: products.reduce((sum, item) => {
      if (item.cost_price && item.price) {
        return sum + (item.price - item.cost_price)
      }
      return sum
    }, 0),
    totalCount: (products[0] as any)?._totalCount || products.length
  }

  // ============= Return =============
  return {
    // Data
    products,
    data: products, // Alias for compatibility
    stats,
    
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
    addProduct: addMutation.mutate,
    updateProduct: updateMutation.mutate,
    deleteProduct: deleteMutation.mutate,
    createProduct: addMutation.mutate,
    
    // Bulk operations
    bulkDelete: bulkDeleteMutation.mutate,
    bulkUpdateStatus: bulkUpdateStatusMutation.mutate,
    
    // AI features
    optimize: optimizeMutation.mutate,
    optimizeProduct: optimizeMutation.mutate,
    
    // Loading states
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isCreating: addMutation.isPending,
    isBulkDeleting: bulkDeleteMutation.isPending,
    isBulkUpdating: bulkUpdateStatusMutation.isPending,
    isOptimizing: optimizeMutation.isPending,
    
    // Utils
    refetch,
    invalidate: invalidateProductQueries
  }
}

// ============= Helper Functions =============
function normalizeProducts(data: any[], source: 'products' | 'imported' | 'catalog', totalCount?: number): UnifiedProduct[] {
  return data.map((item: any): UnifiedProduct => ({
    id: item.id,
    name: item.title || item.name || 'Produit sans nom',
    title: item.title,
    description: item.description,
    price: item.price || 0,
    cost_price: item.cost_price,
    stock_quantity: item.stock_quantity,
    status: (item.status || 'draft') as UnifiedProduct['status'],
    category: item.category,
    sku: item.sku,
    image_url: item.image_url,
    image_urls: Array.isArray(item.images) ? item.images : [],
    supplier: item.supplier,
    supplier_name: item.supplier,
    profit_margin: item.cost_price && item.price 
      ? ((item.price - item.cost_price) / item.price * 100) 
      : undefined,
    tags: item.tags || [],
    seo_title: item.seo_title,
    seo_description: item.seo_description,
    seo_keywords: item.seo_keywords || [],
    source,
    user_id: item.user_id,
    created_at: item.created_at,
    updated_at: item.updated_at,
    _totalCount: totalCount
  }))
}

// ============= Hook for single product =============
export function useProductUnified(id: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['product-unified', id],
    queryFn: async () => {
      if (!user || !id) return null
      return ProductsService.getProduct(id, user.id)
    },
    enabled: !!user && !!id
  })
}
