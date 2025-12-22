import { useCallback, useMemo, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Hook pour debouncer les recherches avec cancel
 */
export function useDebouncedSearch<T>(
  searchFn: (query: string) => Promise<T>,
  delay: number = 300
) {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const abortControllerRef = useRef<AbortController>()

  const debouncedSearch = useCallback(async (query: string): Promise<T | null> => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    return new Promise((resolve) => {
      timeoutRef.current = setTimeout(async () => {
        try {
          const result = await searchFn(query)
          resolve(result)
        } catch (error) {
          if ((error as Error).name !== 'AbortError') {
            console.error('Search error:', error)
          }
          resolve(null)
        }
      }, delay)
    })
  }, [searchFn, delay])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  return { search: debouncedSearch, cancel }
}

/**
 * Hook pour précharger les pages suivantes
 */
export function usePrefetchPages(
  queryKey: string,
  currentPage: number,
  totalPages: number,
  fetchPageFn: (page: number) => Promise<any>
) {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Prefetch next page if it exists
    if (currentPage < totalPages) {
      queryClient.prefetchQuery({
        queryKey: [queryKey, { page: currentPage + 1 }],
        queryFn: () => fetchPageFn(currentPage + 1),
        staleTime: 30000
      })
    }

    // Prefetch previous page if it exists
    if (currentPage > 1) {
      queryClient.prefetchQuery({
        queryKey: [queryKey, { page: currentPage - 1 }],
        queryFn: () => fetchPageFn(currentPage - 1),
        staleTime: 30000
      })
    }
  }, [currentPage, totalPages, queryClient, queryKey, fetchPageFn])
}

/**
 * Hook pour l'intersection observer (lazy loading)
 */
export function useIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit = {}
) {
  const observerRef = useRef<IntersectionObserver>()
  const targetRef = useRef<HTMLElement>()

  const setTarget = useCallback((element: HTMLElement | null) => {
    if (targetRef.current) {
      observerRef.current?.unobserve(targetRef.current)
    }

    if (element) {
      targetRef.current = element
      observerRef.current?.observe(element)
    }
  }, [])

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        callback()
      }
    }, {
      threshold: 0.1,
      rootMargin: '100px',
      ...options
    })

    if (targetRef.current) {
      observerRef.current.observe(targetRef.current)
    }

    return () => {
      observerRef.current?.disconnect()
    }
  }, [callback, options])

  return setTarget
}

/**
 * Hook pour tracker et optimiser les performances des requêtes
 */
export function useQueryPerformance(queryKey: string) {
  const startTimeRef = useRef<number>()
  const metricsRef = useRef<{ loadTime: number; dataSize: number }[]>([])

  const startTracking = useCallback(() => {
    startTimeRef.current = performance.now()
  }, [])

  const endTracking = useCallback((dataSize: number) => {
    if (startTimeRef.current) {
      const loadTime = performance.now() - startTimeRef.current
      metricsRef.current.push({ loadTime, dataSize })

      // Keep only last 10 measurements
      if (metricsRef.current.length > 10) {
        metricsRef.current.shift()
      }

      // Log slow queries
      if (loadTime > 1000) {
        console.warn(`[Performance] Slow query "${queryKey}": ${loadTime.toFixed(0)}ms for ${dataSize} items`)
      }
    }
  }, [queryKey])

  const getAverageLoadTime = useCallback(() => {
    if (metricsRef.current.length === 0) return 0
    const sum = metricsRef.current.reduce((acc, m) => acc + m.loadTime, 0)
    return sum / metricsRef.current.length
  }, [])

  return { startTracking, endTracking, getAverageLoadTime }
}

/**
 * Hook pour gérer le cache des catégories (données rarement modifiées)
 */
export function useCachedCategories() {
  const queryClient = useQueryClient()

  const getCachedCategories = useCallback((): string[] => {
    const cached = queryClient.getQueryData<{ categories: string[] }>(['product-categories'])
    return cached?.categories || []
  }, [queryClient])

  const invalidateCategories = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['product-categories'] })
  }, [queryClient])

  return { getCachedCategories, invalidateCategories }
}

/**
 * Hook optimisé pour les stats agrégées
 * Évite de recharger toutes les données pour calculer les stats
 */
export function useProductStats(userId?: string) {
  const queryKey = useMemo(() => ['product-stats', userId], [userId])

  const calculateStats = useCallback(async () => {
    if (!userId) return null

    const { supabase } = await import('@/integrations/supabase/client')

    // Single optimized query for counts
    const [
      { count: totalCount },
      { count: activeCount },
      { count: lowStockCount }
    ] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'active'),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('user_id', userId).lt('stock_quantity', 10)
    ])

    return {
      total: totalCount || 0,
      active: activeCount || 0,
      inactive: (totalCount || 0) - (activeCount || 0),
      lowStock: lowStockCount || 0
    }
  }, [userId])

  return { queryKey, calculateStats }
}
