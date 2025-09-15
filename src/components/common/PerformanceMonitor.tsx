import React from 'react';

import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { createSupabaseQuery } from '@/lib/fetcher';
import { supabase } from '@/integrations/supabase/client';
import { logAction, logWarning } from '@/utils/consoleCleanup';

interface PerformanceMonitorProps {
  children: React.ReactNode;
}

export function PerformanceMonitor({ children }: PerformanceMonitorProps) {
  // Monitor critical metrics (simplified for demo)
  const { data: appHealth } = useOptimizedQuery(
    ['app', 'health'],
    createSupabaseQuery(async () => {
      // Simple health check - return mock data for now
      return { data: { status: 'healthy', uptime: '99.9%' }, error: null };
    }),
    {
      staleTime: 30 * 1000, // 30 seconds
      refetchOnWindowFocus: false,
    }
  );

  // Performance observer for Web Vitals
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Observe Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lcp = entries[entries.length - 1] as PerformanceEntry;
        
        if (lcp.startTime > 2500) {
          logWarning(`LCP slow: ${lcp.startTime}ms`, 'PerformanceMonitor');
        }
      });

      // Observe Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        
        if (clsValue > 0.1) {
          logWarning(`CLS high: ${clsValue}`, 'PerformanceMonitor');
        }
      });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        logWarning('Performance observer not supported', 'PerformanceMonitor');
      }

      return () => {
        lcpObserver.disconnect();
        clsObserver.disconnect();
      };
    }
  }, []);

  // Report performance metrics in development
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const reportPerformance = () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          const metrics = {
            'DNS Lookup': navigation.domainLookupEnd - navigation.domainLookupStart,
            'TCP Connect': navigation.connectEnd - navigation.connectStart,
            'Request': navigation.responseStart - navigation.requestStart,
            'Response': navigation.responseEnd - navigation.responseStart,
            'DOM Parse': navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            'Total Load Time': navigation.loadEventEnd - navigation.loadEventStart,
          };

          console.group('⚡ Performance Metrics');
          Object.entries(metrics).forEach(([key, value]) => {
            if (value > 0) {
              const color = value > 1000 ? 'color: red' : value > 500 ? 'color: orange' : 'color: green';
              logAction(`${key}: ${Math.round(value)}ms`);
            }
          });
          console.groupEnd();
        }
      };

      // Report after page load
      if (document.readyState === 'complete') {
        setTimeout(reportPerformance, 1000);
      } else {
        window.addEventListener('load', () => setTimeout(reportPerformance, 1000));
      }
    }
  }, []);

  return <>{children}</>;
}