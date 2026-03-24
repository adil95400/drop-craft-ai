/**
 * useAutomationRealData — Compatibility re-export
 * Canonical hook: useRealAutomation.ts
 * All consumers should migrate to useRealAutomation directly.
 */
export { useRealAutomation as useAutomationWorkflows } from './useRealAutomation'
export type { AutomationWorkflow } from './useRealAutomation'

// Re-export stats from the canonical Supabase-direct hook for AutomationPage
export { useAutomationStats } from './useRealAutomation'
