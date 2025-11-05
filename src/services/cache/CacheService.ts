/**
 * Centralized Cache Service
 * Manages all caching strategies
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheService {
  private static instance: CacheService;
  private cache = new Map<string, CacheEntry<any>>();
  private readonly maxSize: number = 100;
  private readonly defaultTTL: number = 5 * 60 * 1000; // 5 minutes

  static getInstance(): CacheService {
    if (!this.instance) {
      this.instance = new CacheService();
    }
    return this.instance;
  }

  /**
   * Get cached value
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) return undefined;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.data as T;
  }

  /**
   * Set cache value with optional TTL
   */
  set<T>(key: string, value: T, ttl?: number): void {
    // Enforce max size
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const value = this.get(key);
    return value !== undefined;
  }

  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get or set pattern - fetch if not cached
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== undefined) {
      return cached;
    }
    
    const data = await fetchFn();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.cache.keys())
    };
  }
}

export const cacheService = CacheService.getInstance();

// Auto-cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    cacheService.clearExpired();
  }, 5 * 60 * 1000);
}
