import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface MarketplaceConnection {
  id: string
  platform: string
  credentials: Record<string, any>
  sync_settings: {
    frequency: string
    auto_sync: boolean
    sync_categories: string[]
  }
  status: 'connected' | 'disconnected' | 'error' | 'syncing'
  last_sync_at: string | null
  sync_stats: Record<string, any>
  created_at: string
}

interface SyncResult {
  sync_id: string
  status: string
  started_at: string
  completed_at: string
  stats: {
    products_synced: number
    orders_synced: number
    errors: number
  }
}

interface MarketplaceAnalytics {
  total_connections: number
  active_syncs: number
  products_synced: number
  revenue_by_platform: Array<{
    platform: string
    revenue: number
  }>
  sync_performance: {
    success_rate: number
    avg_sync_time: string
    last_sync: string | null
  }
}

export function useMarketplaceHub() {
  const [connections, setConnections] = useState<MarketplaceConnection[]>([])
  const [analytics, setAnalytics] = useState<MarketplaceAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  // Fetch user's marketplace connections
  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('marketplace-hub', {
        method: 'GET',
      })

      if (error) throw error

      setConnections(data.connections || [])
    } catch (error) {
      console.error('Error fetching connections:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les connexions marketplace",
        variant: "destructive"
      })
    }
  }

  // Fetch marketplace analytics
  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('marketplace-hub', {
        method: 'GET',
        body: { path: '/analytics' }
      })

      if (error) throw error

      setAnalytics(data.analytics)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  // Connect to a marketplace platform
  const connectMarketplace = async (platformConfig: {
    platform: string
    credentials: Record<string, any>
    sync_settings: {
      frequency: string
      auto_sync: boolean
      sync_categories: string[]
    }
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('marketplace-hub', {
        method: 'POST',
        body: {
          ...platformConfig,
          path: '/connect'
        }
      })

      if (error) throw error

      setConnections(prev => [...prev, data.connection])
      
      toast({
        title: "Succès",
        description: `Connexion ${platformConfig.platform} créée avec succès`,
      })

      return data.connection
    } catch (error) {
      console.error('Error connecting marketplace:', error)
      toast({
        title: "Erreur",
        description: "Impossible de créer la connexion marketplace",
        variant: "destructive"
      })
      throw error
    }
  }

  // Trigger marketplace sync
  const syncMarketplace = async (connectionId: string, syncType: 'products' | 'orders' | 'inventory' | 'full' = 'full') => {
    try {
      setSyncing(prev => ({ ...prev, [connectionId]: true }))

      const { data, error } = await supabase.functions.invoke('marketplace-hub', {
        method: 'POST',
        body: {
          connector_id: connectionId,
          sync_type: syncType,
          path: '/sync'
        }
      })

      if (error) throw error

      // Update connection status
      setConnections(prev => prev.map(conn => 
        conn.id === connectionId 
          ? { 
              ...conn, 
              status: 'connected', 
              last_sync_at: new Date().toISOString(),
              sync_stats: data.sync_result.stats
            }
          : conn
      ))

      toast({
        title: "Synchronisation terminée",
        description: `${data.sync_result.stats.products_synced} produits synchronisés`,
      })

      return data.sync_result as SyncResult
    } catch (error) {
      console.error('Error syncing marketplace:', error)
      
      // Update connection status to error
      setConnections(prev => prev.map(conn => 
        conn.id === connectionId 
          ? { ...conn, status: 'error' as const }
          : conn
      ))

      toast({
        title: "Erreur de synchronisation",
        description: "La synchronisation a échoué",
        variant: "destructive"
      })
      throw error
    } finally {
      setSyncing(prev => ({ ...prev, [connectionId]: false }))
    }
  }

  // Delete marketplace connection
  const disconnectMarketplace = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('marketplace_connections')
        .delete()
        .eq('id', connectionId)

      if (error) throw error

      setConnections(prev => prev.filter(conn => conn.id !== connectionId))
      
      toast({
        title: "Succès",
        description: "Connexion marketplace supprimée",
      })
    } catch (error) {
      console.error('Error disconnecting marketplace:', error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la connexion",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        fetchConnections(),
        fetchAnalytics()
      ])
      setLoading(false)
    }

    loadData()
  }, [])

  return {
    connections,
    analytics,
    loading,
    syncing,
    connectMarketplace,
    syncMarketplace,
    disconnectMarketplace,
    refetch: () => {
      fetchConnections()
      fetchAnalytics()
    }
  }
}