/**
 * @deprecated Use useIntegrationsUnified from '@/hooks/unified' instead
 * This file is kept for backward compatibility and will be removed in a future version
 */
import { 
  useIntegrationsUnified, 
  UnifiedIntegration, 
  IntegrationTemplate as UnifiedIntegrationTemplate,
  SyncLog as UnifiedSyncLog 
} from '@/hooks/unified'

// Re-export types for backward compatibility
export type Integration = UnifiedIntegration
export type IntegrationTemplate = UnifiedIntegrationTemplate
export type SyncLog = UnifiedSyncLog

export function useIntegrations() {
  console.warn('[DEPRECATED] useIntegrations - utilisez useIntegrationsUnified de @/hooks/unified')
  
  const result = useIntegrationsUnified()

  return {
    integrations: result.integrations,
    connectedIntegrations: result.connectedIntegrations,
    syncLogs: result.syncLogs,
    templates: result.templates,
    isLoading: result.isLoading,
    loading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
    fetchIntegrations: result.refetch,
    // Mutations - wrap to match old API signatures
    createIntegration: (template: IntegrationTemplate, config?: any) => 
      result.add({ template, config }),
    updateIntegration: (id: string, updates: Partial<Integration>) => 
      result.update({ id, updates }),
    addIntegration: (template: IntegrationTemplate, config?: any) => 
      result.add({ template, config }),
    connectIntegration: async (template: IntegrationTemplate, credentials?: any) => {
      try {
        await result.connectAsync({ template, credentials })
        return true
      } catch {
        return false
      }
    },
    disconnectIntegration: result.disconnect,
    syncIntegration: result.sync,
    syncData: result.sync,
    testConnection: result.testConnection,
    deleteIntegration: result.delete,
    // Loading states
    isSyncing: result.isSyncing,
    isTesting: result.isTesting,
    isDeleting: result.isDeleting,
    isAdding: result.isAdding,
    isUpdating: result.isUpdating,
  }
}
