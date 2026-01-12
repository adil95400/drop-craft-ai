/**
 * @deprecated Use useIntegrationsUnified from '@/hooks/unified' instead
 * This file is kept for backward compatibility and will be removed in a future version
 */
import { 
  useIntegrationsUnified, 
  UnifiedIntegration
} from '@/hooks/unified'

// Re-export Integration type for backward compatibility
export type Integration = UnifiedIntegration

export const useRealIntegrations = () => {
  console.warn('[DEPRECATED] useRealIntegrations - utilisez useIntegrationsUnified de @/hooks/unified')
  
  const result = useIntegrationsUnified()

  return {
    integrations: result.integrations,
    connectedIntegrations: result.connectedIntegrations,
    stats: result.stats,
    isLoading: result.isLoading,
    error: result.error,
    // Mutations mapped to old API
    addIntegration: (newIntegration: any) => result.add({ 
      template: { 
        id: newIntegration.platform_type,
        name: newIntegration.platform_name,
        type: newIntegration.platform_type
      },
      config: newIntegration
    }),
    updateIntegration: (params: { id: string; updates: Partial<Integration> }) => 
      result.update(params),
    testIntegration: result.testConnection,
    syncIntegration: result.sync,
    connectShopify: (credentials: any) => result.add({ 
      template: { id: 'shopify', name: 'Shopify', type: 'shopify' },
      credentials
    }),
    connectAliExpress: (credentials: any) => result.add({ 
      template: { id: 'aliexpress', name: 'AliExpress', type: 'aliexpress' },
      credentials
    }),
    connectBigBuy: (credentials: any) => result.add({ 
      template: { id: 'bigbuy', name: 'BigBuy', type: 'bigbuy' },
      credentials
    }),
    syncProducts: (params: { integrationId: string; platform?: string }) => 
      result.sync(params.integrationId),
    syncOrders: (params: { integrationId: string; platform?: string }) => 
      result.sync(params.integrationId),
    deleteIntegration: result.delete,
    testConnection: result.testConnection,
    // Loading states
    isAdding: result.isAdding,
    isUpdating: result.isUpdating,
    isTesting: result.isTesting,
    isSyncing: result.isSyncing,
    isConnectingShopify: result.isAdding,
    isConnectingAliExpress: result.isAdding,
    isConnectingBigBuy: result.isAdding,
    isSyncingProducts: result.isSyncing,
    isSyncingOrders: result.isSyncing,
    isDeleting: result.isDeleting
  }
}
