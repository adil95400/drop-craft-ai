import { useEffect, useState } from 'react';

interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  performance: boolean;
}

const CONSENT_KEY = 'shopopti_cookie_consent';

/**
 * Hook to conditionally load analytics scripts based on cookie consent.
 * Reads preferences set by the CookieBanner component.
 */
export function useAnalyticsConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      try {
        setConsent(JSON.parse(stored));
      } catch {
        setConsent(null);
      }
    }

    // Listen for consent changes
    const handleStorage = (e: StorageEvent) => {
      if (e.key === CONSENT_KEY && e.newValue) {
        try {
          setConsent(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const analyticsAllowed = consent?.analytics ?? false;
  const performanceAllowed = consent?.performance ?? false;

  return {
    consent,
    analyticsAllowed,
    performanceAllowed,
    hasConsented: consent !== null,
  };
}
