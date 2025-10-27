/**
 * Code optimization utilities for bundle size and performance
 * Consolidated and optimized version
 */
import { startTransition } from 'react';

// Dynamic imports for heavy libraries
export const loadChartLibrary = () => import('recharts');

// Preload critical chunks with error handling
export const preloadCriticalChunks = async (): Promise<void> => {
  const criticalModules = [
    import('@/components/ui/button'),
    import('@/components/ui/card'),
    import('@/components/ui/dialog'),
    import('@/hooks/use-toast')
  ];
  
  const results = await Promise.allSettled(criticalModules);
  const failures = results.filter(r => r.status === 'rejected');
  
  if (failures.length > 0 && import.meta.env.DEV) {
    console.warn(`Failed to preload ${failures.length} critical modules`);
  }
};

// Cache cleanup with better error handling
export const cleanupUnusedData = async (): Promise<void> => {
  if (!('caches' in window)) return;
  
  try {
    const names = await caches.keys();
    const oldCaches = names.filter(name => 
      name.includes('old') || name.includes('v1')
    );
    
    await Promise.all(oldCaches.map(name => caches.delete(name)));
    
    if (import.meta.env.DEV && oldCaches.length > 0) {
      console.log(`Cleaned up ${oldCaches.length} old cache entries`);
    }
  } catch (error) {
    console.error('Cache cleanup failed:', error);
  }
};

// Service Worker registration with improved error handling
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    if (import.meta.env.DEV) {
      console.log('SW registered:', registration);
    }
    return registration;
  } catch (error) {
    console.error('SW registration failed:', error);
    return null;
  }
};

// React optimization - shallow comparison
export const shouldComponentUpdate = <T extends Record<string, any>>(
  prevProps: T,
  nextProps: T
): boolean => {
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);
  
  if (prevKeys.length !== nextKeys.length) return true;
  
  return prevKeys.some(key => prevProps[key] !== nextProps[key]);
};

// Batch state updates using React 18's startTransition
export const batchStateUpdates = (callback: () => void): void => {
  startTransition(callback);
};
