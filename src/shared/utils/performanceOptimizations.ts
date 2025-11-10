/**
 * Centralized performance optimizations
 * All performance utilities in one place
 */

// Core services
export { performanceMonitoring } from '@/utils/performanceMonitoring';
export { performanceService } from '@/services/performance/PerformanceService';

// Monitoring utilities
export {
  measurePerformance,
  reportWebVitals,
  preloadImage,
  preloadImages,
  PerformanceTracker,
  performanceTracker,
  monitorMemory,
  monitorNetworkSpeed
} from '@/utils/performanceMonitoring';

// Code optimizations
export {
  loadChartLibrary,
  preloadCriticalChunks,
  cleanupUnusedData,
  registerServiceWorker,
  shouldComponentUpdate,
  batchStateUpdates
} from '@/utils/codeOptimizations';

// UI components
export {
  LazyLoadWrapper,
  MemoizedListItem,
  VirtualScrollContainer,
  LazyImage,
  useDebounce
} from '@/components/performance/PerformanceOptimizations';

// Unified services (replaces old cache services)
export { unifiedCache } from '@/services/UnifiedCacheService';
export { useUnifiedPerformance } from '@/hooks/useUnifiedPerformance';

// Improved debounce with TypeScript generics
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Improved throttle with TypeScript generics
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Memoization helpers
export const memoizedComponents = {
  areEqual: <T extends Record<string, any>>(prevProps: T, nextProps: T): boolean => {
    const keys = Object.keys(prevProps);
    if (keys.length !== Object.keys(nextProps).length) return false;
    
    return keys.every(key => prevProps[key] === nextProps[key]);
  },
  
  shallowEqual: <T extends Record<string, any>>(obj1: T, obj2: T): boolean => {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    return keys1.every(key => obj1[key] === obj2[key]);
  }
};
