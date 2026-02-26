import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageView } from '@/lib/analytics'

/**
 * Automatically tracks SPA page views on route changes.
 * Drop this hook into any layout / root component.
 */
export function usePageTracking() {
  const location = useLocation()

  useEffect(() => {
    trackPageView(location.pathname + location.search)
  }, [location.pathname, location.search])
}
