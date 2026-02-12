/**
 * useIntegrationsUnified - Hook unifié pour la gestion des intégrations (API V1)
 * All CRUD delegated to /v1/integrations/* endpoints
 */
import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useSecureCredentials } from '@/hooks/useSecureCredentials'
import { integrationsApi } from '@/services/api/client'

// ============= Types =============
export interface UnifiedIntegration {
  id: string
  platform: string
  platform_name: string
  platform_type?: string
  platform_url?: string
  shop_domain?: string
  store_url?: string
  store_id?: string
  seller_id?: string
  connection_status: 'connected' | 'disconnected' | 'connecting' | 'error'
  is_active: boolean
  sync_frequency?: string
  last_sync_at?: string
  config?: Record<string, any>
  sync_settings?: Record<string, any>
  user_id: string
  created_at: string
  updated_at: string
}

export interface IntegrationTemplate {
  id: string
  name: string
  description: string
  category: 'ecommerce' | 'marketplace' | 'payment' | 'marketing' | 'analytics' | 'ai' | 'security'
  logo?: string
  color?: string
  features?: string[]
  setupSteps?: any[]
  status: 'available'
  icon?: any
  premium?: boolean
  rating?: number
  installs?: number
  isPopular?: boolean
  isPremium?: boolean
}

export interface SyncLog {
  id: string
  integration_id?: string
  sync_type?: string
  status?: string
  started_at?: string
  completed_at?: string
  records_succeeded?: number
  records_failed?: number
  error_message?: string
  created_at?: string
}

export interface IntegrationStats {
  total: number
  active: number
  connected: number
  disconnected: number
  error: number
  lastSync: Date | null
}

export interface UseIntegrationsUnifiedOptions {
  enableRealtime?: boolean
}

function mapIntegration(item: any): UnifiedIntegration {
  return {
    id: item.id,
    platform: item.platform || 'unknown',
    platform_name: item.platform_name || item.platform || 'Unknown',
    platform_type: item.platform,
    platform_url: item.store_url,
    shop_domain: item.store_url,
    store_url: item.store_url,
    store_id: item.store_id,
    seller_id: item.store_id,
    connection_status: (item.connection_status || 'disconnected') as UnifiedIntegration['connection_status'],
    is_active: item.is_active ?? false,
    sync_frequency: item.sync_frequency,
    last_sync_at: item.last_sync_at,
    config: item.config,
    sync_settings: item.sync_settings,
    user_id: item.user_id,
    created_at: item.created_at,
    updated_at: item.updated_at
  }
}

