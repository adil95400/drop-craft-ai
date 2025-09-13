import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export interface StoreIntegration {
  id: string
  user_id: string
  platform_name: string
  platform_type: string
  platform_url: string | null
  shop_domain: string | null
  store_config: Record<string, any> | null
  encrypted_credentials: Record<string, any> | null
  sync_settings: Record<string, any> | null
  is_active: boolean | null
  connection_status: string | null
  last_sync_at: string | null
  sync_frequency: string | null
  last_error: string | null
  created_at: string
  updated_at: string
}

export const useStoreIntegrations = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: integrations = [], isLoading, error } = useQuery({
    queryKey: ['store-integrations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as StoreIntegration[]
    },
  })

  const syncProducts = useMutation({
    mutationFn: async (params: { integrationId: string }) => {
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
      queryClient.invalidateQueries({ queryKey: ['store-integrations'] })
      queryClient.invalidateQueries({ queryKey: ['real-products'] })
      toast({
        title: "Synchronisation réussie",
        description: data?.message || "Les produits ont été synchronisés avec succès"
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de synchronisation",
        description: error.message || "La synchronisation a échoué",
        variant: "destructive"
      })
    }
  })

  const syncOrders = useMutation({
    mutationFn: async (params: { integrationId: string }) => {
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
      queryClient.invalidateQueries({ queryKey: ['store-integrations'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order-stats'] })
      toast({
        title: "Synchronisation réussie",
        description: data?.message || "Les commandes ont été synchronisées avec succès"
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de synchronisation",
        description: error.message || "La synchronisation a échoué",
        variant: "destructive"
      })
    }
  })

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['store-integrations'] })
  }

  const stats = {
    total: integrations.length,
    active: integrations.filter(i => i.is_active).length,
    connected: integrations.filter(i => i.connection_status === 'active').length,
    disconnected: integrations.filter(i => i.connection_status === 'disconnected' || i.connection_status === 'error').length,
    lastSync: integrations.reduce((latest, integration) => {
      const syncDate = new Date(integration.last_sync_at || 0)
      return syncDate > latest ? syncDate : latest
    }, new Date(0))
  }

  const connectedIntegrations = integrations.filter(i => i.connection_status === 'active')

  return {
    integrations,
    connectedIntegrations,
    stats,
    isLoading,
    error,
    syncProducts: syncProducts.mutate,
    syncOrders: syncOrders.mutate,
    isSyncingProducts: syncProducts.isPending,
    isSyncingOrders: syncOrders.isPending,
    refetch
  }
}