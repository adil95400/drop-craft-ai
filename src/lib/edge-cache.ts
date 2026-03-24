/**
 * Edge Cache Layer
 * In-memory LRU cache with TTL for API responses
 */

interface CacheEntry<T> {
  data: T;
  expires: number;
  etag?: string;
}

export class EdgeCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly maxSize: number;

  constructor(maxSize = 200) {
    this.maxSize = maxSize;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data;
  }

  set<T>(key: string, data: T, ttlMs: number, etag?: string): void {
    // Evict oldest if full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, { data, expires: Date.now() + ttlMs, etag });
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) this.cache.delete(key);
    }
  }

  getEtag(key: string): string | undefined {
    return (this.cache.get(key) as CacheEntry<unknown> | undefined)?.etag;
  }

  stats(): { size: number; maxSize: number; hitRate: number } {
    return { size: this.cache.size, maxSize: this.maxSize, hitRate: 0 };
  }
}

// Pre-configured caches
export const apiCache = new EdgeCache(300);
export const dashboardCache = new EdgeCache(50);

/**
 * Cached fetch with stale-while-revalidate
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { ttlMs?: number; cache?: EdgeCache; staleWhileRevalidate?: boolean } = {}
): Promise<T> {
  const { ttlMs = 60_000, cache = apiCache, staleWhileRevalidate = true } = options;

  const cached = cache.get<T>(key);
  if (cached !== null) {
    if (staleWhileRevalidate) {
      // Revalidate in background
      fetcher().then((data) => cache.set(key, data, ttlMs)).catch(() => {});
    }
    return cached;
  }

  const data = await fetcher();
  cache.set(key, data, ttlMs);
  return data;
}
