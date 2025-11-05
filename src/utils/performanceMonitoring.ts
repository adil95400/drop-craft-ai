/**
 * Unified Performance Monitoring System
 * Central service for all performance tracking
 */

type PerformanceMetric = {
  name: string;
  duration: number;
  timestamp: number;
};

class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 100;

  static getInstance(): PerformanceMonitoringService {
    if (!this.instance) {
      this.instance = new PerformanceMonitoringService();
    }
    return this.instance;
  }

  // Performance measurement
  measurePerformance(metricName: string) {
    const startTime = performance.now();
    
    return {
      end: () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.recordMetric(metricName, duration);
        
        if (duration > 1000) {
          console.warn(`⚠️ Slow operation: ${metricName} took ${duration.toFixed(2)}ms`);
        }
        
        return duration;
      }
    };
  }

  private recordMetric(name: string, duration: number) {
    this.metrics.push({ name, duration, timestamp: Date.now() });
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  clearMetrics() {
    this.metrics = [];
  }

  // Web Vitals reporting
  reportWebVitals(metric: any) {
    if (import.meta.env.PROD) {
      console.log('Web Vital:', metric);
    }
  }

  // Image preloading
  preloadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  }

  async preloadImages(urls: string[]): Promise<void> {
    await Promise.all(urls.map(url => this.preloadImage(url)));
  }
}

// Export singleton instance
export const performanceMonitoring = PerformanceMonitoringService.getInstance();

// Legacy exports for backward compatibility
export const measurePerformance = (metricName: string) => 
  performanceMonitoring.measurePerformance(metricName);
export const reportWebVitals = (metric: any) => 
  performanceMonitoring.reportWebVitals(metric);
export const preloadImage = (src: string) => 
  performanceMonitoring.preloadImage(src);
export const preloadImages = (urls: string[]) => 
  performanceMonitoring.preloadImages(urls);

// Advanced performance tracking with marks
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
    if (import.meta.env.DEV) {
      console.log(`📍 Mark: ${name}`);
    }
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

    performanceMonitoring.measurePerformance(name).end();
    
    return duration;
  }

  clear(): void {
    this.marks.clear();
  }

  getMarks(): Map<string, number> {
    return new Map(this.marks);
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
