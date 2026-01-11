import { useEffect, useRef } from 'react';

let animationStylesLoaded = false;
let loadingPromise: Promise<void> | null = null;

/**
 * Hook to lazily load animation CSS styles when needed.
 * This reduces initial CSS bundle size by ~26 KiB.
 * The styles are only loaded once across the entire application.
 */
export function useAnimationStyles() {
  const hasRequestedLoad = useRef(false);

  useEffect(() => {
    if (animationStylesLoaded || hasRequestedLoad.current) return;
    hasRequestedLoad.current = true;

    if (!loadingPromise) {
      loadingPromise = import('@/styles/import-animations.css').then(() => {
        animationStylesLoaded = true;
      });
    }
  }, []);

  return animationStylesLoaded;
}

/**
 * Preload animation styles for components that will need them.
 * Call this in advance to avoid flash of unstyled content.
 */
export function preloadAnimationStyles(): Promise<void> {
  if (animationStylesLoaded) return Promise.resolve();
  
  if (!loadingPromise) {
    loadingPromise = import('@/styles/import-animations.css').then(() => {
      animationStylesLoaded = true;
    });
  }
  
  return loadingPromise;
}
