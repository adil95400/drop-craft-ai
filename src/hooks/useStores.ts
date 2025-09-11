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
  settings: {
    auto_sync: boolean
    sync_frequency: 'hourly' | 'daily' | 'weekly'
    sync_products: boolean
    sync_orders: boolean
    sync_customers: boolean
  }
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
        revenue: 0, // Not stored in current schema
        currency: 'EUR', // Default value
        logo_url: undefined, // Not stored in current schema
        created_at: store.created_at,
        settings: (store.sync_settings as any) || {
          auto_sync: true,
          sync_frequency: 'hourly',
          sync_products: true,
          sync_orders: true,
          sync_customers: true
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
      const { data, error } = await supabase
        .from('store_integrations')
        .insert([{
          user_id: user.id,
          store_name: storeData.name || '',
          platform: storeData.platform || 'shopify',
          store_url: storeData.domain || '',
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

  const syncStore = async (storeId: string) => {
    try {
      setStores(prev => prev.map(store => 
        store.id === storeId 
          ? { ...store, status: 'syncing' as const }
          : store
      ))
      
      // Update database status to syncing
      await supabase
        .from('store_integrations')
        .update({ 
          connection_status: 'syncing',
          last_sync_at: new Date().toISOString()
        })
        .eq('id', storeId)
        .eq('user_id', user?.id)
      
      // Simulation de sync - dans un vrai cas, ici on appellerait l'API de la boutique
      setTimeout(async () => {
        // Update database status back to connected
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
            ? { 
                ...store, 
                status: 'connected' as const,
                last_sync: new Date().toISOString()
              }
            : store
        ))
        
        toast({
          title: "Succès",
          description: "Synchronisation terminée"
        })
      }, 3000)
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
        title: "Erreur",
        description: "Erreur lors de la synchronisation",
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