/**
 * useRetentionTracking - Track activation, friction & retention events
 * 
 * Tracks key moments in the user journey to identify:
 * - Activation milestones (first product, first order, first integration)
 * - Friction points (errors, abandonments, slow actions)
 * - Feature adoption (which features are used/ignored)
 * - Session behavior (duration, pages visited, return frequency)
 */
import { useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { trackEvent } from '@/lib/analytics'
import { useAuth } from '@/contexts/AuthContext'

// ─── Activation milestones to track ─────────────────────────────
const ACTIVATION_EVENTS = {
  first_product_imported: 'activation_first_product',
  first_integration_connected: 'activation_first_integration',
  first_order_received: 'activation_first_order',
  first_ai_generation: 'activation_first_ai_gen',
  onboarding_completed: 'activation_onboarding_done',
  first_publication: 'activation_first_publish',
} as const

// ─── Feature usage categories ────────────────────────────────────
const FEATURE_PAGES: Record<string, string> = {
  '/products': 'feature_catalog',
  '/products/import': 'feature_import',
  '/orders': 'feature_orders',
  '/analytics': 'feature_analytics',
  '/seo': 'feature_seo',
  '/automation': 'feature_automation',
  '/crm': 'feature_crm',
  '/academy': 'feature_academy',
  '/knowledge-base': 'feature_help',
  '/settings': 'feature_settings',
  '/ai-content': 'feature_ai',
  '/feeds': 'feature_feeds',
  '/ads': 'feature_ads',
}

// ─── Friction detection thresholds ───────────────────────────────
const FRICTION_THRESHOLDS = {
  page_load_slow_ms: 5000,
  rapid_navigation_count: 5, // clicking through 5+ pages in 30s = confusion
  rapid_navigation_window_ms: 30000,
}

export function useRetentionTracking() {
  const location = useLocation()
  const { user } = useAuth()
  const sessionStartRef = useRef(Date.now())
  const pageTimerRef = useRef(Date.now())
  const pagesVisitedRef = useRef<string[]>([])
  const rapidNavRef = useRef<number[]>([])

  // ── Track page views with time-on-page ──
  useEffect(() => {
    const now = Date.now()
    const prevPath = pagesVisitedRef.current[pagesVisitedRef.current.length - 1]
    
    // Track time on previous page
    if (prevPath) {
      const timeSpent = now - pageTimerRef.current
      trackEvent('page_time_spent', {
        page: prevPath,
        duration_ms: timeSpent,
        duration_readable: `${Math.round(timeSpent / 1000)}s`,
      })
    }

    pageTimerRef.current = now
    pagesVisitedRef.current.push(location.pathname)

    // ── Track feature usage ──
    const featureKey = Object.keys(FEATURE_PAGES).find((p) =>
      location.pathname.startsWith(p)
    )
    if (featureKey) {
      trackEvent(FEATURE_PAGES[featureKey], { path: location.pathname })
    }

    // ── Detect rapid navigation (friction signal) ──
    rapidNavRef.current.push(now)
    rapidNavRef.current = rapidNavRef.current.filter(
      (t) => now - t < FRICTION_THRESHOLDS.rapid_navigation_window_ms
    )
    if (rapidNavRef.current.length >= FRICTION_THRESHOLDS.rapid_navigation_count) {
      trackEvent('friction_rapid_navigation', {
        pages_in_window: rapidNavRef.current.length,
        recent_pages: pagesVisitedRef.current.slice(-5),
      })
      rapidNavRef.current = [] // reset after reporting
    }
  }, [location.pathname])

  // ── Track session duration on unmount ──
  useEffect(() => {
    const handleBeforeUnload = () => {
      const sessionDuration = Date.now() - sessionStartRef.current
      trackEvent('session_ended', {
        duration_ms: sessionDuration,
        duration_readable: `${Math.round(sessionDuration / 60000)}min`,
        pages_visited: pagesVisitedRef.current.length,
        unique_pages: new Set(pagesVisitedRef.current).size,
      })
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // ── Track errors (global error handler) ──
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      trackEvent('friction_js_error', {
        message: event.message?.slice(0, 200),
        page: location.pathname,
      })
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackEvent('friction_unhandled_promise', {
        reason: String(event.reason)?.slice(0, 200),
        page: location.pathname,
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [location.pathname])

  // ── Public API for components to report activation events ──
  const trackActivation = useCallback(
    (event: keyof typeof ACTIVATION_EVENTS) => {
      trackEvent(ACTIVATION_EVENTS[event], {
        user_id: user?.id,
        timestamp: new Date().toISOString(),
      })
    },
    [user?.id],
  )

  const trackFriction = useCallback(
    (type: string, details?: Record<string, unknown>) => {
      trackEvent(`friction_${type}`, {
        page: location.pathname,
        ...details,
      })
    },
    [location.pathname],
  )

  return { trackActivation, trackFriction }
}
