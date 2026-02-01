/**
 * Unified Import Module - Pro Advanced
 * 
 * This module provides a complete import solution with:
 * - Unified import hook (orchestrates all import sources)
 * - Realtime progress tracking
 * - Parallel workers with throttling
 * - AI auto-enrichment
 * - i18n support
 */

export { 
  useUnifiedImport,
  type ImportSource,
  type ImportStatus,
  type ImportProgress,
  type ImportOptions,
  type ImportResult
} from './useUnifiedImport'

export { 
  useImportRealtime,
  type RealtimeImportJob 
} from './useImportRealtime'

// Re-export legacy hooks for backward compatibility
export { useBulkImport } from '../useBulkImport'
export { useOptimizedImport } from '../useOptimizedImport'
export { useExtensionImport } from '../useExtensionImport'
