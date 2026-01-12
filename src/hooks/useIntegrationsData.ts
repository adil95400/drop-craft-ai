// DEPRECATED: Use useIntegrationsUnified instead
// This file is kept for backward compatibility only
import { useIntegrationsUnified, type UnifiedIntegration } from './unified/useIntegrationsUnified'

export type Integration = UnifiedIntegration

export function useIntegrationsData() {
  console.warn('[DEPRECATED] useIntegrationsData - utilisez useIntegrationsUnified à la place')
  const result = useIntegrationsUnified()

  return {
    integrations: result.integrations,
    loading: result.isLoading,
    error: result.error ? String(result.error) : null,
    refetch: () => { result.refetch() },
    syncIntegration: result.sync,
    disconnectIntegration: result.disconnect
  }
}
