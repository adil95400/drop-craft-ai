/**
 * Unified Performance Hook - Replaces all redundant performance monitoring hooks
 * Consolidates: usePerformanceMonitor, useGlobalPerformanceMonitor, useSystemMonitoring
 */
import { useEffect, useRef, useCallback } from 'react';
import { usePerformanceStore } from '@/stores/performanceStore';
import { logWarn, logError } from '@/utils/productionLogger';

interface PerformanceOptions {
  componentName?: string;
  maxRenders?: number;
  trackMemory?: boolean;
  trackFPS?: boolean;
}

export function useUnifiedPerformance(options: PerformanceOptions = {}) {
  const {
    componentName = 'Unknown',
    maxRenders = 50,
    trackMemory = false,
    trackFPS = false,
  } = options;

  const { updateMetric, startMonitoring, stopMonitoring } = usePerformanceStore();
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef(Date.now());

  // Track render count
  useEffect(() => {
    renderCountRef.current += 1;

    if (renderCountRef.current > maxRenders) {
      logWarn(
        `Component ${componentName} exceeded ${maxRenders} renders`,
        { renderCount: renderCountRef.current },
        'Performance'
      );
    }
  });

  // Track component lifecycle
  useEffect(() => {
    startMonitoring();
    return () => {
      stopMonitoring();
      const lifetime = Date.now() - mountTimeRef.current;
      
      if (import.meta.env.DEV) {
        logWarn(
          `Component ${componentName} unmounted`,
          {
            totalRenders: renderCountRef.current,
            lifetime,
            avgRenderTime: lifetime / renderCountRef.current,
          },
          'Performance'
        );
      }
    };
  }, [componentName, startMonitoring, stopMonitoring]);

  // Track FPS
  useEffect(() => {
    if (!trackFPS) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      const elapsed = currentTime - lastTime;

      if (elapsed >= 1000) {
        const fps = Math.round((frameCount * 1000) / elapsed);
        updateMetric('fps', fps);
        frameCount = 0;
        lastTime = currentTime;

        if (fps < 30) {
          logWarn(`Low FPS detected: ${fps}`, { component: componentName }, 'Performance');
        }
      }

      rafId = requestAnimationFrame(measureFPS);
    };

    rafId = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(rafId);
  }, [trackFPS, componentName, updateMetric]);

  // Track memory
  useEffect(() => {
    if (!trackMemory || !('memory' in performance)) return;

    const measureMemory = () => {
      const memory = (performance as any).memory;
      if (memory) {
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        const totalMB = memory.totalJSHeapSize / 1024 / 1024;
        const usage = (usedMB / totalMB) * 100;

        updateMetric('memoryUsage', usedMB);

        if (usage > 80) {
          logWarn(
            `High memory usage: ${Math.round(usage)}%`,
            { usedMB: Math.round(usedMB), totalMB: Math.round(totalMB) },
            componentName
          );
        }
      }
    };

    const interval = setInterval(measureMemory, 5000);
    return () => clearInterval(interval);
  }, [trackMemory, componentName, updateMetric]);

  const measurePerformance = useCallback(
    async <T,>(name: string, fn: () => Promise<T> | T): Promise<T> => {
      const startTime = performance.now();

      try {
        const result = await fn();
        const duration = performance.now() - startTime;

        if (duration > 1000) {
          logWarn(`Slow operation: ${name}`, { duration, component: componentName }, 'Performance');
        }

        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        logError(`Operation failed: ${name}`, error as Error, componentName);
        throw error;
      }
    },
    [componentName]
  );

  return {
    renderCount: renderCountRef.current,
    lifetime: Date.now() - mountTimeRef.current,
    measurePerformance,
  };
}
