/**
 * Route Prefetch Hook v2
 * Preloads route chunks on hover/focus for instant navigation
 * Uses requestIdleCallback for non-blocking prefetch
 */
import { useCallback, useRef, useEffect } from 'react';

const prefetchMap: Record<string, () => Promise<unknown>> = {
  '/dashboard': () => import('@/routes/CoreRoutes'),
  '/products': () => import('@/routes/ProductRoutes'),
  '/orders': () => import('@/routes/OrderRoutes'),
  '/analytics': () => import('@/routes/AnalyticsRoutes'),
  '/automation': () => import('@/routes/AutomationRoutes'),
  '/marketing': () => import('@/routes/MarketingRoutes'),
  '/settings': () => import('@/routes/SettingsRoutes'),
  '/import': () => import('@/routes/ImportRoutes'),
  '/ai': () => import('@/routes/AIRoutes'),
  '/customers': () => import('@/routes/CustomerRoutes'),
  '/suppliers': () => import('@/routes/SupplierRoutes'),
  '/integrations': () => import('@/routes/IntegrationRoutes'),
  '/stock': () => import('@/routes/StockRoutes'),
  '/pricing-manager': () => import('@/routes/PricingRoutes'),
  '/research': () => import('@/routes/ResearchRoutes'),
  '/catalog': () => import('@/routes/CatalogRoutes'),
  '/channels': () => import('@/routes/ChannelRoutes'),
  '/feeds': () => import('@/routes/FeedRoutes'),
};

// Prefetch top routes after initial load
const PRIORITY_ROUTES = ['/dashboard', '/products', '/orders'];

export function useRoutePrefetch() {
  const prefetched = useRef<Set<string>>(new Set());

  // Auto-prefetch priority routes after idle
  useEffect(() => {
    const prefetchPriority = () => {
      PRIORITY_ROUTES.forEach(key => {
        if (prefetched.current.has(key)) return;
        prefetched.current.add(key);
        prefetchMap[key]?.().catch(() => prefetched.current.delete(key));
      });
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(prefetchPriority, { timeout: 3000 });
    } else {
      setTimeout(prefetchPriority, 2000);
    }
  }, []);

  const prefetch = useCallback((path: string) => {
    const key = Object.keys(prefetchMap).find(k => path === k || path.startsWith(k + '/'));
    if (!key || prefetched.current.has(key)) return;

    prefetched.current.add(key);
    prefetchMap[key]().catch(() => {
      prefetched.current.delete(key);
    });
  }, []);

  const onPointerEnter = useCallback((path: string) => {
    return () => prefetch(path);
  }, [prefetch]);

  return { prefetch, onPointerEnter };
}
