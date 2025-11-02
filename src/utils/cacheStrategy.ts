/**
 * Advanced Cache Strategy for React Query
 * 
 * Implements a 3-tier caching system:
 * - Static: Long-lived data (1 hour)
 * - User: Medium-lived data (10 minutes)
 * - Transactional: Short-lived data (30 seconds)
 * - Realtime: Very short-lived data (5 seconds)
 */

export const CACHE_STRATEGIES = {
  // Static data: rarely changes (catalog, categories, countries)
  static: {
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2,
  },
  
  // User data: changes occasionally (profile, settings, preferences)
  user: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1,
  },
  
  // Transactional data: changes frequently (orders, products, inventory)
  transactional: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1,
  },
  
  // Realtime data: needs to be fresh (notifications, live stats)
  realtime: {
    staleTime: 5 * 1000, // 5 seconds
    gcTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 30 * 1000, // Poll every 30s
    retry: 0,
  },
  
  // Analytics data: can be cached longer (dashboard stats)
  analytics: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  },
} as const;

export type CacheStrategyType = keyof typeof CACHE_STRATEGIES;

/**
 * Get cache strategy by type
 */
export const getCacheStrategy = (type: CacheStrategyType) => {
  return CACHE_STRATEGIES[type];
};

/**
 * Prefetch configuration for critical routes
 */
export const PREFETCH_ROUTES = [
  '/dashboard',
  '/products',
  '/suppliers',
  '/orders',
] as const;

/**
 * Check if cache is stale based on timestamp
 */
export const isCacheStale = (timestamp: number, staleTime: number): boolean => {
  return Date.now() - timestamp > staleTime;
};

/**
 * Local storage cache helper
 */
export class LocalCache {
  private static prefix = 'dropcraft_cache_';
  
  static set(key: string, value: any, expiresIn: number): void {
    const item = {
      value,
      expiresAt: Date.now() + expiresIn,
    };
    
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to cache item:', error);
    }
  }
  
  static get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;
      
      const parsed = JSON.parse(item);
      
      if (Date.now() > parsed.expiresAt) {
        this.remove(key);
        return null;
      }
      
      return parsed.value as T;
    } catch (error) {
      console.warn('Failed to get cached item:', error);
      return null;
    }
  }
  
  static remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }
  
  static clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
  
  static cleanExpired(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          if (item.expiresAt && Date.now() > item.expiresAt) {
            localStorage.removeItem(key);
          }
        } catch {
          // Invalid format, remove it
          localStorage.removeItem(key);
        }
      }
    });
  }
}

/**
 * Initialize cache cleanup on app start
 */
if (typeof window !== 'undefined') {
  // Clean expired cache items on load
  LocalCache.cleanExpired();
  
  // Clean expired items every 10 minutes
  setInterval(() => {
    LocalCache.cleanExpired();
  }, 10 * 60 * 1000);
}
