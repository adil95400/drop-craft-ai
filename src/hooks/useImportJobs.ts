/**
 * useImportJobs — Unified import jobs hook (delegates to real Supabase implementation)
 * Uses background_jobs table via useRealImportMethods internally.
 */
export { useRealImportMethods as useImportJobs, type ImportMethod } from './useRealImportMethods'
