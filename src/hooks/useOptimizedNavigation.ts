/**
 * Optimized Navigation Hook
 * Provides memoized navigation state and prevents unnecessary re-renders
 */
import { useMemo, useCallback, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavigationState {
  currentPath: string;
  currentModule: string | null;
  currentSubModule: string | null;
  isActive: (path: string) => boolean;
  navigateTo: (path: string, options?: { replace?: boolean }) => void;
  goBack: () => void;
}

// Cache for path matching results
const matchCache = new Map<string, boolean>();

export function useOptimizedNavigation(): NavigationState {
  const location = useLocation();
  const navigate = useNavigate();
  const previousPathRef = useRef<string>('');

  // Clear cache on path change
  useEffect(() => {
    if (location.pathname !== previousPathRef.current) {
      matchCache.clear();
      previousPathRef.current = location.pathname;
    }
  }, [location.pathname]);

  // Extract module info from path
  const { currentModule, currentSubModule } = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    return {
      currentModule: segments[0] || null,
      currentSubModule: segments[1] || null,
    };
  }, [location.pathname]);

  // Memoized path matching with caching
  const isActive = useCallback((path: string): boolean => {
    const cacheKey = `${location.pathname}:${path}`;
    
    if (matchCache.has(cacheKey)) {
      return matchCache.get(cacheKey)!;
    }

    let result: boolean;
    
    // Exact match
    if (path === location.pathname) {
      result = true;
    }
    // Prefix match for nested routes
    else if (path !== '/' && location.pathname.startsWith(path + '/')) {
      result = true;
    }
    // Root path match
    else if (path === '/' && location.pathname === '/') {
      result = true;
    }
    else {
      result = false;
    }

    matchCache.set(cacheKey, result);
    return result;
  }, [location.pathname]);

  // Optimized navigation with transition
  const navigateTo = useCallback((path: string, options?: { replace?: boolean }) => {
    // Skip if already on the same path
    if (path === location.pathname) return;

    // Use startTransition if available for smoother navigation
    if ('startTransition' in window.React) {
      (window.React as any).startTransition(() => {
        navigate(path, { replace: options?.replace });
      });
    } else {
      navigate(path, { replace: options?.replace });
    }
  }, [navigate, location.pathname]);

  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return useMemo(() => ({
    currentPath: location.pathname,
    currentModule,
    currentSubModule,
    isActive,
    navigateTo,
    goBack,
  }), [location.pathname, currentModule, currentSubModule, isActive, navigateTo, goBack]);
}

// Prefetch hook for route preloading
export function usePrefetchRoute() {
  const prefetchedRoutes = useRef<Set<string>>(new Set());

  const prefetch = useCallback((path: string) => {
    if (prefetchedRoutes.current.has(path)) return;

    // Mark as prefetched
    prefetchedRoutes.current.add(path);

    // Trigger lazy load by creating a link
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = path;
    document.head.appendChild(link);
  }, []);

  return { prefetch };
}

// Hook to prevent navigation when there are unsaved changes
export function useNavigationGuard(hasUnsavedChanges: boolean, message?: string) {
  const defaultMessage = 'Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?';

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message || defaultMessage;
      return message || defaultMessage;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, message]);
}

export default useOptimizedNavigation;

// Declare React on window for startTransition check
declare global {
  interface Window {
    React?: typeof import('react');
  }
}
