import { useEffect } from 'react';
import { shouldRedirectToCanonical } from '@/config/domains';

/**
 * Hook to handle www to non-www canonical redirect
 * This is a client-side fallback - the main redirect should happen at CDN/server level
 */
export function useCanonicalRedirect() {
  useEffect(() => {
    if (shouldRedirectToCanonical()) {
      // Replace www.shopopti.io with shopopti.io
      const newUrl = window.location.href.replace('www.shopopti.io', 'shopopti.io');
      window.location.replace(newUrl);
    }
  }, []);
}
