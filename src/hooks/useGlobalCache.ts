import React from 'react'
import { useQueryClient } from '@tanstack/react-query'

// Cache global optimisé pour toute l'application
export class GlobalCacheManager {
  private static instance: GlobalCacheManager
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  
  private readonly defaultTTL = 5 * 60 * 1000 // 5 minutes

  // Cache strategies par domaine
  private strategies = {
    winners: { ttl: 5 * 60 * 1000 },     // 5 min - données volatiles
    catalog: { ttl: 10 * 60 * 1000 },    // 10 min - produits
    analytics: { ttl: 1 * 60 * 1000 },   // 1 min - métriques temps réel
    users: { ttl: 30 * 60 * 1000 },      // 30 min - données utilisateur
    static: { ttl: 60 * 60 * 1000 }      // 1h - données statiques
  }

  public static getInstance(): GlobalCacheManager {
    if (!GlobalCacheManager.instance) {
      GlobalCacheManager.instance = new GlobalCacheManager()
    }
    return GlobalCacheManager.instance
  }

  set(key: string, data: any, domain: keyof typeof this.strategies = 'catalog'): void {
    const ttl = this.strategies[domain]?.ttl || this.defaultTTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data as T
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
      return
    }

    // Invalidation par pattern
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  getStats() {
    const now = Date.now()
    let active = 0
    let expired = 0

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        expired++
      } else {
        active++
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
      hitRate: active / (active + expired) || 0
    }
  }

  // Nettoyage automatique des entrées expirées
  cleanup(): void {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

export const useGlobalCache = () => {
  const queryClient = useQueryClient()
  const cacheManager = GlobalCacheManager.getInstance()

  // Intégration avec React Query
  const invalidateAll = () => {
    cacheManager.invalidate()
    queryClient.invalidateQueries()
  }

  const invalidatePattern = (pattern: string) => {
    cacheManager.invalidate(pattern)
    queryClient.invalidateQueries({ 
      predicate: (query) => 
        query.queryKey.some(key => 
          typeof key === 'string' && key.includes(pattern)
        )
    })
  }

  // Préchargement intelligent
  const prefetch = async <T>(
    key: string,
    fetcher: () => Promise<T>,
    domain: 'winners' | 'catalog' | 'analytics' | 'users' | 'static' = 'catalog'
  ): Promise<T> => {
    const cached = cacheManager.get<T>(key)
    if (cached) return cached

    const data = await fetcher()
    cacheManager.set(key, data, domain)
    return data
  }

  return {
    cache: cacheManager,
    invalidateAll,
    invalidatePattern,
    prefetch,
    getStats: () => cacheManager.getStats(),
    cleanup: () => cacheManager.cleanup()
  }
}

// Hook pour le cache auto-nettoyant
export const useCacheCleanup = (interval = 10 * 60 * 1000) => { // 10 minutes
  const { cleanup } = useGlobalCache()

  React.useEffect(() => {
    const timer = setInterval(() => {
      cleanup()
    }, interval)

    return () => clearInterval(timer)
  }, [cleanup, interval])
}