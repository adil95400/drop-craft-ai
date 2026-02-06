/**
 * useAnalytics — Unified analytics hook (delegates to real Supabase implementation)
 * @deprecated Legacy version removed. Now uses useRealAnalytics internally.
 */
export { useRealAnalytics as useAnalytics, type RealAnalytics as Analytics } from './useRealAnalytics'
