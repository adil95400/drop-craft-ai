/**
 * Simple cache strategy configuration for React Query
 * Simplified version without complex types
 */

export type CacheStrategyType = 'static' | 'user' | 'transactional' | 'realtime' | 'analytics';

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

export const getCacheStrategy = (type: CacheStrategyType) => {
  return CACHE_STRATEGIES[type];
};

// Simple local cache using unifiedCache
import { unifiedCache } from '@/services/UnifiedCacheService';

export const LocalCache = {
  set: <T>(key: string, value: T, expiresIn: number) => {
    const domain = expiresIn > 30 * 60 * 1000 ? 'static' : 
                   expiresIn > 5 * 60 * 1000 ? 'user' : 'transactional';
    unifiedCache.set(key, value, domain);
  },
  
  get: <T>(key: string): T | null => {
    return unifiedCache.get<T>(key);
  },
  
  remove: (key: string) => {
    unifiedCache.invalidate(key);
  },
  
  clear: () => {
    unifiedCache.clear();
  },
};
