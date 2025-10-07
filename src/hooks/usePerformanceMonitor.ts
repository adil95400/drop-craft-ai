import { useEffect, useRef } from 'react';
import { logger } from '@/utils/logger';

/**
 * Hook pour monitorer les performances d'un composant
 * Détecte les re-rendus excessifs et les memory leaks
 */
export function usePerformanceMonitor(componentName: string, options?: {
  maxRenders?: number;
  logRenders?: boolean;
  checkMemory?: boolean;
}) {
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef(Date.now());
  const {
    maxRenders = 50,
    logRenders = false,
    checkMemory = true
  } = options || {};

  useEffect(() => {
    renderCountRef.current += 1;

    if (logRenders) {
      console.log(`[Performance] ${componentName} rendered ${renderCountRef.current} times`);
    }

    // Alerte si trop de re-rendus
    if (renderCountRef.current > maxRenders) {
      logger.warn(`Component ${componentName} has rendered ${renderCountRef.current} times`, {
        component: 'usePerformanceMonitor',
        metadata: {
          componentName,
          renderCount: renderCountRef.current,
          timeSinceMount: Date.now() - mountTimeRef.current,
        }
      });
    }

    // Check memory usage si supporté
    if (checkMemory && 'memory' in performance) {
      const memory = (performance as any).memory;
      if (memory) {
        const usedMB = memory.usedJSHeapSize / 1048576;
        const totalMB = memory.totalJSHeapSize / 1048576;
        const usage = (usedMB / totalMB) * 100;

        if (usage > 80) {
          logger.warn(`High memory usage detected in ${componentName}`, {
            component: 'usePerformanceMonitor',
            metadata: {
              componentName,
              usedMB: Math.round(usedMB),
              totalMB: Math.round(totalMB),
              usage: Math.round(usage),
            }
          });
        }
      }
    }
  });

  // Cleanup et rapport final
  useEffect(() => {
    return () => {
      const lifetime = Date.now() - mountTimeRef.current;
      logger.info(`Component ${componentName} unmounted`, {
        component: 'usePerformanceMonitor',
        metadata: {
          componentName,
          totalRenders: renderCountRef.current,
          lifetime,
          avgRenderTime: lifetime / renderCountRef.current,
        }
      });
    };
  }, [componentName]);

  return {
    renderCount: renderCountRef.current,
    lifetime: Date.now() - mountTimeRef.current,
  };
}

/**
 * Hook pour détecter les memory leaks via subscriptions
 */
export function useSubscriptionMonitor(subscriptionName: string) {
  const activeSubscriptionsRef = useRef<Set<string>>(new Set());

  const registerSubscription = (id: string) => {
    activeSubscriptionsRef.current.add(id);
    
    if (activeSubscriptionsRef.current.size > 10) {
      logger.warn(`Too many active subscriptions for ${subscriptionName}`, {
        component: 'useSubscriptionMonitor',
        metadata: {
          subscriptionName,
          count: activeSubscriptionsRef.current.size,
          subscriptions: Array.from(activeSubscriptionsRef.current),
        }
      });
    }
  };

  const unregisterSubscription = (id: string) => {
    activeSubscriptionsRef.current.delete(id);
  };

  useEffect(() => {
    return () => {
      if (activeSubscriptionsRef.current.size > 0) {
        logger.warn(`${subscriptionName} unmounted with active subscriptions`, {
          component: 'useSubscriptionMonitor',
          metadata: {
            subscriptionName,
            leakedCount: activeSubscriptionsRef.current.size,
          }
        });
      }
    };
  }, [subscriptionName]);

  return {
    registerSubscription,
    unregisterSubscription,
    activeCount: activeSubscriptionsRef.current.size,
  };
}
