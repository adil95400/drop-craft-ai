/**
 * Re-export unified performance optimizations
 * This file maintains backwards compatibility
 */

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

export {
  loadChartLibrary,
  preloadCriticalChunks,
  cleanupUnusedData,
  registerServiceWorker,
  shouldComponentUpdate,
  batchStateUpdates
} from '@/utils/codeOptimizations';

// Re-export from performance components
export {
  LazyLoadWrapper,
  MemoizedListItem,
  VirtualScrollContainer,
  LazyImage,
  useDebounce
} from '@/components/performance/PerformanceOptimizations';

// Performance cache with improved typing
export class PerformanceCache<T = any> {
  private static cache = new Map<string, any>();
  private static maxSize = 100;
  
  static get<T>(key: string): T | undefined {
    return this.cache.get(key);
  }
  
  static set<T>(key: string, value: T): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
  
  static clear(): void {
    this.cache.clear();
  }
  
  static has(key: string): boolean {
    return this.cache.has(key);
  }
  
  static delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  static size(): number {
    return this.cache.size;
  }
}

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
