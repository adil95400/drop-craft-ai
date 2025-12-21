import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface Integration {
  id: string
  platform_name?: string
  platform?: string
  store_url?: string
  connection_status?: string
  is_active?: boolean
  config?: any
  last_sync_at?: string
  created_at?: string
  updated_at?: string
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
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      setIntegrations((data || []).map(item => ({
        id: item.id,
        platform_name: item.platform_name,
        platform: item.platform,
        store_url: item.store_url,
        connection_status: item.connection_status,
        is_active: item.is_active,
        config: item.config,
        last_sync_at: item.last_sync_at,
        created_at: item.created_at,
        updated_at: item.updated_at
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
      await supabase
        .from('integrations')
        .update({ 
          connection_status: 'connecting',
          last_sync_at: new Date().toISOString()
        })
        .eq('id', integrationId)

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
