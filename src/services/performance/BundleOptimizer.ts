import { lazy } from 'react';

// Performance optimization service for code splitting and lazy loading
export class BundleOptimizer {
  private static instance: BundleOptimizer;
  
  public static getInstance(): BundleOptimizer {
    if (!this.instance) {
      this.instance = new BundleOptimizer();
    }
    return this.instance;
  }

  // Lazy load components with performance monitoring
  createLazyComponent(importFn: () => Promise<any>, componentName: string) {
    const LazyComponent = lazy(async () => {
      const startTime = performance.now();
      
      try {
        const module = await importFn();
        const loadTime = performance.now() - startTime;
        
        // Track component load performance
        this.trackComponentLoad(componentName, loadTime);
        
        return module;
      } catch (error) {
        console.error(`Failed to load component ${componentName}:`, error);
        throw error;
      }
    });

    return LazyComponent;
  }

  // Track bundle loading performance
  private trackComponentLoad(componentName: string, loadTime: number): void {
    // Log performance metrics
    console.log(`[Bundle] ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
    
    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      // Example: analytics.track('component_load', { componentName, loadTime });
    }

    // Performance budget warnings
    if (loadTime > 1000) {
      console.warn(`[Performance] ${componentName} took ${loadTime.toFixed(2)}ms to load (>1s)`);
    }
  }

  // Preload critical components
  preloadComponent(importFn: () => Promise<any>, componentName: string): void {
    // Use requestIdleCallback if available, otherwise setTimeout
    const preload = () => {
      importFn()
        .then(() => {
          console.log(`[Preload] ${componentName} preloaded successfully`);
        })
        .catch((error) => {
          console.error(`[Preload] Failed to preload ${componentName}:`, error);
        });
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(preload);
    } else {
      setTimeout(preload, 100);
    }
  }

  // Resource hints for better loading
  addResourceHints(urls: string[]): void {
    urls.forEach(url => {
      // Add prefetch link
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  }

  // Bundle size analysis
  analyzeBundleSize(): void {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      const jsResources = resources.filter(resource => 
        resource.name.includes('.js') && !resource.name.includes('node_modules')
      );

      let totalSize = 0;
      const bundleInfo = jsResources.map(resource => {
        const size = resource.transferSize || 0;
        totalSize += size;
        
        return {
          name: resource.name.split('/').pop(),
          size: this.formatBytes(size),
          loadTime: resource.responseEnd - resource.startTime
        };
      });

      console.group('📦 Bundle Analysis');
      console.log(`Total JS Bundle Size: ${this.formatBytes(totalSize)}`);
      console.table(bundleInfo);
      console.groupEnd();
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Web Vitals monitoring
  measureWebVitals(): void {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          
          console.log(`[Web Vitals] LCP: ${lastEntry.startTime.toFixed(2)}ms`);
          
          // Good: < 2.5s, Needs Improvement: 2.5s - 4s, Poor: > 4s
          if (lastEntry.startTime > 4000) {
            console.warn('[Performance] LCP is poor (>4s)');
          }
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (error) {
        console.log('LCP measurement not supported');
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            console.log(`[Web Vitals] FID: ${entry.processingStart - entry.startTime}ms`);
          });
        });
        
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (error) {
        console.log('FID measurement not supported');
      }
    }
  }

  // Initialize performance monitoring
  initialize(): void {
    // Measure initial load
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.analyzeBundleSize();
        this.measureWebVitals();
      }, 1000);
    });

    // Monitor navigation performance
    if ('navigation' in performance) {
      const nav = performance.navigation as any;
      const timing = performance.timing;
      
      window.addEventListener('load', () => {
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        console.log(`[Performance] Page Load Time: ${loadTime}ms`);
        
        if (loadTime > 3000) {
          console.warn('[Performance] Page load time is slow (>3s)');
        }
      });
    }
  }
}

export const bundleOptimizer = BundleOptimizer.getInstance();