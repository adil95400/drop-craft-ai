/**
 * Hook utilitaire pour gérer le cleanup des effets asynchrones
 * Évite les fuites de mémoire et les updates sur des composants démontés
 */
import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook qui fournit une ref pour vérifier si le composant est monté
 */
export function useIsMounted() {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(() => isMountedRef.current, []);
}

/**
 * Hook pour exécuter un effet avec cleanup automatique
 * Annule les opérations async si le composant est démonté
 */
export function useCleanupEffect(
  effect: (signal: AbortSignal) => void | (() => void),
  deps: React.DependencyList
) {
  useEffect(() => {
    const abortController = new AbortController();
    const cleanup = effect(abortController.signal);

    return () => {
      abortController.abort();
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Hook pour gérer les subscriptions avec cleanup automatique
 */
export function useSubscription<T>(
  subscribe: () => { unsubscribe: () => void } | (() => void) | void,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    const result = subscribe();
    
    if (!result) return;
    
    if (typeof result === 'function') {
      return result;
    }
    
    if (typeof result === 'object' && 'unsubscribe' in result) {
      return () => result.unsubscribe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Hook pour gérer les intervals avec cleanup automatique
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

/**
 * Hook pour gérer les timeouts avec cleanup automatique
 */
export function useTimeout(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setTimeout(() => savedCallback.current(), delay);
    return () => clearTimeout(id);
  }, [delay]);
}

/**
 * Hook pour debounce avec cleanup automatique
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );
}

/**
 * Hook pour async effects avec gestion d'erreur et cleanup
 */
export function useAsyncEffect(
  effect: (signal: AbortSignal) => Promise<void>,
  deps: React.DependencyList,
  onError?: (error: Error) => void
) {
  useEffect(() => {
    const abortController = new AbortController();
    let isCancelled = false;

    const runEffect = async () => {
      try {
        await effect(abortController.signal);
      } catch (error) {
        if (!isCancelled && error instanceof Error && error.name !== 'AbortError') {
          console.error('[useAsyncEffect] Error:', error);
          onError?.(error);
        }
      }
    };

    runEffect();

    return () => {
      isCancelled = true;
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
