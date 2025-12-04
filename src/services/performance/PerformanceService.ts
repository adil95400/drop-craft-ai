/**
 * Centralized Performance Service
 * Combines monitoring, optimization, and tracking
 */

import { lazy, ComponentType } from 'react';
import { performanceMonitoring } from '@/utils/performanceMonitoring';

export class PerformanceService {
  private static instance: PerformanceService;
  private componentLoadTimes: Map<string, number> = new Map();

  static getInstance(): PerformanceService {
    if (!this.instance) {
      this.instance = new PerformanceService();
    }
    return this.instance;
  }

  /**
   * Lazy load component with retry and performance tracking
   */
  createLazyComponent<T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    componentName: string,
    retries = 3
  ) {
    return lazy(async () => {
      let lastError: Error | undefined;
      const measure = performanceMonitoring.measurePerformance(`lazy-${componentName}`);
      
      for (let i = 0; i < retries; i++) {
        try {
          const module = await importFn();
          const loadTime = measure.end();
          
          this.trackComponentLoad(componentName, loadTime);
          
          return module;
        } catch (error) {
          lastError = error as Error;
          console.warn(`Failed to load ${componentName} (attempt ${i + 1}/${retries}):`, error);
          
          // Exponential backoff
          if (i < retries - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
          }
        }
      }
      
      measure.end();
      throw lastError || new Error(`Failed to load ${componentName} after ${retries} retries`);
    });
  }

  /**
   * Track component load performance
   */
  private trackComponentLoad(componentName: string, loadTime: number): void {
    this.componentLoadTimes.set(componentName, loadTime);
    
    console.log(`[Performance] ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
    
    if (loadTime > 1000) {
      console.warn(`[Performance] ${componentName} took ${loadTime.toFixed(2)}ms to load (>1s)`);
    }
  }

  /**
   * Preload component during idle time
   */
  preloadComponent(importFn: () => Promise<any>, componentName: string): void {
    const preload = () => {
      importFn()
        .then(() => console.log(`[Preload] ${componentName} preloaded`))
        .catch((error) => console.error(`[Preload] Failed to preload ${componentName}:`, error));
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(preload);
    } else {
      setTimeout(preload, 100);
    }
  }

  /**
   * Add resource hints for prefetching
   */
  addResourceHints(urls: string[]): void {
    urls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  }

  /**
   * Bundle size analysis
   */
  analyzeBundleSize(): void {
    if (!('performance' in window)) return;

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const jsResources = resources.filter(r => r.name.includes('.js'));

    let totalSize = 0;
    const bundleInfo = jsResources.map(resource => {
      const size = resource.transferSize || 0;
      totalSize += size;
      
      return {
        name: resource.name.split('/').pop(),
        size: this.formatBytes(size),
        loadTime: (resource.responseEnd - resource.startTime).toFixed(2) + 'ms'
      };
    });

    console.group('📦 Bundle Analysis');
    console.log(`Total JS Bundle Size: ${this.formatBytes(totalSize)}`);
    console.table(bundleInfo);
    console.groupEnd();
  }

  /**
   * Measure Web Vitals
   */
  measureWebVitals(): void {
    if (!('PerformanceObserver' in window)) return;

    // Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        
        console.log(`[LCP] ${lastEntry.startTime.toFixed(2)}ms`);
        
        if (lastEntry.startTime > 4000) {
          console.warn('[LCP] Poor performance (>4s)');
        }
      });
      
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // LCP not supported
    }

    // First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime;
          console.log(`[FID] ${fid.toFixed(2)}ms`);
        });
      });
      
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // FID not supported
    }

    // Cumulative Layout Shift
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        
        console.log(`[CLS] ${clsValue.toFixed(4)}`);
        
        if (clsValue > 0.25) {
          console.warn('[CLS] Poor layout stability (>0.25)');
        }
      });
      
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // CLS not supported
    }

    // Time to First Byte
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const ttfb = navigation.responseStart - navigation.requestStart;
        console.log(`[TTFB] ${ttfb.toFixed(2)}ms`);
        
        if (ttfb > 800) {
          console.warn('[TTFB] Slow server response (>800ms)');
        }
      }
    } catch (e) {
      // Navigation timing not supported
    }
  }

  /**
   * Initialize performance monitoring
   */
  initialize(): void {
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.analyzeBundleSize();
        this.measureWebVitals();
      }, 1000);
    });
  }

  /**
   * Get component load statistics
   */
  getComponentStats() {
    return Object.fromEntries(this.componentLoadTimes);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const performanceService = PerformanceService.getInstance();