// ============= Hook Principal =============
export function useIntegrationsUnified(options: UseIntegrationsUnifiedOptions = {}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { storeCredentials, deleteCredentials } = useSecureCredentials()
  
  const { enableRealtime = true } = options

  // ============= Query Principal =============
  const { data: integrations = [], isLoading, error, refetch } = useQuery({
    queryKey: ['integrations-unified', user?.id],
    queryFn: async () => {
      if (!user) return []
      const res = await integrationsApi.list({ per_page: 100 })
      return (res.items || []).map(mapIntegration)
    },
    enabled: !!user,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000
  })

  // ============= Realtime Subscription =============
  useEffect(() => {
    if (!user || !enableRealtime) return

    const channel = supabase
      .channel('integrations-unified-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'integrations', filter: `user_id=eq.${user.id}` },
        () => { queryClient.invalidateQueries({ queryKey: ['integrations-unified', user.id] }) }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, queryClient, enableRealtime])

  // ============= Computed Values =============
  const connectedIntegrations = integrations.filter(i => i.connection_status === 'connected')
  
  const stats: IntegrationStats = {
    total: integrations.length,
    active: integrations.filter(i => i.is_active).length,
    connected: connectedIntegrations.length,
    disconnected: integrations.filter(i => i.connection_status === 'disconnected').length,
    error: integrations.filter(i => i.connection_status === 'error').length,
    lastSync: integrations.reduce((latest, integration) => {
      if (!integration.last_sync_at) return latest
      const syncDate = new Date(integration.last_sync_at)
      return !latest || syncDate > latest ? syncDate : latest
    }, null as Date | null)
  }

  // ============= Mutations =============
  const addMutation = useMutation({
    mutationFn: async ({ template, config, credentials }: { 
      template: IntegrationTemplate | any
      config?: Partial<UnifiedIntegration>
      credentials?: Record<string, string>
    }) => {
      if (!user) throw new Error('Non authentifié')
      
      const data = await integrationsApi.create({
        platform: template.id || template.name,
        platform_name: template.name || template.id,
        connection_status: 'disconnected',
        is_active: false,
        sync_frequency: 'daily',
        store_url: config?.store_url || config?.shop_domain,
        store_id: config?.store_id || config?.seller_id,
        config: config?.config,
        sync_settings: config?.sync_settings,
        ...config
      })
      
      if (credentials && Object.keys(credentials).length > 0) {
        const credResult = await storeCredentials(data.id, credentials)
        if (!credResult.success) throw new Error('Échec de la sauvegarde sécurisée des identifiants')
      }
      
      return data
    },
    onSuccess: () => { invalidateIntegrationQueries(); toast({ title: "Succès", description: "Intégration ajoutée avec succès" }) },
    onError: (error: Error) => { toast({ title: "Erreur", description: error.message || "Impossible d'ajouter l'intégration", variant: "destructive" }) }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<UnifiedIntegration> }) => {
      const dbUpdates: any = {}
      if (updates.platform_name) dbUpdates.platform_name = updates.platform_name
      if (updates.platform) dbUpdates.platform = updates.platform
      if (updates.connection_status) dbUpdates.connection_status = updates.connection_status
      if (updates.is_active !== undefined) dbUpdates.is_active = updates.is_active
      if (updates.store_url || updates.shop_domain) dbUpdates.store_url = updates.store_url || updates.shop_domain
      if (updates.store_id || updates.seller_id) dbUpdates.store_id = updates.store_id || updates.seller_id
      if (updates.sync_frequency) dbUpdates.sync_frequency = updates.sync_frequency
      if (updates.config) dbUpdates.config = updates.config
      if (updates.sync_settings) dbUpdates.sync_settings = updates.sync_settings
      
      return await integrationsApi.update(id, dbUpdates)
    },
    onSuccess: () => { invalidateIntegrationQueries(); toast({ title: "Succès", description: "Intégration mise à jour" }) },
    onError: () => { toast({ title: "Erreur", description: "Impossible de mettre à jour l'intégration", variant: "destructive" }) }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteCredentials(id)
      return await integrationsApi.delete(id)
    },
    onSuccess: () => { invalidateIntegrationQueries(); toast({ title: "Succès", description: "Intégration supprimée" }) },
    onError: () => { toast({ title: "Erreur", description: "Impossible de supprimer l'intégration", variant: "destructive" }) }
  })

  // ============= Connection Mutations =============
  const connectMutation = useMutation({
    mutationFn: async ({ template, credentials }: { template: IntegrationTemplate | any; credentials?: Record<string, string> }) => {
      return addMutation.mutateAsync({ template, config: { connection_status: 'connected', is_active: true }, credentials })
    }
  })

  const disconnectMutation = useMutation({
    mutationFn: async (id: string) => {
      return updateMutation.mutateAsync({ id, updates: { connection_status: 'disconnected', is_active: false } })
    }
  })

  // ============= Sync Mutations =============
  const syncMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      return await integrationsApi.sync(integrationId, { sync_type: 'full' })
    },
    onSuccess: () => { invalidateIntegrationQueries(); toast({ title: "Synchronisation lancée", description: "La synchronisation est en cours..." }) },
    onError: () => { toast({ title: "Erreur", description: "Impossible de lancer la synchronisation", variant: "destructive" }) }
  })

  const syncProductsMutation = useMutation({
    mutationFn: async (integrationId: string) => integrationsApi.sync(integrationId, { sync_type: 'products' }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products-unified'] })
      invalidateIntegrationQueries()
      toast({ title: "Synchronisation réussie", description: data?.message || "Les produits ont été synchronisés" })
    },
    onError: () => { toast({ title: "Erreur", description: "Impossible de synchroniser les produits", variant: "destructive" }) }
  })

  const syncOrdersMutation = useMutation({
    mutationFn: async (integrationId: string) => integrationsApi.sync(integrationId, { sync_type: 'orders' }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['unified-orders'] })
      invalidateIntegrationQueries()
      toast({ title: "Synchronisation réussie", description: data?.message || "Les commandes ont été synchronisées" })
    },
    onError: () => { toast({ title: "Erreur", description: "Impossible de synchroniser les commandes", variant: "destructive" }) }
  })

  // ============= Test Connection =============
  const testConnectionMutation = useMutation({
    mutationFn: async (integrationId: string) => integrationsApi.test(integrationId),
    onSuccess: (data) => {
      invalidateIntegrationQueries()
      toast({ title: data?.success ? "Connexion réussie" : "Connexion échouée", description: data?.message || "Test de connexion effectué", variant: data?.success ? "default" : "destructive" })
    },
    onError: () => { toast({ title: "Erreur", description: "Impossible de tester la connexion", variant: "destructive" }) }
  })

  // ============= Platform-specific connections =============
  const connectShopifyMutation = useMutation({
    mutationFn: async (credentials: { shop_domain?: string; access_token?: string }) => {
      return addMutation.mutateAsync({
        template: { id: 'shopify', name: 'Shopify' },
        config: { store_url: credentials.shop_domain, connection_status: 'connected', is_active: true },
        credentials: credentials.access_token ? { access_token: credentials.access_token } : undefined
      })
    }
  })

  const connectAliExpressMutation = useMutation({
    mutationFn: async (credentials: any) => addMutation.mutateAsync({ template: { id: 'aliexpress', name: 'AliExpress' }, config: { connection_status: 'connected', is_active: true, ...credentials } })
  })

  const connectBigBuyMutation = useMutation({
    mutationFn: async (credentials: any) => addMutation.mutateAsync({ template: { id: 'bigbuy', name: 'BigBuy' }, config: { connection_status: 'connected', is_active: true, ...credentials } })
  })

  // ============= Helpers =============
  function invalidateIntegrationQueries() {
    queryClient.invalidateQueries({ queryKey: ['integrations-unified'] })
    queryClient.invalidateQueries({ queryKey: ['integrations'] })
    queryClient.invalidateQueries({ queryKey: ['real-integrations'] })
    queryClient.invalidateQueries({ queryKey: ['sync-logs'] })
  }

  // ============= Return =============
  return {
    integrations, data: integrations, connectedIntegrations, stats,
    syncLogs: [] as SyncLog[], templates: [] as IntegrationTemplate[],
    isLoading, loading: isLoading, error, isRealtime: enableRealtime,
    add: addMutation.mutate, addAsync: addMutation.mutateAsync,
    update: updateMutation.mutate, updateAsync: updateMutation.mutateAsync,
    delete: deleteMutation.mutate, deleteAsync: deleteMutation.mutateAsync,
    addIntegration: addMutation.mutate, updateIntegration: updateMutation.mutate,
    deleteIntegration: deleteMutation.mutate, createIntegration: addMutation.mutateAsync,
    connect: connectMutation.mutate, connectAsync: connectMutation.mutateAsync,
    disconnect: disconnectMutation.mutate, disconnectAsync: disconnectMutation.mutateAsync,
    connectIntegration: connectMutation.mutateAsync, disconnectIntegration: disconnectMutation.mutate,
    connectShopify: connectShopifyMutation.mutate,
    connectAliExpress: connectAliExpressMutation.mutate,
    connectBigBuy: connectBigBuyMutation.mutate,
    sync: syncMutation.mutate, syncAsync: syncMutation.mutateAsync,
    syncIntegration: syncMutation.mutate, syncData: syncMutation.mutate,
    syncProducts: syncProductsMutation.mutate, syncOrders: syncOrdersMutation.mutate,
    testConnection: testConnectionMutation.mutate,
    isAdding: addMutation.isPending, isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending, isSyncing: syncMutation.isPending,
    isTesting: testConnectionMutation.isPending, isConnecting: connectMutation.isPending,
    isConnectingShopify: connectShopifyMutation.isPending,
    isConnectingAliExpress: connectAliExpressMutation.isPending,
    isConnectingBigBuy: connectBigBuyMutation.isPending,
    isSyncingProducts: syncProductsMutation.isPending,
    isSyncingOrders: syncOrdersMutation.isPending,
    refetch, fetchIntegrations: refetch, invalidate: invalidateIntegrationQueries
  }
}
