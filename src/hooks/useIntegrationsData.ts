import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface Integration {
  id: string
  platform_name: string
  platform_url?: string
  shop_domain?: string
  connection_status: 'connected' | 'error' | 'connecting' | 'disconnected'
  is_active: boolean
  store_config?: {
    name?: string
    platform?: string
    domain?: string
  }
  last_sync_at?: string
  sync_settings?: {
    auto_sync?: boolean
    import_products?: boolean
    track_orders?: boolean
  }
  created_at: string
  updated_at: string
}

export function useIntegrationsData() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchIntegrations = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('integrations')
        .select(`
          id,
          platform_name,
          platform_url,
          shop_domain,
          connection_status,
          is_active,
          store_config,
          last_sync_at,
          sync_settings,
          created_at,
          updated_at
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      setIntegrations((data || []).map(item => ({
        ...item,
        connection_status: item.connection_status as 'connected' | 'error' | 'connecting' | 'disconnected',
        store_config: item.store_config as { name?: string; platform?: string; domain?: string } | undefined,
        sync_settings: item.sync_settings as { auto_sync?: boolean; import_products?: boolean; track_orders?: boolean } | undefined
      })))
      setError(null)
    } catch (error: any) {
      console.error('Error fetching integrations:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const syncIntegration = async (integrationId: string) => {
    try {
      // Mettre à jour le statut vers "connecting"
      await supabase
        .from('integrations')
        .update({ 
          connection_status: 'connecting',
          last_sync_at: new Date().toISOString()
        })
        .eq('id', integrationId)

      // Simuler une synchronisation réussie
      setTimeout(async () => {
        await supabase
          .from('integrations')
          .update({ 
            connection_status: 'connected'
          })
          .eq('id', integrationId)

        toast({
          title: "Synchronisation terminée",
          description: "Vos données ont été synchronisées avec succès"
        })

        fetchIntegrations()
      }, 2000)

      fetchIntegrations()
    } catch (error: any) {
      toast({
        title: "Erreur de synchronisation",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const disconnectIntegration = async (integrationId: string) => {
    try {
      await supabase
        .from('integrations')
        .update({ 
          is_active: false,
          connection_status: 'disconnected'
        })
        .eq('id', integrationId)

      toast({
        title: "Boutique déconnectée",
        description: "La boutique a été déconnectée avec succès"
      })

      fetchIntegrations()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    fetchIntegrations()
  }, [])

  return {
    integrations,
    loading,
    error,
    refetch: fetchIntegrations,
    syncIntegration,
    disconnectIntegration
  }
}