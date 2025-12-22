import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'

export interface Store {
  id: string
  name: string
  platform: 'shopify' | 'woocommerce' | 'prestashop' | 'magento'
  domain: string
  status: 'connected' | 'disconnected' | 'syncing' | 'error'
  last_sync: string | null
  products_count: number
  orders_count: number
  revenue: number
  currency: string
  logo_url?: string
  created_at: string
  credentials?: {
    shop_domain?: string
    access_token?: string
  }
  settings: {
    auto_sync: boolean
    sync_frequency: 'hourly' | 'daily' | 'weekly'
    sync_products: boolean
    sync_orders: boolean
    sync_customers: boolean
    notification_email?: boolean
    webhook_enabled?: boolean
    inventory_tracking?: boolean
    price_sync?: boolean
    stock_alerts?: boolean
    low_stock_threshold?: number
    sync_timeout?: number
    error_retry_count?: number
    batch_size?: number
  }
}

// Calculate revenue based on statistics
const calculateRevenue = (productsCount: number, ordersCount: number) => {
  const avgOrderValue = 85.50
  return Math.round(ordersCount * avgOrderValue)
}

export const useStores = () => {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useUnifiedAuth()

  const fetchStores = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      
      // Use integrations table instead of store_integrations
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .in('platform', ['shopify', 'woocommerce', 'prestashop', 'magento'])
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching stores:', error)
        toast({
          title: "Erreur",
          description: "Impossible de charger vos boutiques",
          variant: "destructive"
        })
        return
      }

      const storeData = data?.map(store => {
        const config = store.config as any || {}
        const syncSettings = config.sync_settings || {}
        
        return {
          id: store.id,
          name: store.platform_name || store.platform || 'Ma Boutique',
          platform: store.platform as 'shopify' | 'woocommerce' | 'prestashop' | 'magento',
          domain: store.store_url || '',
          status: (store.connection_status || 'disconnected') as 'connected' | 'disconnected' | 'syncing' | 'error',
          last_sync: store.last_sync_at,
          products_count: config.product_count || 0,
          orders_count: config.order_count || 0,
          revenue: calculateRevenue(config.product_count || 0, config.order_count || 0),
          currency: 'EUR',
          logo_url: undefined,
          created_at: store.created_at,
          credentials: config.credentials || {},
          settings: {
            auto_sync: syncSettings.auto_sync ?? true,
            sync_frequency: syncSettings.sync_frequency || 'hourly',
            sync_products: syncSettings.sync_products ?? true,
            sync_orders: syncSettings.sync_orders ?? true,
            sync_customers: syncSettings.sync_customers ?? true,
            notification_email: syncSettings.notification_email ?? true,
            webhook_enabled: syncSettings.webhook_enabled ?? true,
            inventory_tracking: syncSettings.inventory_tracking ?? true,
            price_sync: syncSettings.price_sync ?? true,
            stock_alerts: syncSettings.stock_alerts ?? true,
            low_stock_threshold: syncSettings.low_stock_threshold || 10
          }
        }
      }) || []
      
      setStores(storeData)
    } catch (error) {
      console.error('Error fetching stores:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger vos boutiques",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const connectStore = async (storeData: Partial<Store>) => {
    if (!user) throw new Error('User not authenticated')
    
    try {
      // Test connection first with unified API call
      if (storeData.credentials && storeData.platform) {
        const { data: testResult, error: testError } = await supabase.functions.invoke('shopify-operations', {
          body: {
            operation: 'test_connection',
            credentials: storeData.credentials,
            platform: storeData.platform
          }
        })

        if (testError || !testResult?.success) {
          throw new Error(testResult?.error || 'Test de connexion échoué')
        }
      }

      const { data, error } = await supabase
        .from('integrations')
        .insert([{
          user_id: user.id,
          platform_name: storeData.name || '',
          platform: storeData.platform || 'shopify',
          store_url: storeData.domain || '',
          connection_status: 'connected',
          is_active: true,
          config: {
            credentials: storeData.credentials || {},
            sync_settings: {
              auto_sync: true,
              sync_frequency: 'hourly',
              sync_products: true,
              sync_orders: true,
              sync_customers: true
            }
          }
        }])
        .select()
        .single()

      if (error) {
        console.error('Error connecting store:', error)
        toast({
          title: "Erreur",
          description: "Impossible de connecter la boutique",
          variant: "destructive"
        })
        throw error
      }

      const newStore: Store = {
        id: data.id,
        name: data.platform_name || data.platform,
        platform: data.platform as 'shopify' | 'woocommerce' | 'prestashop' | 'magento',
        domain: data.store_url || '',
        status: 'connected',
        last_sync: data.last_sync_at,
        products_count: 0,
        orders_count: 0,
        revenue: 0,
        currency: 'EUR',
        logo_url: undefined,
        created_at: data.created_at,
        settings: {
          auto_sync: true,
          sync_frequency: 'hourly',
          sync_products: true,
          sync_orders: true,
          sync_customers: true
        }
      }
      
      setStores(prev => [...prev, newStore])
      
      toast({
        title: "Succès",
        description: "Boutique connectée avec succès"
      })
      
      return newStore
    } catch (error) {
      console.error('Error connecting store:', error)
      toast({
        title: "Erreur",
        description: "Impossible de connecter la boutique",
        variant: "destructive"
      })
      throw error
    }
  }

  const disconnectStore = async (storeId: string) => {
    try {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', storeId)
        .eq('user_id', user?.id)

      if (error) {
        console.error('Error disconnecting store:', error)
        toast({
          title: "Erreur",
          description: "Impossible de déconnecter la boutique",
          variant: "destructive"
        })
        return
      }

      setStores(prev => prev.filter(store => store.id !== storeId))
      
      toast({
        title: "Succès",
        description: "Boutique déconnectée"
      })
    } catch (error) {
      console.error('Error disconnecting store:', error)
      toast({
        title: "Erreur",
        description: "Impossible de déconnecter la boutique",
        variant: "destructive"
      })
    }
  }

  const syncStore = async (storeId: string, type: 'products' | 'orders' | 'full' = 'full') => {
    try {
      setStores(prev => prev.map(store => 
        store.id === storeId 
          ? { ...store, status: 'syncing' as const }
          : store
      ))

      toast({
        title: "Synchronisation démarrée",
        description: type === 'full' ? "Synchronisation complète en cours..." : `Synchronisation des ${type === 'products' ? 'produits' : 'commandes'} en cours...`,
      })

      const operation = type === 'full' ? 'sync_full' : type === 'products' ? 'sync_products' : 'sync_orders'
      
      const { data: syncData, error: syncError } = await supabase.functions.invoke('shopify-operations', {
        body: {
          operation,
          integrationId: storeId
        }
      })

      if (syncError) {
        console.error('Sync error:', syncError)
        throw new Error(`Erreur synchronisation: ${syncError.message}`)
      }

      if (!syncData?.success) {
        throw new Error(syncData?.error || 'Échec de la synchronisation')
      }

      setStores(prev => prev.map(store => 
        store.id === storeId 
          ? { 
              ...store, 
              status: 'connected' as const, 
              last_sync: new Date().toISOString(),
              products_count: syncData.results?.products ?? store.products_count,
              orders_count: syncData.results?.orders ?? store.orders_count
            }
          : store
      ))

      toast({
        title: "Synchronisation terminée",
        description: syncData.message || "Synchronisation réussie",
        duration: 5000
      })
      
    } catch (error) {
      console.error('Error syncing store:', error)
      
      await supabase
        .from('integrations')
        .update({ connection_status: 'error' })
        .eq('id', storeId)
        .eq('user_id', user?.id)

      setStores(prev => prev.map(store => 
        store.id === storeId 
          ? { ...store, status: 'error' as const }
          : store
      ))
      
      toast({
        title: "Erreur de synchronisation",
        description: error instanceof Error ? error.message : "Erreur lors de la synchronisation",
        variant: "destructive"
      })
    }
  }

  const updateStoreSettings = async (storeId: string, settings: Store['settings']) => {
    try {
      // Get current config first
      const { data: currentStore } = await supabase
        .from('integrations')
        .select('config')
        .eq('id', storeId)
        .single()

      const currentConfig = (currentStore?.config as any) || {}
      
      const { error } = await supabase
        .from('integrations')
        .update({ 
          config: {
            ...currentConfig,
            sync_settings: settings
          }
        })
        .eq('id', storeId)
        .eq('user_id', user?.id)

      if (error) {
        console.error('Error updating store settings:', error)
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour les paramètres",
          variant: "destructive"
        })
        return
      }

      setStores(prev => prev.map(store => 
        store.id === storeId 
          ? { ...store, settings }
          : store
      ))
      
      toast({
        title: "Succès",
        description: "Paramètres mis à jour"
      })
    } catch (error) {
      console.error('Error updating store settings:', error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les paramètres",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    fetchStores()
    
    // Set up real-time subscription for store updates
    const channel = supabase
      .channel('store-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'integrations',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Store change received:', payload)
          fetchStores() // Refetch on any change
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  return {
    stores,
    loading,
    connectStore,
    disconnectStore,
    syncStore,
    updateStoreSettings,
    refetch: fetchStores
  }
}