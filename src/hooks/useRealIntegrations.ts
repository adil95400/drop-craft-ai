import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

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
  api_key?: string
  shop_domain?: string
  seller_id?: string
  api_secret?: string
  platform_url?: string
}

export const useRealIntegrations = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: integrations = [], isLoading, error } = useQuery({
    queryKey: ['real-integrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Integration[]
    },
  })

  const addIntegration = useMutation({
    mutationFn: async (newIntegration: Omit<Integration, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      
      const { data, error } = await supabase
        .from('integrations')
        .insert([{ ...newIntegration, user_id: user.id }])
        .select()
        .single()
      
      if (error) throw error
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
      const { data, error } = await supabase
        .from('integrations')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
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
      const { data, error } = await supabase.functions.invoke('sync-integration', {
        body: { 
          integrationId: params.integrationId, 
          type: 'products',
          platform: params.platform
        }
      })
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast({
        title: "Synchronisation des produits démarrée",
        description: "Les produits sont en cours de synchronisation..."
      })
    }
  })

  const syncOrders = useMutation({
    mutationFn: async (params: { integrationId: string; platform?: string }) => {
      const { data, error } = await supabase.functions.invoke('sync-integration', {
        body: { 
          integrationId: params.integrationId, 
          type: 'orders',
          platform: params.platform
        }
      })
      
      if (error) throw error
      return data
    },
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