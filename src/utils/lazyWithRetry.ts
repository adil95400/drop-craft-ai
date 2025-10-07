import { ComponentType, lazy } from 'react';

/**
 * Lazy loading avec retry automatique en cas d'échec
 * Utile pour gérer les erreurs de chargement de chunks
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries = 3
) {
  return lazy(async () => {
    let lastError: Error | undefined;
    
    for (let i = 0; i < retries; i++) {
      try {
        const component = await componentImport();
        return component;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Failed to load component (attempt ${i + 1}/${retries}):`, error);
        
        // Attendre avant de réessayer (exponential backoff)
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
      }
    }
    
    throw lastError || new Error('Failed to load component after retries');
  });
}
