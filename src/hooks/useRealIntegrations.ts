import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { ApiService } from '@/services/api'
import { supabase } from '@/integrations/supabase/client'

export const useRealIntegrations = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: integrations = [], isLoading, error } = useQuery({
    queryKey: ['real-integrations'],
    queryFn: () => ApiService.getIntegrations(),
  })

  const addIntegration = useMutation({
    mutationFn: (newIntegration: any) => 
      ApiService.createIntegration(newIntegration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-integrations'] })
    }
  })

  const updateIntegration = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      ApiService.updateIntegration(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-integrations'] })
    }
  })

  const testIntegration = useMutation({
    mutationFn: (id: string) => 
      ApiService.callEdgeFunction('test-integration', { integrationId: id }),
    onSuccess: () => {
      toast({
        title: "Test réussi",
        description: "L'intégration fonctionne correctement"
      })
    }
  })

  const syncIntegration = useMutation({
    mutationFn: (id: string) => 
      ApiService.callEdgeFunction('sync-integration', { integrationId: id }),
    onSuccess: () => {
      toast({
        title: "Synchronisation démarrée",
        description: "La synchronisation est en cours..."
      })
      queryClient.invalidateQueries({ queryKey: ['real-integrations'] })
    }
  })

  const connectShopify = useMutation({
    mutationFn: (credentials: any) => 
      ApiService.createIntegration({
        platform_type: 'shopify',
        platform_name: 'Shopify',
        ...credentials
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-integrations'] })
    }
  })

  const connectAliExpress = useMutation({
    mutationFn: (credentials: any) => 
      ApiService.createIntegration({
        platform_type: 'aliexpress',
        platform_name: 'AliExpress',
        ...credentials
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-integrations'] })
    }
  })

  const connectBigBuy = useMutation({
    mutationFn: (credentials: any) => 
      ApiService.createIntegration({
        platform_type: 'bigbuy',
        platform_name: 'BigBuy',
        ...credentials
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-integrations'] })
    }
  })

  const syncProducts = useMutation({
    mutationFn: (params: { integrationId: string; platform?: string }) => 
      ApiService.callEdgeFunction('sync-integration', { 
        integrationId: params.integrationId, 
        type: 'products',
        platform: params.platform
      }),
    onSuccess: () => {
      toast({
        title: "Synchronisation des produits démarrée",
        description: "Les produits sont en cours de synchronisation..."
      })
    }
  })

  const syncOrders = useMutation({
    mutationFn: (params: { integrationId: string; platform?: string }) => 
      ApiService.callEdgeFunction('sync-integration', { 
        integrationId: params.integrationId, 
        type: 'orders',
        platform: params.platform
      }),
    onSuccess: () => {
      toast({
        title: "Synchronisation des commandes démarrée",
        description: "Les commandes sont en cours de synchronisation..."
      })
    }
  })

  const deleteIntegration = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      toast({
        title: "Intégration supprimée",
        description: "L'intégration a été supprimée avec succès"
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-integrations'] })
    }
  })

  const testConnection = useMutation({
    mutationFn: (id: string) => testIntegration.mutateAsync(id),
    onSuccess: () => {
      toast({
        title: "Test de connexion réussi",
        description: "La connexion fonctionne correctement"
      })
    }
  })

  const stats = {
    total: integrations.length,
    active: integrations.filter(i => i.is_active).length,
    connected: integrations.filter(i => i.connection_status === 'connected').length,
    disconnected: integrations.filter(i => i.connection_status === 'disconnected').length,
    lastSync: integrations.reduce((latest, integration) => {
      const syncDate = new Date(integration.last_sync_at || 0)
      return syncDate > latest ? syncDate : latest
    }, new Date(0))
  }

  const connectedIntegrations = integrations.filter(i => i.connection_status === 'connected')

  return {
    integrations,
    connectedIntegrations,
    stats,
    isLoading,
    error,
    addIntegration: addIntegration.mutate,
    updateIntegration: updateIntegration.mutate,
    testIntegration: testIntegration.mutate,
    syncIntegration: syncIntegration.mutate,
    connectShopify: connectShopify.mutate,
    connectAliExpress: connectAliExpress.mutate,
    connectBigBuy: connectBigBuy.mutate,
    syncProducts: syncProducts.mutate,
    syncOrders: syncOrders.mutate,
    deleteIntegration: deleteIntegration.mutate,
    testConnection: testConnection.mutate,
    isAdding: addIntegration.isPending,
    isUpdating: updateIntegration.isPending,
    isTesting: testIntegration.isPending,
    isSyncing: syncIntegration.isPending,
    isConnectingShopify: connectShopify.isPending,
    isConnectingAliExpress: connectAliExpress.isPending,
    isConnectingBigBuy: connectBigBuy.isPending,
    isSyncingProducts: syncProducts.isPending,
    isSyncingOrders: syncOrders.isPending,
    isDeleting: deleteIntegration.isPending
  }
}