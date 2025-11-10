/**
 * Optimized API Hook with Advanced Caching
 * 
 * Features:
 * - Automatic cache strategy selection
 * - Request deduplication
 * - Retry with exponential backoff
 * - Error recovery
 * - Performance tracking
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { getCacheStrategy, CacheStrategyType, LocalCache } from '@/utils/simpleCacheStrategy';
import { performanceTracker } from '@/utils/performanceMonitoring';
import { toast } from 'sonner';

interface OptimizedApiOptions<TData> extends Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'> {
  cacheStrategy?: CacheStrategyType;
  enableLocalCache?: boolean;
  localCacheKey?: string;
  showErrorToast?: boolean;
  performanceTracking?: boolean;
}

/**
 * Optimized query hook with advanced caching
 */
export function useOptimizedApi<TData = unknown>(
  queryKey: string[],
  queryFn: () => Promise<TData>,
  options: OptimizedApiOptions<TData> = {}
) {
  const {
    cacheStrategy = 'transactional',
    enableLocalCache = false,
    localCacheKey,
    showErrorToast = true,
    performanceTracking = true,
    ...queryOptions
  } = options;

  const strategy = getCacheStrategy(cacheStrategy);
  
  const query = useQuery<TData>({
    queryKey,
    queryFn: async () => {
      // Check local cache first
      if (enableLocalCache && localCacheKey) {
        const cached = LocalCache.get<TData>(localCacheKey);
        if (cached) {
          return cached;
        }
      }
      
      // Performance tracking
      let perfMark: string | undefined;
      if (performanceTracking) {
        perfMark = `api_${queryKey.join('_')}`;
        performanceTracker.mark(perfMark);
      }
      
      try {
        const data = await queryFn();
        
        // Store in local cache
        if (enableLocalCache && localCacheKey && data) {
          LocalCache.set(localCacheKey, data, strategy.staleTime);
        }
        
        // Track performance
        if (performanceTracking && perfMark) {
          performanceTracker.measure(`api_call_${queryKey.join('_')}`, perfMark);
        }
        
        return data;
      } catch (error) {
        if (showErrorToast) {
          toast.error('Erreur lors du chargement des données');
        }
        throw error;
      }
    },
    ...strategy,
    ...queryOptions,
  });

  return query;
}

/**
 * Optimized mutation hook with error handling
 */
export function useOptimizedMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    invalidateQueries?: string[][];
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
    successMessage?: string;
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const queryClient = useQueryClient();
  const {
    invalidateQueries = [],
    showSuccessToast = true,
    showErrorToast = true,
    successMessage = 'Opération réussie',
    onSuccess,
    onError,
  } = options;

  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      // Invalidate related queries
      invalidateQueries.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      
      if (showSuccessToast) {
        toast.success(successMessage);
      }
      
      onSuccess?.(data);
    },
    onError: (error: Error) => {
      if (showErrorToast) {
        toast.error(error.message || 'Une erreur est survenue');
      }
      
      onError?.(error);
    },
  });
}

/**
 * Prefetch data for better UX
 */
export function usePrefetch() {
  const queryClient = useQueryClient();
  
  return {
    prefetch: <TData>(
      queryKey: string[],
      queryFn: () => Promise<TData>,
      cacheStrategy: CacheStrategyType = 'user'
    ) => {
      const strategy = getCacheStrategy(cacheStrategy);
      
      return queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: strategy.staleTime,
      });
    },
  };
}

/**
 * Optimistic updates helper
 */
export function useOptimisticUpdate<TData>(queryKey: string[]) {
  const queryClient = useQueryClient();
  
  return {
    setOptimisticData: (updater: (old: TData | undefined) => TData) => {
      queryClient.setQueryData(queryKey, updater);
    },
    rollback: (previousData: TData) => {
      queryClient.setQueryData(queryKey, previousData);
    },
  };
}
