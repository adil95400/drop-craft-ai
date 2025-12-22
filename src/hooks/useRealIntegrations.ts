import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useSecureCredentials } from '@/hooks/useSecureCredentials'

export interface Integration {
  id: string
  platform_name: string
  platform_type: string
  connection_status: 'connected' | 'disconnected' | 'error'
  is_active: boolean
  last_sync_at?: string
  user_id: string
  created_at: string
  updated_at: string
  shop_domain?: string
  seller_id?: string
  platform_url?: string
  encrypted_credentials?: Record<string, any>
}

export const useRealIntegrations = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { storeCredentials, deleteCredentials } = useSecureCredentials()

  const { data: integrations = [], isLoading, error } = useQuery({
    queryKey: ['real-integrations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      
      // Query integrations table directly
      const { data, error } = await (supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id) as any)
      
      if (error) throw error
      
      // Transform to Integration interface
      return (data || []).map((i: any) => ({
        id: i.id,
        platform_name: i.platform_name || i.platform || 'Unknown',
        platform_type: i.platform || 'unknown',
        connection_status: (i.connection_status || 'disconnected') as 'connected' | 'disconnected' | 'error',
        is_active: i.is_active ?? false,
        last_sync_at: i.last_sync_at,
        user_id: i.user_id,
        created_at: i.created_at,
        updated_at: i.updated_at,
        shop_domain: i.store_url,
        seller_id: i.store_id,
        platform_url: i.store_url
      })) as Integration[]
    },
  })

  const addIntegration = useMutation({
    mutationFn: async (newIntegration: Omit<Integration, 'id' | 'created_at' | 'updated_at' | 'user_id'> & { credentials?: Record<string, string> }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      
      // Separate credentials from integration data
      const { credentials, ...integrationData } = newIntegration
      
      const { data, error } = await (supabase
        .from('integrations')
        .insert([{ 
          platform: integrationData.platform_type,
          platform_name: integrationData.platform_name,
          connection_status: integrationData.connection_status,
          is_active: integrationData.is_active,
          store_url: integrationData.shop_domain || integrationData.platform_url,
          store_id: integrationData.seller_id,
          user_id: user.id 
        }])
        .select()
        .single() as any)
      
      if (error) throw error
      
      // Store credentials securely if provided
      if (credentials && Object.keys(credentials).length > 0) {
        const credResult = await storeCredentials(data.id, credentials)
        
        if (!credResult.success) {
          console.error('Failed to store credentials:', credResult.error)
          throw new Error('Échec de la sauvegarde sécurisée des identifiants')
        }
      }
      
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-integrations'] })
      toast({
        title: "Intégration ajoutée",
        description: "L'intégration a été créée avec succès",
      })
    }
  })

  const updateIntegration = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Integration> }) => {
      const dbUpdates: any = {}
      if (updates.platform_name) dbUpdates.platform_name = updates.platform_name
      if (updates.platform_type) dbUpdates.platform = updates.platform_type
      if (updates.connection_status) dbUpdates.connection_status = updates.connection_status
      if (updates.is_active !== undefined) dbUpdates.is_active = updates.is_active
      if (updates.shop_domain) dbUpdates.store_url = updates.shop_domain
      if (updates.seller_id) dbUpdates.store_id = updates.seller_id
      
      const { data, error } = await (supabase
        .from('integrations')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single() as any)
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-integrations'] })
      toast({
        title: "Intégration mise à jour",
        description: "L'intégration a été modifiée avec succès",
      })
    }
  })

  const testIntegration = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('test-integration', {
        body: { integrationId: id }
      })
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast({
        title: "Test réussi",
        description: "L'intégration fonctionne correctement"
      })
    }
  })

  const syncIntegration = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('sync-integration', {
        body: { integrationId: id }
      })
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast({
        title: "Synchronisation démarrée",
        description: "La synchronisation est en cours..."
      })
      queryClient.invalidateQueries({ queryKey: ['real-integrations'] })
    }
  })

  const connectShopify = useMutation({
    mutationFn: async (credentials: any) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      
      return addIntegration.mutateAsync({
        platform_type: 'shopify',
        platform_name: 'Shopify',
        connection_status: 'disconnected',
        is_active: true,
        ...credentials
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-integrations'] })
    }
  })

  const connectAliExpress = useMutation({
    mutationFn: async (credentials: any) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      
      return addIntegration.mutateAsync({
        platform_type: 'aliexpress',
        platform_name: 'AliExpress',
        connection_status: 'disconnected',
        is_active: true,
        ...credentials
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-integrations'] })
    }
  })

  const connectBigBuy = useMutation({
    mutationFn: async (credentials: any) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      
      return addIntegration.mutateAsync({
        platform_type: 'bigbuy',
        platform_name: 'BigBuy',
        connection_status: 'disconnected',
        is_active: true,
        ...credentials
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-integrations'] })
    }
  })

  const syncProducts = useMutation({
    mutationFn: async (params: { integrationId: string; platform?: string }) => {
      const { data, error } = await supabase.functions.invoke('shopify-sync', {
        body: { 
          integrationId: params.integrationId, 
          type: 'products'
        }
      })
      
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['real-products'] })
      queryClient.invalidateQueries({ queryKey: ['real-integrations'] })
      toast({
        title: "Synchronisation réussie",
        description: data?.message || "Les produits ont été synchronisés avec succès"
      })
    }
  })

  const syncOrders = useMutation({
    mutationFn: async (params: { integrationId: string; platform?: string }) => {
      const { data, error } = await supabase.functions.invoke('shopify-sync', {
        body: { 
          integrationId: params.integrationId, 
          type: 'orders'
        }
      })
      
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order-stats'] })
      queryClient.invalidateQueries({ queryKey: ['real-integrations'] })
      toast({
        title: "Synchronisation réussie",
        description: data?.message || "Les commandes ont été synchronisées avec succès"
      })
    }
  })

  const deleteIntegration = useMutation({
    mutationFn: async (id: string) => {
      // First, securely delete credentials
      await deleteCredentials(id)
      
      // Then delete the integration record
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      toast({
        title: "Intégration supprimée",
        description: "L'intégration et ses identifiants ont été supprimés de manière sécurisée"
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
