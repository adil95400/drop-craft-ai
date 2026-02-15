/**
 * Sprint 6: Performance Monitoring Hook
 * Tracks Web Vitals, API latency, and component render performance
 */
import { useState, useEffect, useCallback, useRef } from 'react';

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number | null;       // Largest Contentful Paint (ms)
  fid: number | null;       // First Input Delay (ms)
  cls: number | null;       // Cumulative Layout Shift
  fcp: number | null;       // First Contentful Paint (ms)
  ttfb: number | null;      // Time to First Byte (ms)

  // Custom metrics
  apiLatency: ApiLatencyStats;
  memoryUsage: MemoryInfo | null;
  navigationTiming: NavigationTimingInfo | null;
  errorCount: number;
  warningCount: number;
}

export interface ApiLatencyStats {
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  totalRequests: number;
  failedRequests: number;
  successRate: number;
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usagePercent: number;
}

interface NavigationTimingInfo {
  domContentLoaded: number;
  domComplete: number;
  loadComplete: number;
  redirectTime: number;
  dnsLookup: number;
  tcpConnect: number;
}

interface ApiCall {
  url: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
}

const MAX_API_CALLS = 500;

class PerformanceTracker {
  private static instance: PerformanceTracker;
  private apiCalls: ApiCall[] = [];
  private errors = 0;
  private warnings = 0;
  private listeners: Set<() => void> = new Set();

  static getInstance(): PerformanceTracker {
    if (!this.instance) this.instance = new PerformanceTracker();
    return this.instance;
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  trackApiCall(call: ApiCall) {
    this.apiCalls.push(call);
    if (this.apiCalls.length > MAX_API_CALLS) {
      this.apiCalls = this.apiCalls.slice(-MAX_API_CALLS);
    }
    this.notify();
  }

  trackError() { this.errors++; this.notify(); }
  trackWarning() { this.warnings++; this.notify(); }

  getApiLatencyStats(): ApiLatencyStats {
    if (this.apiCalls.length === 0) {
      return { avg: 0, p50: 0, p95: 0, p99: 0, totalRequests: 0, failedRequests: 0, successRate: 100 };
    }

    const durations = this.apiCalls.map(c => c.duration).sort((a, b) => a - b);
    const failed = this.apiCalls.filter(c => c.status >= 400).length;

    return {
      avg: Math.round(durations.reduce((s, d) => s + d, 0) / durations.length),
      p50: durations[Math.floor(durations.length * 0.5)] ?? 0,
      p95: durations[Math.floor(durations.length * 0.95)] ?? 0,
      p99: durations[Math.floor(durations.length * 0.99)] ?? 0,
      totalRequests: this.apiCalls.length,
      failedRequests: failed,
      successRate: Math.round(((this.apiCalls.length - failed) / this.apiCalls.length) * 100),
    };
  }

  getErrorCount() { return this.errors; }
  getWarningCount() { return this.warnings; }
  getRecentCalls(n = 20) { return this.apiCalls.slice(-n); }
}

export const performanceTracker = PerformanceTracker.getInstance();

// Intercept fetch for automatic API tracking
const originalFetch = window.fetch;
window.fetch = async function (...args) {
  const start = performance.now();
  const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
  const method = (args[1]?.method || 'GET').toUpperCase();

  try {
    const response = await originalFetch.apply(this, args);
    performanceTracker.trackApiCall({
      url, method,
      duration: Math.round(performance.now() - start),
      status: response.status,
      timestamp: Date.now(),
    });
    if (response.status >= 500) performanceTracker.trackError();
    return response;
  } catch (error) {
    performanceTracker.trackApiCall({
      url, method,
      duration: Math.round(performance.now() - start),
      status: 0,
      timestamp: Date.now(),
    });
    performanceTracker.trackError();
    throw error;
  }
};

function getWebVitals(): Pick<PerformanceMetrics, 'lcp' | 'fid' | 'cls' | 'fcp' | 'ttfb'> {
  const result = { lcp: null as number | null, fid: null as number | null, cls: null as number | null, fcp: null as number | null, ttfb: null as number | null };

  try {
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find(e => e.name === 'first-contentful-paint');
    if (fcpEntry) result.fcp = Math.round(fcpEntry.startTime);

    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navEntries[0]) result.ttfb = Math.round(navEntries[0].responseStart);
  } catch { /* metrics not available */ }

  return result;
}

function getMemoryInfo(): MemoryInfo | null {
  try {
    const mem = (performance as any).memory;
    if (!mem) return null;
    return {
      usedJSHeapSize: mem.usedJSHeapSize,
      totalJSHeapSize: mem.totalJSHeapSize,
      jsHeapSizeLimit: mem.jsHeapSizeLimit,
      usagePercent: Math.round((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100),
    };
  } catch { return null; }
}

function getNavigationTiming(): NavigationTimingInfo | null {
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!nav) return null;
    return {
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.fetchStart),
      domComplete: Math.round(nav.domComplete - nav.fetchStart),
      loadComplete: Math.round(nav.loadEventEnd - nav.fetchStart),
      redirectTime: Math.round(nav.redirectEnd - nav.redirectStart),
      dnsLookup: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
      tcpConnect: Math.round(nav.connectEnd - nav.connectStart),
    };
  } catch { return null; }
}

export function usePerformanceMonitoring(refreshIntervalMs = 5000): PerformanceMetrics {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    ...getWebVitals(),
    apiLatency: performanceTracker.getApiLatencyStats(),
    memoryUsage: getMemoryInfo(),
    navigationTiming: getNavigationTiming(),
    errorCount: 0,
    warningCount: 0,
  });

  const refresh = useCallback(() => {
    setMetrics({
      ...getWebVitals(),
      apiLatency: performanceTracker.getApiLatencyStats(),
      memoryUsage: getMemoryInfo(),
      navigationTiming: getNavigationTiming(),
      errorCount: performanceTracker.getErrorCount(),
      warningCount: performanceTracker.getWarningCount(),
    });
  }, []);

  useEffect(() => {
    const unsub = performanceTracker.subscribe(refresh);
    const interval = setInterval(refresh, refreshIntervalMs);
    return () => { unsub(); clearInterval(interval); };
  }, [refresh, refreshIntervalMs]);

  return metrics;
}
