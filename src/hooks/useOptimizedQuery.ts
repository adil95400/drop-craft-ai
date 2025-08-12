import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi';

export function useOptimizedQuery<T>(
  key: string[],
  queryFn: () => Promise<{ data: T | null; error: string | null }>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
    refetchOnWindowFocus?: boolean;
  }
) {
  const { execute } = useApi();

  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const result = await execute(queryFn, { showToast: false });
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
    gcTime: options?.cacheTime ?? 10 * 60 * 1000, // 10 minutes  
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    enabled: options?.enabled ?? true,
  });
}

export function useOptimizedMutation<T, V = unknown>(
  mutationFn: (variables: V) => Promise<{ data: T | null; error: string | null }>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
    invalidateQueries?: string[];
    showToast?: boolean;
  }
) {
  const queryClient = useQueryClient();
  const { execute } = useApi();

  return useMutation({
    mutationFn: async (variables: V) => {
      const result = await execute(
        () => mutationFn(variables),
        {
          showToast: options?.showToast ?? true,
          onSuccess: options?.onSuccess,
          onError: options?.onError,
        }
      );
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate specified queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
      }
      
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      options?.onError?.(error.message);
    },
  });
}

// Utility for prefetching data
export function usePrefetch() {
  const queryClient = useQueryClient();
  const { execute } = useApi();

  return {
    prefetchQuery: <T>(
      key: string[],
      queryFn: () => Promise<{ data: T | null; error: string | null }>,
      staleTime = 5 * 60 * 1000
    ) => {
      return queryClient.prefetchQuery({
        queryKey: key,
        queryFn: async () => {
          const result = await execute(queryFn, { showToast: false });
          if (result.error) {
            throw new Error(result.error);
          }
          return result.data;
        },
        staleTime,
      });
    },
  };
}