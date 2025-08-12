import { useCallback } from 'react';

import { apiClient } from '@/lib/fetcher';
import { useToast } from '@/hooks/use-toast';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  showToast?: boolean;
}

export function useApi() {
  const { toast } = useToast();

  const executeWithToast = useCallback(
    async <T>(
      apiCall: () => Promise<{ data: T | null; error: string | null }>,
      options: UseApiOptions = {}
    ) => {
      const { onSuccess, onError, showToast = true } = options;

      try {
        const result = await apiCall();

        if (result.error) {
          if (showToast) {
            toast({
              title: 'Erreur',
              description: result.error,
              variant: 'destructive',
            });
          }
          onError?.(result.error);
          return { data: null, error: result.error };
        }

        if (showToast) {
          toast({
            title: 'Succès',
            description: 'Opération réalisée avec succès',
          });
        }
        onSuccess?.(result.data);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        
        if (showToast) {
          toast({
            title: 'Erreur',
            description: errorMessage,
            variant: 'destructive',
          });
        }
        onError?.(errorMessage);
        return { data: null, error: errorMessage };
      }
    },
    [toast]
  );

  return {
    // HTTP methods with toast integration
    get: useCallback(
      <T>(endpoint: string, options?: UseApiOptions) =>
        executeWithToast<T>(() => apiClient.get<T>(endpoint), options),
      [executeWithToast]
    ),

    post: useCallback(
      <T>(endpoint: string, data?: any, options?: UseApiOptions) =>
        executeWithToast<T>(() => apiClient.post<T>(endpoint, data), options),
      [executeWithToast]
    ),

    put: useCallback(
      <T>(endpoint: string, data?: any, options?: UseApiOptions) =>
        executeWithToast<T>(() => apiClient.put<T>(endpoint, data), options),
      [executeWithToast]
    ),

    delete: useCallback(
      <T>(endpoint: string, options?: UseApiOptions) =>
        executeWithToast<T>(() => apiClient.delete<T>(endpoint), options),
      [executeWithToast]
    ),

    // Supabase methods
    supabaseFunction: useCallback(
      <T>(functionName: string, payload?: any, options?: UseApiOptions) =>
        executeWithToast<T>(() => apiClient.supabaseFunction<T>(functionName, payload), options),
      [executeWithToast]
    ),

    supabaseQuery: useCallback(
      <T>(queryFn: () => Promise<{ data: T | null; error: any }>, options?: UseApiOptions) =>
        executeWithToast<T>(() => apiClient.supabaseQuery<T>(queryFn), options),
      [executeWithToast]
    ),

    // Raw execution without toast
    execute: executeWithToast,
  };
}