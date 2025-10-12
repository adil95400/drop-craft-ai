/**
 * Performance monitoring utilities
 */

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

export const reportWebVitals = (metric: any) => {
  if (process.env.NODE_ENV === 'production') {
    // Send to analytics service
    console.log('Web Vital:', metric);
  }
};

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

// Advanced performance tracking
export class PerformanceTracker {
  private marks: Map<string, number> = new Map();

  mark(name: string) {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string) {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();
    
    if (!start) {
      console.warn(`Start mark "${startMark}" not found`);
      return 0;
    }

    const duration = (end || performance.now()) - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  clear() {
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
  const response = await fetch('/placeholder.svg', { method: 'HEAD' });
  const endTime = performance.now();
  
  return endTime - startTime;
};
