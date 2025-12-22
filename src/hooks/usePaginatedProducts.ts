import { useQuery, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useCallback, useMemo, useState } from 'react'

export interface ProductFilters {
  search?: string
  status?: 'active' | 'inactive' | 'all'
  category?: string
  low_stock?: boolean
  minPrice?: number
  maxPrice?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedProductsResult {
  data: any[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface UsePaginatedProductsOptions {
  pageSize?: number
  initialPage?: number
  filters?: ProductFilters
  enabled?: boolean
}

/**
 * Hook optimisé pour la pagination côté serveur des produits
 * Gère le cache, la mise en mémoire des pages précédentes, et la pagination efficace
 */
export function usePaginatedProducts(options: UsePaginatedProductsOptions = {}) {
  const {
    pageSize = 50,
    initialPage = 1,
    filters = {},
    enabled = true
  } = options

  const [currentPage, setCurrentPage] = useState(initialPage)

  // Clé de cache unique basée sur les filtres
  const queryKey = useMemo(() => [
    'paginated-products',
    {
      page: currentPage,
      pageSize,
      ...filters
    }
  ], [currentPage, pageSize, filters])

  const { data, isLoading, error, isFetching, refetch } = useQuery({
    queryKey,
    queryFn: async (): Promise<PaginatedProductsResult> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const offset = (currentPage - 1) * pageSize

      // Build query with filters
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }
      if (filters.low_stock) {
        query = query.lt('stock_quantity', 10)
      }
      if (filters.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice)
      }
      if (filters.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice)
      }

      // Sorting
      const sortBy = filters.sortBy || 'created_at'
      const sortOrder = filters.sortOrder || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Pagination
      query = query.range(offset, offset + pageSize - 1)

      const { data: products, error: queryError, count } = await query

      if (queryError) throw queryError

      const totalCount = count || 0
      const totalPages = Math.ceil(totalCount / pageSize)

      // Normalize products
      const normalizedProducts = (products || []).map((p: any) => ({
        id: p.id,
        name: p.title || p.name || 'Produit sans nom',
        description: p.description,
        price: p.price || 0,
        cost_price: p.cost_price,
        status: p.status === 'active' ? 'active' : 'inactive',
        stock_quantity: p.stock_quantity || 0,
        sku: p.sku,
        category: p.category,
        image_url: p.image_url,
        images: p.images,
        profit_margin: p.cost_price && p.price ? ((p.price - p.cost_price) / p.price * 100) : undefined,
        user_id: p.user_id,
        created_at: p.created_at,
        updated_at: p.updated_at
      }))

      return {
        data: normalizedProducts,
        totalCount,
        page: currentPage,
        pageSize,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1
      }
    },
    enabled,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in garbage collector for 5 minutes
    placeholderData: keepPreviousData, // Keep previous data while loading new page
  })

  // Navigation handlers
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && (!data || page <= data.totalPages)) {
      setCurrentPage(page)
    }
  }, [data])

  const nextPage = useCallback(() => {
    if (data?.hasNextPage) {
      setCurrentPage(prev => prev + 1)
    }
  }, [data])

  const prevPage = useCallback(() => {
    if (data?.hasPrevPage) {
      setCurrentPage(prev => prev - 1)
    }
  }, [data])

  const firstPage = useCallback(() => {
    setCurrentPage(1)
  }, [])

  const lastPage = useCallback(() => {
    if (data?.totalPages) {
      setCurrentPage(data.totalPages)
    }
  }, [data])

  // Reset to page 1 when filters change
  const resetPage = useCallback(() => {
    setCurrentPage(1)
  }, [])

  return {
    products: data?.data || [],
    totalCount: data?.totalCount || 0,
    currentPage: data?.page || currentPage,
    pageSize: data?.pageSize || pageSize,
    totalPages: data?.totalPages || 0,
    hasNextPage: data?.hasNextPage || false,
    hasPrevPage: data?.hasPrevPage || false,
    isLoading,
    isFetching,
    error,
    refetch,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    resetPage,
    setPageSize: (size: number) => {
      setCurrentPage(1) // Reset to first page when changing size
    }
  }
}

/**
 * Hook pour l'infinite scroll des produits
 * Idéal pour les catalogues avec chargement progressif
 */
export function useInfiniteProducts(options: Omit<UsePaginatedProductsOptions, 'initialPage'> = {}) {
  const { pageSize = 50, filters = {}, enabled = true } = options

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ['infinite-products', { pageSize, ...filters }],
    queryFn: async ({ pageParam = 0 }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
      }

      // Sorting and pagination
      const sortBy = filters.sortBy || 'created_at'
      const sortOrder = filters.sortOrder || 'desc'
      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(pageParam * pageSize, (pageParam + 1) * pageSize - 1)

      const { data: products, error: queryError, count } = await query

      if (queryError) throw queryError

      return {
        products: products || [],
        nextPage: pageParam + 1,
        totalCount: count || 0,
        hasMore: (products?.length || 0) === pageSize
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextPage : undefined
    },
    enabled,
    staleTime: 30000,
  })

  // Flatten all pages into single array
  const allProducts = useMemo(() => {
    return data?.pages.flatMap(page => page.products.map((p: any) => ({
      id: p.id,
      name: p.title || p.name || 'Produit sans nom',
      description: p.description,
      price: p.price || 0,
      cost_price: p.cost_price,
      status: p.status === 'active' ? 'active' : 'inactive',
      stock_quantity: p.stock_quantity || 0,
      sku: p.sku,
      category: p.category,
      image_url: p.image_url,
      profit_margin: p.cost_price && p.price ? ((p.price - p.cost_price) / p.price * 100) : undefined,
      user_id: p.user_id,
      created_at: p.created_at,
      updated_at: p.updated_at
    }))) || []
  }, [data])

  const totalCount = data?.pages[0]?.totalCount || 0

  return {
    products: allProducts,
    totalCount,
    loadedCount: allProducts.length,
    hasNextPage: hasNextPage || false,
    isFetchingNextPage,
    isLoading,
    error,
    fetchNextPage,
    refetch
  }
}
