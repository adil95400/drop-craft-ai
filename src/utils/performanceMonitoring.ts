/**
 * Unified Performance Monitoring System
 * Consolidates all performance tracking utilities
 */

// Performance measurement
export const measurePerformance = (metricName: string) => {
  const startTime = performance.now();
  
  return {
    end: () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 1000) {
        console.warn(`⚠️ Slow operation: ${metricName} took ${duration.toFixed(2)}ms`);
      }
      
      return duration;
    }
  };
};

// Web Vitals reporting
export const reportWebVitals = (metric: any) => {
  if (import.meta.env.PROD) {
    console.log('Web Vital:', metric);
  }
};

// Image preloading
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

export const preloadImages = async (urls: string[]): Promise<void> => {
  await Promise.all(urls.map(url => preloadImage(url)));
};

// Advanced performance tracking with singleton pattern
export class PerformanceTracker {
  private static instance: PerformanceTracker;
  private marks: Map<string, number> = new Map();

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();
    
    if (!start) {
      console.warn(`Start mark "${startMark}" not found`);
      return 0;
    }

    const duration = (end || performance.now()) - start;
    
    if (import.meta.env.DEV) {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  clear(): void {
    this.marks.clear();
  }
}

// Memory monitoring
export const monitorMemory = () => {
  if ('memory' in performance) {
    const mem = (performance as any).memory;
    return {
      usedJSHeapSize: (mem.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
      totalJSHeapSize: (mem.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
      jsHeapSizeLimit: (mem.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
    };
  }
  return null;
};

// Network performance
export const monitorNetworkSpeed = async (): Promise<number> => {
  const startTime = performance.now();
  try {
    await fetch('/placeholder.svg', { method: 'HEAD' });
    return performance.now() - startTime;
  } catch (error) {
    console.error('Network speed test failed:', error);
    return -1;
  }
};

// Export singleton instance
export const performanceTracker = PerformanceTracker.getInstance();
