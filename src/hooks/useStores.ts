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
      
      // Mock data pour la démonstration
      const mockStores: Store[] = [
        {
          id: '1',
          name: 'Ma Boutique Shopify',
          platform: 'shopify',
          domain: 'ma-boutique.myshopify.com',
          status: 'connected',
          last_sync: new Date().toISOString(),
          products_count: 245,
          orders_count: 128,
          revenue: 15420.50,
          currency: 'EUR',
          logo_url: 'https://via.placeholder.com/64x64/10b981/ffffff?text=SH',
          created_at: '2024-01-15T10:30:00Z',
          settings: {
            auto_sync: true,
            sync_frequency: 'hourly',
            sync_products: true,
            sync_orders: true,
            sync_customers: true
          }
        },
        {
          id: '2',
          name: 'WooCommerce Store',
          platform: 'woocommerce',
          domain: 'monsite.com',
          status: 'syncing',
          last_sync: '2024-01-09T14:20:00Z',
          products_count: 89,
          orders_count: 45,
          revenue: 3280.00,
          currency: 'EUR',
          logo_url: 'https://via.placeholder.com/64x64/7c3aed/ffffff?text=WC',
          created_at: '2024-01-10T09:15:00Z',
          settings: {
            auto_sync: false,
            sync_frequency: 'daily',
            sync_products: true,
            sync_orders: false,
            sync_customers: true
          }
        }
      ]
      
      setStores(mockStores)
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
    try {
      // Simulation de connexion
      const newStore: Store = {
        id: Date.now().toString(),
        name: storeData.name || '',
        platform: storeData.platform || 'shopify',
        domain: storeData.domain || '',
        status: 'connected',
        last_sync: new Date().toISOString(),
        products_count: 0,
        orders_count: 0,
        revenue: 0,
        currency: 'EUR',
        created_at: new Date().toISOString(),
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
      
      // Simulation de sync
      setTimeout(() => {
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
      toast({
        title: "Erreur",
        description: "Erreur lors de la synchronisation",
        variant: "destructive"
      })
    }
  }

  const updateStoreSettings = async (storeId: string, settings: Store['settings']) => {
    try {
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