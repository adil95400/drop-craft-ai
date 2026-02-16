/**
 * Sprint 18: Query Optimizer Hook
 * Smart prefetching, deduplication, and invalidation patterns
 */
import { useCallback } from 'react';
import { useQueryClient, QueryKey } from '@tanstack/react-query';
import { CACHE_STRATEGIES, CacheStrategyType } from '@/utils/simpleCacheStrategy';

export function useQueryOptimizer() {
  const queryClient = useQueryClient();

  /**
   * Prefetch a query with the right cache strategy
   */
  const prefetch = useCallback(
    async <T>(
      queryKey: QueryKey,
      queryFn: () => Promise<T>,
      strategy: CacheStrategyType = 'transactional'
    ) => {
      const config = CACHE_STRATEGIES[strategy];
      await queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: config.staleTime,
      });
    },
    [queryClient]
  );

  /**
   * Smart invalidation — invalidate matching queries and optionally refetch
   */
  const smartInvalidate = useCallback(
    async (patterns: string[], refetch = true) => {
      const promises = patterns.map((pattern) =>
        queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey.some(
              (k) => typeof k === 'string' && k.includes(pattern)
            ),
          refetchType: refetch ? 'active' : 'none',
        })
      );
      await Promise.all(promises);
    },
    [queryClient]
  );

  /**
   * Batch prefetch multiple queries
   */
  const batchPrefetch = useCallback(
    async (
      queries: Array<{
        queryKey: QueryKey;
        queryFn: () => Promise<any>;
        strategy?: CacheStrategyType;
      }>
    ) => {
      await Promise.allSettled(
        queries.map(({ queryKey, queryFn, strategy = 'transactional' }) =>
          prefetch(queryKey, queryFn, strategy)
        )
      );
    },
    [prefetch]
  );

  /**
   * Get cache status summary
   */
  const getCacheStatus = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const all = cache.getAll();
    return {
      totalQueries: all.length,
      fetching: all.filter((q) => q.state.fetchStatus === 'fetching').length,
      stale: all.filter((q) => q.isStale()).length,
      fresh: all.filter((q) => !q.isStale()).length,
      inactive: all.filter((q) => q.getObserversCount() === 0).length,
    };
  }, [queryClient]);

  /**
   * Garbage collect inactive queries
   */
  const garbageCollect = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const inactive = cache.getAll().filter((q) => q.getObserversCount() === 0 && q.isStale());
    inactive.forEach((q) => cache.remove(q));
    return inactive.length;
  }, [queryClient]);

  return {
    prefetch,
    smartInvalidate,
    batchPrefetch,
    getCacheStatus,
    garbageCollect,
  };
}
