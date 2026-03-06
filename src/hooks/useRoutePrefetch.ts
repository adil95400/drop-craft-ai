/**
 * Route Prefetch Hook
 * Preloads route chunks on hover/focus for instant navigation
 */
import { useCallback, useRef } from 'react';

const prefetchMap: Record<string, () => Promise<unknown>> = {
  '/dashboard': () => import('@/pages/Dashboard'),
  '/products': () => import('@/routes/ProductRoutes'),
  '/orders': () => import('@/routes/OrderRoutes'),
  '/analytics': () => import('@/routes/AnalyticsRoutes'),
  '/automation': () => import('@/routes/AutomationRoutes'),
  '/marketing': () => import('@/routes/MarketingRoutes'),
  '/settings': () => import('@/routes/SettingsRoutes'),
  '/inventory': () => import('@/routes/InventoryRoutes'),
  '/import': () => import('@/routes/ImportRoutes'),
  '/ai': () => import('@/routes/AIRoutes'),
};

export function useRoutePrefetch() {
  const prefetched = useRef<Set<string>>(new Set());

  const prefetch = useCallback((path: string) => {
    // Find matching prefetch key
    const key = Object.keys(prefetchMap).find(k => path === k || path.startsWith(k + '/'));
    if (!key || prefetched.current.has(key)) return;

    prefetched.current.add(key);
    // Fire and forget - preload the chunk
    prefetchMap[key]().catch(() => {
      // Remove from set so it can be retried
      prefetched.current.delete(key);
    });
  }, []);

  const onPointerEnter = useCallback((path: string) => {
    return () => prefetch(path);
  }, [prefetch]);

  return { prefetch, onPointerEnter };
}
