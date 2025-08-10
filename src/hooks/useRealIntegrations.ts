import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface RealIntegration {
  id: string
  platform_name: string
  platform_type: string
  connection_status: 'connected' | 'disconnected' | 'error'
  is_active: boolean
  last_sync_at?: string
  credentials?: {
    api_key?: string
    access_token?: string
    shop_domain?: string
    [key: string]: any
  }
}

interface SyncResult {
  success: boolean
  message: string
  data?: any
  errors?: string[]
}

export const useRealIntegrations = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isConnecting, setIsConnecting] = useState(false)

  // Fetch user's real integrations
  const {
    data: integrations = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['real-integrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as RealIntegration[]
    }
  })

  // Connect to Shopify
  const connectShopify = useMutation({
    mutationFn: async ({ shopDomain, accessToken }: { shopDomain: string; accessToken: string }) => {
      const { data, error } = await supabase.functions.invoke('shopify-integration', {
        body: {
          action: 'connect',
          shop_domain: shopDomain,
          access_token: accessToken
        }
      })
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-integrations'] })
      toast({
        title: "Shopify connecté",
        description: "Votre boutique Shopify a été connectée avec succès",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de connexion Shopify",
        description: error.message || "Impossible de connecter à Shopify",
        variant: "destructive",
      })
    }
  })

  // Connect to AliExpress
  const connectAliExpress = useMutation({
    mutationFn: async ({ apiKey, apiSecret }: { apiKey: string; apiSecret: string }) => {
      const { data, error } = await supabase.functions.invoke('aliexpress-integration', {
        body: {
          action: 'connect',
          api_key: apiKey,
          api_secret: apiSecret
        }
      })
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-integrations'] })
      toast({
        title: "AliExpress connecté",
        description: "Votre compte AliExpress a été connecté avec succès",
      })
    }
  })

  // Connect to BigBuy
  const connectBigBuy = useMutation({
    mutationFn: async ({ apiKey }: { apiKey: string }) => {
      const { data, error } = await supabase.functions.invoke('bigbuy-integration', {
        body: {
          action: 'connect',
          api_key: apiKey
        }
      })
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-integrations'] })
      toast({
        title: "BigBuy connecté",
        description: "Votre compte BigBuy a été connecté avec succès",
      })
    }
  })

  // Sync products from integration
  const syncProducts = useMutation({
    mutationFn: async ({ integrationId, platform }: { integrationId: string; platform: string }) => {
      let functionName = 'sync-integration'
      
      if (platform === 'shopify') {
        functionName = 'shopify-integration'
      } else if (platform === 'aliexpress') {
        functionName = 'aliexpress-integration'
      } else if (platform === 'bigbuy') {
        functionName = 'bigbuy-integration'
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          action: 'sync_products',
          integration_id: integrationId
        }
      })
      
      if (error) throw error
      return data as SyncResult
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['real-integrations'] })
      queryClient.invalidateQueries({ queryKey: ['catalog-products'] })
      toast({
        title: "Synchronisation terminée",
        description: data.message || "Les produits ont été synchronisés avec succès",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de synchronisation",
        description: error.message || "Impossible de synchroniser les produits",
        variant: "destructive",
      })
    }
  })

  // Sync orders from integration
  const syncOrders = useMutation({
    mutationFn: async ({ integrationId, platform }: { integrationId: string; platform: string }) => {
      let functionName = 'sync-integration'
      
      if (platform === 'shopify') {
        functionName = 'shopify-integration'
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          action: 'sync_orders',
          integration_id: integrationId
        }
      })
      
      if (error) throw error
      return data as SyncResult
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['real-integrations'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast({
        title: "Commandes synchronisées",
        description: data.message || "Les commandes ont été synchronisées avec succès",
      })
    }
  })

  // Test integration connection
  const testConnection = useMutation({
    mutationFn: async (integrationId: string) => {
      const { data, error } = await supabase.functions.invoke('test-integration', {
        body: { integration_id: integrationId }
      })
      
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['real-integrations'] })
      toast({
        title: data.success ? "Connexion réussie" : "Connexion échouée",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      })
    }
  })

  // Delete integration
  const deleteIntegration = useMutation({
    mutationFn: async (integrationId: string) => {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', integrationId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-integrations'] })
      toast({
        title: "Intégration supprimée",
        description: "L'intégration a été supprimée avec succès",
      })
    }
  })

  const connectedIntegrations = integrations.filter(i => i.connection_status === 'connected')
  const activeIntegrations = integrations.filter(i => i.is_active)

  return {
    integrations,
    connectedIntegrations,
    activeIntegrations,
    isLoading,
    error,
    isConnecting,
    connectShopify: connectShopify.mutate,
    connectAliExpress: connectAliExpress.mutate,
    connectBigBuy: connectBigBuy.mutate,
    syncProducts: syncProducts.mutate,
    syncOrders: syncOrders.mutate,
    testConnection: testConnection.mutate,
    deleteIntegration: deleteIntegration.mutate,
    isConnectingShopify: connectShopify.isPending,
    isConnectingAliExpress: connectAliExpress.isPending,
    isConnectingBigBuy: connectBigBuy.isPending,
    isSyncingProducts: syncProducts.isPending,
    isSyncingOrders: syncOrders.isPending,
    isTesting: testConnection.isPending,
    isDeleting: deleteIntegration.isPending
  }
}