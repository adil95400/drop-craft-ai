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
    // Paramètres avancés
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

// Calcul du revenue basé sur les statistiques
const calculateRevenue = (productsCount: number, ordersCount: number) => {
  const avgOrderValue = 85.50 // Moyenne des commandes
  const conversionRate = 0.162 // 16.2% de taux de conversion
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
      
      const { data, error } = await supabase
        .from('store_integrations')
        .select('*')
        .eq('user_id', user.id)
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

      const storeData = data?.map(store => ({
        id: store.id,
        name: store.store_name,
        platform: store.platform as 'shopify' | 'woocommerce' | 'prestashop' | 'magento',
        domain: store.store_url || '',
        status: store.connection_status as 'connected' | 'disconnected' | 'syncing' | 'error',
        last_sync: store.last_sync_at,
        products_count: store.product_count || 0,
        orders_count: store.order_count || 0,
        revenue: calculateRevenue(store.product_count || 0, store.order_count || 0),
        currency: 'EUR',
        logo_url: undefined,
        created_at: store.created_at,
        credentials: (store.credentials as { shop_domain?: string; access_token?: string }) || {},
        settings: (store.sync_settings as any) || {
          auto_sync: true,
          sync_frequency: 'hourly',
          sync_products: true,
          sync_orders: true,
          sync_customers: true,
          notification_email: true,
          webhook_enabled: true,
          inventory_tracking: true,
          price_sync: true,
          stock_alerts: true,
          low_stock_threshold: 10
        }
      })) || []
      
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
      // Test connection first with real API call
      if (storeData.credentials && storeData.platform) {
        const { data: testResult, error: testError } = await supabase.functions.invoke('store-connection-test', {
          body: {
            platform: storeData.platform,
            credentials: storeData.credentials
          }
        })

        if (testError || !testResult?.success) {
          throw new Error(testResult?.error || 'Connection test failed')
        }
      }

      const { data, error } = await supabase
        .from('store_integrations')
        .insert([{
          user_id: user.id,
          store_name: storeData.name || '',
          platform: storeData.platform || 'shopify',
          store_url: storeData.domain || '',
          credentials: storeData.credentials || {},
          connection_status: 'connected',
          sync_settings: {
            auto_sync: true,
            sync_frequency: 'hourly',
            sync_products: true,
            sync_orders: true,
            sync_customers: true
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
        name: data.store_name,
        platform: data.platform as 'shopify' | 'woocommerce' | 'prestashop' | 'magento',
        domain: data.store_url || '',
        status: data.connection_status as 'connected' | 'disconnected' | 'syncing' | 'error',
        last_sync: data.last_sync_at,
        products_count: data.product_count || 0,
        orders_count: data.order_count || 0,
        revenue: 0,
        currency: 'EUR',
        logo_url: undefined,
        created_at: data.created_at,
        settings: (data.sync_settings as any) || {
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
        .from('store_integrations')
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
      
      if (type === 'full' || type === 'products') {
        // Sync products
        const { data: productsData, error: productsError } = await supabase.functions.invoke('shopify-sync', {
          body: {
            integrationId: storeId,
            type: 'products'
          }
        })

        if (productsError) {
          console.error('Products sync error:', productsError)
          throw new Error(`Erreur sync produits: ${productsError.message}`)
        }

        if (!productsData?.success) {
          throw new Error(productsData?.error || 'Échec sync produits')
        }

        toast({
          title: "Produits synchronisés",
          description: productsData.message || `${productsData.imported || 0} produits importés`
        })
      }

      if (type === 'full' || type === 'orders') {
        // Sync orders (with delay if full sync)
        if (type === 'full') {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }

        const { data: ordersData, error: ordersError } = await supabase.functions.invoke('shopify-sync', {
          body: {
            integrationId: storeId,
            type: 'orders'
          }
        })

        if (ordersError) {
          console.error('Orders sync error:', ordersError)
          throw new Error(`Erreur sync commandes: ${ordersError.message}`)
        }

        if (!ordersData?.success) {
          throw new Error(ordersData?.error || 'Échec sync commandes')
        }

        toast({
          title: "Commandes synchronisées",
          description: ordersData.message || `${ordersData.imported || 0} commandes importées`
        })
      }

      // Update store status to connected after successful sync
      await supabase
        .from('store_integrations')
        .update({ 
          connection_status: 'connected',
          last_sync_at: new Date().toISOString()
        })
        .eq('id', storeId)
        .eq('user_id', user?.id)

      setStores(prev => prev.map(store => 
        store.id === storeId 
          ? { ...store, status: 'connected' as const, last_sync: new Date().toISOString() }
          : store
      ))

      if (type === 'full') {
        toast({
          title: "Synchronisation terminée",
          description: "Tous vos données ont été synchronisées avec succès"
        })
      }
      
    } catch (error) {
      console.error('Error syncing store:', error)
      
      // Update status to error on failure
      await supabase
        .from('store_integrations')
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
      const { error } = await supabase
        .from('store_integrations')
        .update({ sync_settings: settings })
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
          table: 'store_integrations',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Store change received:', payload)
          
          if (payload.eventType === 'INSERT') {
            const newStore = {
              id: payload.new.id,
              name: payload.new.store_name,
              platform: payload.new.platform as 'shopify' | 'woocommerce' | 'prestashop' | 'magento',
              domain: payload.new.store_url || '',
              status: payload.new.connection_status as 'connected' | 'disconnected' | 'syncing' | 'error',
              last_sync: payload.new.last_sync_at,
              products_count: payload.new.product_count || 0,
              orders_count: payload.new.order_count || 0,
              revenue: 0,
              currency: 'EUR',
              logo_url: undefined,
              created_at: payload.new.created_at,
              settings: (payload.new.sync_settings as any) || {
                auto_sync: true,
                sync_frequency: 'hourly',
                sync_products: true,
                sync_orders: true,
                sync_customers: true
              }
            }
            setStores(prev => [...prev, newStore])
          } else if (payload.eventType === 'UPDATE') {
            const updatedStore = {
              id: payload.new.id,
              name: payload.new.store_name,
              platform: payload.new.platform as 'shopify' | 'woocommerce' | 'prestashop' | 'magento',
              domain: payload.new.store_url || '',
              status: payload.new.connection_status as 'connected' | 'disconnected' | 'syncing' | 'error',
              last_sync: payload.new.last_sync_at,
              products_count: payload.new.product_count || 0,
              orders_count: payload.new.order_count || 0,
              revenue: 0,
              currency: 'EUR',
              logo_url: undefined,
              created_at: payload.new.created_at,
              settings: (payload.new.sync_settings as any) || {
                auto_sync: true,
                sync_frequency: 'hourly',
                sync_products: true,
                sync_orders: true,
                sync_customers: true
              }
            }
            setStores(prev => prev.map(store => 
              store.id === payload.new.id ? updatedStore : store
            ))
          } else if (payload.eventType === 'DELETE') {
            setStores(prev => prev.filter(store => store.id !== payload.old.id))
          }
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