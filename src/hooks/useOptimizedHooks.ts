import { useEffect, useRef, useState } from 'react';

import { usePerformanceStore } from '@/stores/globalStore';

interface UsePerformanceMonitorOptions {
  measureRender?: boolean;
  measureLoad?: boolean;
  enableWebVitals?: boolean;
}

export function usePerformanceMonitor(options: UsePerformanceMonitorOptions = {}) {
  const { measureRender = true, measureLoad = true, enableWebVitals = true } = options;
  const { updateMetrics } = usePerformanceStore();
  const renderStartRef = useRef<number>();

  useEffect(() => {
    if (measureRender) {
      renderStartRef.current = performance.now();
    }

    return () => {
      if (measureRender && renderStartRef.current) {
        const renderTime = performance.now() - renderStartRef.current;
        updateMetrics({ renderTime });
      }
    };
  }, [measureRender, updateMetrics]);

  useEffect(() => {
    if (!measureLoad && !enableWebVitals) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          const loadTime = navEntry.loadEventEnd - navEntry.loadEventStart;
          updateMetrics({ loadTime });
        }

        if (entry.entryType === 'largest-contentful-paint') {
          console.log(`LCP: ${entry.startTime}ms`);
        }

        if (entry.entryType === 'first-input') {
          console.log(`FID: ${(entry as any).processingStart - entry.startTime}ms`);
        }
      });
    });

    try {
      if (measureLoad) {
        observer.observe({ entryTypes: ['navigation'] });
      }
      
      if (enableWebVitals) {
        observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
      }
    } catch (error) {
      console.warn('Performance Observer not supported', error);
    }

    return () => observer.disconnect();
  }, [measureLoad, enableWebVitals, updateMetrics]);
}

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);
  
  callbackRef.current = callback;

  return useRef(((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }) as T).current;
}

export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0);
  const callbackRef = useRef(callback);
  
  callbackRef.current = callback;

  return useRef(((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now;
      return callbackRef.current(...args);
    }
  }) as T).current;
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useRef((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }).current;

  return [storedValue, setValue];
}

export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const elementRef = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver>();

  useEffect(() => {
    if (!elementRef.current) return;

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Element is visible
          entry.target.classList.add('animate-in');
        }
      });
    }, options);

    observerRef.current.observe(elementRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [options]);

  return elementRef;
}