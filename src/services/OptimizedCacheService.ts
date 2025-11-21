/**
 * Optimized Cache Service with LRU and Memory Management
 * Prevents memory leaks and improves performance
 */

type CacheDomain = 'static' | 'user' | 'transactional' | 'realtime' | 'analytics';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number; // Track access frequency for LRU
  size: number; // Approximate size in bytes
}

interface CacheStats {
  total: number;
  active: number;
  expired: number;
  hitRate: number;
  memoryUsage: number;
  evictions: number;
}

class OptimizedCache {
  private static instance: OptimizedCache;
  private cache = new Map<string, CacheEntry<any>>();
  private maxMemoryBytes = 50 * 1024 * 1024; // 50MB max
  private currentMemoryUsage = 0;
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  private strategies: Record<CacheDomain, { ttl: number }> = {
    static: { ttl: 60 * 60 * 1000 },      // 1h
    user: { ttl: 30 * 60 * 1000 },        // 30min
    transactional: { ttl: 30 * 1000 },    // 30s
    realtime: { ttl: 5 * 1000 },          // 5s
    analytics: { ttl: 5 * 60 * 1000 },    // 5min
  };

  private constructor() {
    if (typeof window !== 'undefined') {
      // Cleanup expired entries every 5 minutes
      setInterval(() => this.cleanup(), 5 * 60 * 1000);
      
      // Check memory usage every minute
      setInterval(() => this.enforceMemoryLimit(), 60 * 1000);
    }
  }

  static getInstance(): OptimizedCache {
    if (!OptimizedCache.instance) {
      OptimizedCache.instance = new OptimizedCache();
    }
    return OptimizedCache.instance;
  }

  private estimateSize(data: any): number {
    // Rough estimation of object size in bytes
    const str = JSON.stringify(data);
    return str.length * 2; // UTF-16 = 2 bytes per char
  }

  set<T>(key: string, data: T, domain: CacheDomain = 'transactional'): void {
    const ttl = this.strategies[domain].ttl;
    const size = this.estimateSize(data);

    // Remove old entry if exists
    if (this.cache.has(key)) {
      const old = this.cache.get(key)!;
      this.currentMemoryUsage -= old.size;
    }

    // Check if we need to make room
    if (this.currentMemoryUsage + size > this.maxMemoryBytes) {
      this.evictLRU(size);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      size
    });

    this.currentMemoryUsage += size;
  }

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      this.misses++;
      return null;
    }

    if (this.isExpired(cached)) {
      this.delete(key);
      this.misses++;
      return null;
    }

    // Update LRU stats
    cached.hits++;
    this.hits++;

    return cached.data as T;
  }

  has(key: string): boolean {
    const cached = this.cache.get(key);
    return cached !== undefined && !this.isExpired(cached);
  }

  delete(key: string): void {
    const cached = this.cache.get(key);
    if (cached) {
      this.currentMemoryUsage -= cached.size;
      this.cache.delete(key);
    }
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.currentMemoryUsage = 0;
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.delete(key);
      }
    }
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictLRU(sizeNeeded: number): void {
    // Sort by least recently used (fewest hits)
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.hits - b.hits);

    let freedSpace = 0;

    for (const [key, entry] of entries) {
      if (freedSpace >= sizeNeeded) break;
      
      this.delete(key);
      this.evictions++;
      freedSpace += entry.size;
    }
  }

  private enforceMemoryLimit(): void {
    if (this.currentMemoryUsage > this.maxMemoryBytes * 0.9) {
      // Evict 20% of cache if we're at 90% capacity
      const targetSize = this.maxMemoryBytes * 0.7;
      const toFree = this.currentMemoryUsage - targetSize;
      this.evictLRU(toFree);
    }
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.delete(key);
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
      hitRate: this.hits / (this.hits + this.misses) || 0,
      memoryUsage: this.currentMemoryUsage,
      evictions: this.evictions
    };
  }

  clear(): void {
    this.cache.clear();
    this.currentMemoryUsage = 0;
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  // Configure max memory
  setMaxMemory(bytes: number): void {
    this.maxMemoryBytes = bytes;
    this.enforceMemoryLimit();
  }
}

export const optimizedCache = OptimizedCache.getInstance();

// Convenience exports
export const cacheSet = <T>(key: string, data: T, domain?: CacheDomain) => 
  optimizedCache.set(key, data, domain);

export const cacheGet = <T>(key: string): T | null => 
  optimizedCache.get<T>(key);

export const cacheHas = (key: string): boolean => 
  optimizedCache.has(key);

export const cacheInvalidate = (pattern?: string) => 
  optimizedCache.invalidate(pattern);

export const cacheStats = (): CacheStats => 
  optimizedCache.getStats();
