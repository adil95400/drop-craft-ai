import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { initAnalytics, trackPageView } from '@/lib/analytics'
import { useAnalyticsConsent } from '@/hooks/useAnalyticsConsent'

/**
 * RGPD-compliant page tracking.
 * - Only loads GA4/analytics AFTER cookie consent
 * - Excludes private routes (/dashboard, /app, /settings, /auth, etc.)
 */
const PRIVATE_PREFIXES = ['/dashboard', '/app', '/settings', '/auth', '/admin', '/onboarding']

function isPrivateRoute(path: string): boolean {
  return PRIVATE_PREFIXES.some((p) => path.startsWith(p))
}

export function usePageTracking() {
  const location = useLocation()
  const { analyticsAllowed } = useAnalyticsConsent()
  const initialised = useRef(false)

  // Init analytics only once, only after consent
  useEffect(() => {
    if (analyticsAllowed && !initialised.current) {
      initAnalytics()
      initialised.current = true
    }
  }, [analyticsAllowed])

  // Track page views only on marketing pages + after consent
  useEffect(() => {
    if (!analyticsAllowed || !initialised.current) return
    const path = location.pathname + location.search
    if (isPrivateRoute(location.pathname)) return
    trackPageView(path)
  }, [location.pathname, location.search, analyticsAllowed])
}
