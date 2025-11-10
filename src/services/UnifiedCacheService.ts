/**
 * Unified Cache Service - Consolidates all cache management
 * Replaces: GlobalCacheManager, LocalCache, cacheService
 */

type CacheDomain = 'static' | 'user' | 'transactional' | 'realtime' | 'analytics';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheStats {
  total: number;
  active: number;
  expired: number;
  hitRate: number;
}

class UnifiedCache {
  private static instance: UnifiedCache;
  private cache = new Map<string, CacheEntry<any>>();

  private strategies: Record<CacheDomain, { ttl: number }> = {
    static: { ttl: 60 * 60 * 1000 },      // 1h
    user: { ttl: 30 * 60 * 1000 },        // 30min
    transactional: { ttl: 30 * 1000 },    // 30s
    realtime: { ttl: 5 * 1000 },          // 5s
    analytics: { ttl: 5 * 60 * 1000 },    // 5min
  };

  private constructor() {
    // Auto-cleanup every 10 minutes
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanup(), 10 * 60 * 1000);
    }
  }

  static getInstance(): UnifiedCache {
    if (!UnifiedCache.instance) {
      UnifiedCache.instance = new UnifiedCache();
    }
    return UnifiedCache.instance;
  }

  set<T>(key: string, data: T, domain: CacheDomain = 'transactional'): void {
    const ttl = this.strategies[domain].ttl;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (this.isExpired(cached)) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  has(key: string): boolean {
    const cached = this.cache.get(key);
    return cached !== undefined && !this.isExpired(cached);
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): CacheStats {
    const now = Date.now();
    let active = 0;
    let expired = 0;

    for (const [, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
      hitRate: active / (active + expired) || 0,
    };
  }

  clear(): void {
    this.cache.clear();
  }
}

export const unifiedCache = UnifiedCache.getInstance();

// Convenience exports
export const cacheSet = <T>(key: string, data: T, domain?: CacheDomain) => 
  unifiedCache.set(key, data, domain);

export const cacheGet = <T>(key: string): T | null => 
  unifiedCache.get<T>(key);

export const cacheHas = (key: string): boolean => 
  unifiedCache.has(key);

export const cacheInvalidate = (pattern?: string) => 
  unifiedCache.invalidate(pattern);

export const cacheStats = (): CacheStats => 
  unifiedCache.getStats();
