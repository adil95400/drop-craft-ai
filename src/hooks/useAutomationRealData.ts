/**
 * useAutomationRealData — Compatibility layer
 * Canonical: useRealAutomation.ts → automation_workflows table
 */
import { useRealAutomation, useAutomationStats } from './useRealAutomation'
export type { AutomationWorkflow } from './useRealAutomation'

/** Query-shaped wrapper for AutomationPage compatibility */
export function useAutomationWorkflows() {
  const result = useRealAutomation()
  return {
    data: result.workflows,
    isLoading: result.isLoading,
    refetch: result.refetch,
  }
}

export { useAutomationStats }
