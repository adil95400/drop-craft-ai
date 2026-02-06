/**
 * useSEO — Unified SEO hook (delegates to real Supabase implementation)
 * @deprecated Legacy mock-based version removed. Now uses useRealSEO internally.
 */
export { useRealSEO as useSEO, type SEOAnalysis, type SEOKeyword } from './useRealSEO'
