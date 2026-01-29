/**
 * Hook unifié pour appeler les edge functions de manière sécurisée
 * Gère les erreurs, timeouts, retries et cleanup automatique
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EdgeFunctionOptions {
  timeout?: number;
  retries?: number;
  showErrorToast?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface EdgeFunctionState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isSuccess: boolean;
}

/**
 * Hook pour appeler une edge function avec gestion complète des erreurs
 */
export function useUnifiedEdgeFunction<T = any>(
  functionName: string,
  options: EdgeFunctionOptions = {}
) {
  const {
    timeout = 30000,
    retries = 2,
    showErrorToast = true,
    onSuccess,
    onError,
  } = options;

  const { toast } = useToast();
  const [state, setState] = useState<EdgeFunctionState<T>>({
    data: null,
    error: null,
    isLoading: false,
    isSuccess: false,
  });

  // AbortController pour cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const invoke = useCallback(
    async (body?: any): Promise<T | null> => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      if (!isMountedRef.current) return null;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      let lastError: Error | null = null;
      let attempts = 0;

      while (attempts <= retries) {
        try {
          console.log(`[EdgeFunction] Calling ${functionName} (attempt ${attempts + 1})`);

          // Create timeout promise
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), timeout);
          });

          // Create invoke promise
          const invokePromise = supabase.functions.invoke(functionName, {
            body,
          });

          // Race between timeout and actual request
          const { data, error } = await Promise.race([
            invokePromise,
            timeoutPromise.then(() => {
              throw new Error('Request timeout');
            }),
          ]);

          if (error) {
            throw new Error(error.message);
          }

          console.log(`[EdgeFunction] ${functionName} success:`, data);

          if (isMountedRef.current) {
            setState({
              data: data as T,
              error: null,
              isLoading: false,
              isSuccess: true,
            });
          }

          onSuccess?.(data);
          return data as T;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          console.error(`[EdgeFunction] ${functionName} error (attempt ${attempts + 1}):`, lastError);

          // Don't retry on abort
          if (lastError.name === 'AbortError') {
            break;
          }

          attempts++;

          // Wait before retry (exponential backoff)
          if (attempts <= retries) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
          }
        }
      }

      // All retries failed
      if (isMountedRef.current && lastError) {
        setState({
          data: null,
          error: lastError,
          isLoading: false,
          isSuccess: false,
        });

        if (showErrorToast) {
          toast({
            title: 'Erreur',
            description: lastError.message || 'Une erreur est survenue',
            variant: 'destructive',
          });
        }

        onError?.(lastError);
      }

      return null;
    },
    [functionName, timeout, retries, showErrorToast, onSuccess, onError, toast]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
      isSuccess: false,
    });
  }, []);

  return {
    ...state,
    invoke,
    reset,
  };
}

/**
 * Hook simplifié pour appeler une edge function une seule fois
 */
export function useEdgeFunctionQuery<T = any>(
  functionName: string,
  body?: any,
  options: EdgeFunctionOptions & { enabled?: boolean } = {}
) {
  const { enabled = true, ...edgeOptions } = options;
  const { invoke, ...state } = useUnifiedEdgeFunction<T>(functionName, edgeOptions);
  const hasCalledRef = useRef(false);

  useEffect(() => {
    if (enabled && !hasCalledRef.current) {
      hasCalledRef.current = true;
      invoke(body);
    }
  }, [enabled, invoke, body]);

  return state;
}

/**
 * Hook pour mutation via edge function
 */
export function useEdgeFunctionMutation<T = any, TBody = any>(
  functionName: string,
  options: EdgeFunctionOptions = {}
) {
  const { invoke, ...state } = useUnifiedEdgeFunction<T>(functionName, options);

  const mutate = useCallback(
    async (body: TBody): Promise<T | null> => {
      return invoke(body);
    },
    [invoke]
  );

  return {
    ...state,
    mutate,
    mutateAsync: mutate,
  };
}
