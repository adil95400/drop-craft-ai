import { useEffect, useRef } from 'react';
import { usePerformanceStore } from '@/stores/performanceStore';
import { useCacheStore } from '@/stores/cacheStore';

export const useGlobalPerformanceMonitor = () => {
  const { updateMetric, updateMetrics, startMonitoring, stopMonitoring } = usePerformanceStore();
  const { updateStats } = useCacheStore();
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const rafIdRef = useRef<number>();

  useEffect(() => {
    startMonitoring();

    // Monitoring FPS
    const measureFPS = () => {
      frameCountRef.current++;
      const currentTime = performance.now();
      const elapsed = currentTime - lastTimeRef.current;

      if (elapsed >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / elapsed);
        updateMetric('fps', fps);
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
      }

      rafIdRef.current = requestAnimationFrame(measureFPS);
    };

    rafIdRef.current = requestAnimationFrame(measureFPS);

    // Monitoring mémoire (si disponible)
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        updateMetric('memoryUsage', usedMB);
      }
    };

    const memoryInterval = setInterval(measureMemory, 5000);

    // Monitoring des connexions réseau
    const measureConnections = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        updateMetrics({
          activeConnections: 1, // Simplifié pour l'exemple
        });
      }
    };

    const connectionsInterval = setInterval(measureConnections, 3000);

    // Update cache stats régulièrement
    const cacheInterval = setInterval(() => {
      updateStats();
    }, 2000);

    // Performance Observer pour les Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        // LCP - Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          if (lastEntry) {
            updateMetric('renderTime', lastEntry.renderTime || lastEntry.duration);
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Navigation Timing
        const navigationObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.responseEnd && entry.requestStart) {
              const latency = entry.responseEnd - entry.requestStart;
              updateMetric('apiLatency', latency);
            }
          });
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
      } catch (e) {
        console.warn('Performance Observer not fully supported:', e);
      }
    }

    return () => {
      stopMonitoring();
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      clearInterval(memoryInterval);
      clearInterval(connectionsInterval);
      clearInterval(cacheInterval);
    };
  }, [updateMetric, updateMetrics, updateStats, startMonitoring, stopMonitoring]);
};
