/**
 * useReviews — Unified reviews hook (delegates to real Supabase implementation)
 * @deprecated Legacy mock version removed. Now uses useRealReviews internally.
 */
export { useRealReviews as useReviews, type Review, type ReviewStats } from './useRealReviews'
