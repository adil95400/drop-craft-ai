/**
 * Core Web Vitals monitoring hook
 * Tracks LCP, FID, CLS, INP, TTFB for performance insights
 */
import { useState, useEffect, useCallback } from 'react';

export interface WebVitalsMetrics {
  lcp: number | null;   // Largest Contentful Paint (ms)
  fid: number | null;   // First Input Delay (ms)
  cls: number | null;   // Cumulative Layout Shift
  inp: number | null;   // Interaction to Next Paint (ms)
  ttfb: number | null;  // Time to First Byte (ms)
  fcp: number | null;   // First Contentful Paint (ms)
}

export interface VitalScore {
  value: number | null;
  rating: 'good' | 'needs-improvement' | 'poor' | 'pending';
  label: string;
  unit: string;
  thresholds: { good: number; poor: number };
}

const THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  inp: { good: 200, poor: 500 },
  ttfb: { good: 800, poor: 1800 },
  fcp: { good: 1800, poor: 3000 },
};

function getRating(value: number | null, thresholds: { good: number; poor: number }): VitalScore['rating'] {
  if (value === null) return 'pending';
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

export function useCoreWebVitals() {
  const [metrics, setMetrics] = useState<WebVitalsMetrics>({
    lcp: null, fid: null, cls: null, inp: null, ttfb: null, fcp: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    const observers: PerformanceObserver[] = [];

    // LCP
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        if (lastEntry) {
          setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      observers.push(lcpObserver);
    } catch {}

    // FID
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstEntry = entries[0] as any;
        if (firstEntry) {
          setMetrics(prev => ({ ...prev, fid: firstEntry.processingStart - firstEntry.startTime }));
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
      observers.push(fidObserver);
    } catch {}

    // CLS
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        setMetrics(prev => ({ ...prev, cls: clsValue }));
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      observers.push(clsObserver);
    } catch {}

    // FCP
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(e => e.name === 'first-contentful-paint');
        if (fcpEntry) {
          setMetrics(prev => ({ ...prev, fcp: fcpEntry.startTime }));
        }
      });
      fcpObserver.observe({ type: 'paint', buffered: true });
      observers.push(fcpObserver);
    } catch {}

    // TTFB from navigation timing
    try {
      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navEntries.length > 0) {
        setMetrics(prev => ({ ...prev, ttfb: navEntries[0].responseStart }));
      }
    } catch {}

    // INP (Interaction to Next Paint)
    try {
      const inpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[];
        let maxDuration = 0;
        for (const entry of entries) {
          if (entry.duration > maxDuration) maxDuration = entry.duration;
        }
        if (maxDuration > 0) {
          setMetrics(prev => ({ ...prev, inp: maxDuration }));
        }
      });
      inpObserver.observe({ type: 'event', buffered: true });
      observers.push(inpObserver);
    } catch {}

    return () => {
      observers.forEach(o => o.disconnect());
    };
  }, []);

  const getVitalScores = useCallback((): Record<string, VitalScore> => ({
    lcp: {
      value: metrics.lcp,
      rating: getRating(metrics.lcp, THRESHOLDS.lcp),
      label: 'LCP',
      unit: 'ms',
      thresholds: THRESHOLDS.lcp,
    },
    fid: {
      value: metrics.fid,
      rating: getRating(metrics.fid, THRESHOLDS.fid),
      label: 'FID',
      unit: 'ms',
      thresholds: THRESHOLDS.fid,
    },
    cls: {
      value: metrics.cls,
      rating: getRating(metrics.cls, THRESHOLDS.cls),
      label: 'CLS',
      unit: '',
      thresholds: THRESHOLDS.cls,
    },
    inp: {
      value: metrics.inp,
      rating: getRating(metrics.inp, THRESHOLDS.inp),
      label: 'INP',
      unit: 'ms',
      thresholds: THRESHOLDS.inp,
    },
    ttfb: {
      value: metrics.ttfb,
      rating: getRating(metrics.ttfb, THRESHOLDS.ttfb),
      label: 'TTFB',
      unit: 'ms',
      thresholds: THRESHOLDS.ttfb,
    },
    fcp: {
      value: metrics.fcp,
      rating: getRating(metrics.fcp, THRESHOLDS.fcp),
      label: 'FCP',
      unit: 'ms',
      thresholds: THRESHOLDS.fcp,
    },
  }), [metrics]);

  const overallScore = useCallback((): number => {
    const scores = getVitalScores();
    const validScores = Object.values(scores).filter(s => s.value !== null);
    if (validScores.length === 0) return 0;
    const goodCount = validScores.filter(s => s.rating === 'good').length;
    return Math.round((goodCount / validScores.length) * 100);
  }, [getVitalScores]);

  return { metrics, getVitalScores, overallScore };
}
