/**
 * Code optimization utilities for bundle size and performance
 */
import React from 'react';

// Dynamic imports for heavy libraries
export const loadChartLibrary = () => import('recharts');

// Chunk optimization
export const preloadCriticalChunks = async () => {
  const criticalModules = [
    import('@/components/ui/button'),
    import('@/components/ui/card'),
    import('@/components/ui/dialog'),
    import('@/hooks/use-toast')
  ];
  
  await Promise.allSettled(criticalModules);
};

// Memory cleanup
export const cleanupUnusedData = () => {
  // Clear old cache entries
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        if (name.includes('old') || name.includes('v1')) {
          caches.delete(name);
        }
      });
    });
  }
};

// Service Worker optimization
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered:', registration);
    } catch (error) {
      console.error('SW registration failed:', error);
    }
  }
};

// React optimization helpers
export const shouldComponentUpdate = <T extends Record<string, any>>(
  prevProps: T,
  nextProps: T
): boolean => {
  return Object.keys(prevProps).some(key => prevProps[key] !== nextProps[key]);
};

// Batch state updates
export const batchStateUpdates = (callback: () => void) => {
  if ('startTransition' in React) {
    (React as any).startTransition(callback);
  } else {
    callback();
  }
};
