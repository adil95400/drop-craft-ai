/**
 * useImportJobs — Unified import jobs hook (delegates to real Supabase implementation)
 * Uses `jobs` table (unified system) via useRealImportMethods internally.
 */
export { useRealImportMethods as useImportJobs, type ImportMethod } from './useRealImportMethods'
