import { useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  ttfb: number | null;
  fcp: number | null;
}

/**
 * Core Web Vitals monitoring hook.
 * Observes LCP, FID, CLS, TTFB, FCP and logs to console in dev.
 * In production, metrics can be sent to an analytics endpoint.
 */
export function usePerformanceMonitor(enabled = true) {
  const reportMetric = useCallback((name: string, value: number) => {
    if (import.meta.env.DEV) {
      const color = value > getThreshold(name) ? '#ef4444' : '#22c55e';
      console.log(
        `%c[Perf] ${name}: ${Math.round(value)}ms`,
        `color: ${color}; font-weight: bold;`
      );
    }
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const observers: PerformanceObserver[] = [];

    try {
      // Largest Contentful Paint
      const lcpObs = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) reportMetric('LCP', last.startTime);
      });
      lcpObs.observe({ type: 'largest-contentful-paint', buffered: true });
      observers.push(lcpObs);

      // First Input Delay
      const fidObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as PerformanceEventTiming;
          reportMetric('FID', fidEntry.processingStart - fidEntry.startTime);
        }
      });
      fidObs.observe({ type: 'first-input', buffered: true });
      observers.push(fidObs);

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        reportMetric('CLS', clsValue * 1000); // multiply for readability
      });
      clsObs.observe({ type: 'layout-shift', buffered: true });
      observers.push(clsObs);

      // First Contentful Paint
      const fcpObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            reportMetric('FCP', entry.startTime);
          }
        }
      });
      fcpObs.observe({ type: 'paint', buffered: true });
      observers.push(fcpObs);

      // TTFB from navigation timing
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries.length > 0) {
        const nav = navEntries[0] as PerformanceNavigationTiming;
        reportMetric('TTFB', nav.responseStart - nav.requestStart);
      }
    } catch {
      // PerformanceObserver not supported in some browsers
    }

    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, [enabled, reportMetric]);
}

function getThreshold(metric: string): number {
  switch (metric) {
    case 'LCP': return 2500;
    case 'FID': return 100;
    case 'CLS': return 100; // 0.1 * 1000
    case 'FCP': return 1800;
    case 'TTFB': return 800;
    default: return 1000;
  }
}
