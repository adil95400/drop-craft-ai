import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

export interface Integration {
  id: string
  user_id: string
  platform_type: string
  platform_name: string
  platform_url?: string
  shop_domain?: string
  seller_id?: string
  is_active: boolean
  connection_status: string
  sync_frequency: string
  last_sync_at?: string
  store_config: any
  sync_settings: any
  last_error?: string
  created_at: string
  updated_at: string
}

export interface IntegrationTemplate {
  id: string
  name: string
  description: string
  category: 'Marketing' | 'Analytics' | 'Payment' | 'Communication' | 'AI' | 'Automation' | 'Security'
  icon: any
  status: 'available' | 'beta' | 'coming_soon'
  premium: boolean
  rating: number
  installs: number
  features: string[]
}

export function useIntegrations() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchIntegrations()
    }
  }, [user])

  const fetchIntegrations = async () => {
    try {
      setLoading(true)
      // Utiliser des données mockées pour le moment
      const mockIntegrations = [
        {
          id: '1',
          user_id: user?.id || '',
          platform_type: 'analytics',
          platform_name: 'Google Analytics 4',
          is_active: true,
          connection_status: 'connected',
          sync_frequency: 'daily',
          store_config: {},
          sync_settings: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          user_id: user?.id || '',
          platform_type: 'payment',
          platform_name: 'Stripe',
          is_active: true,
          connection_status: 'connected',
          sync_frequency: 'realtime',
          store_config: {},
          sync_settings: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      setIntegrations(mockIntegrations)
    } catch (error) {
      console.error('Error fetching integrations:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les intégrations",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const connectIntegration = async (template: IntegrationTemplate, credentials: any) => {
    if (!user) return false

    try {
      // Simuler la connexion d'une nouvelle intégration
      const newIntegration = {
        id: Date.now().toString(),
        user_id: user.id,
        platform_type: template.category.toLowerCase(),
        platform_name: template.name,
        platform_url: credentials.platform_url || '',
        shop_domain: credentials.shop_domain || '',
        seller_id: credentials.seller_id || '',
        is_active: true,
        connection_status: 'connected',
        sync_frequency: 'daily',
        store_config: credentials.store_config || {},
        sync_settings: credentials.sync_settings || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      setIntegrations(prev => [newIntegration, ...prev])
      toast({
        title: "Succès",
        description: `${template.name} connecté avec succès`
      })
      return true
    } catch (error) {
      console.error('Error connecting integration:', error)
      toast({
        title: "Erreur",
        description: "Impossible de connecter l'intégration",
        variant: "destructive"
      })
      return false
    }
  }

  const disconnectIntegration = async (integrationId: string) => {
    try {
      // Simuler la déconnexion
      setIntegrations(prev =>
        prev.map(integration =>
          integration.id === integrationId
            ? { ...integration, is_active: false, connection_status: 'disconnected' }
            : integration
        )
      )

      toast({
        title: "Succès",
        description: "Intégration déconnectée"
      })
    } catch (error) {
      console.error('Error disconnecting integration:', error)
      toast({
        title: "Erreur",
        description: "Impossible de déconnecter l'intégration",
        variant: "destructive"
      })
    }
  }

  const syncIntegration = async (integrationId: string) => {
    try {
      // Simuler la synchronisation
      setIntegrations(prev =>
        prev.map(integration =>
          integration.id === integrationId
            ? { ...integration, last_sync_at: new Date().toISOString() }
            : integration
        )
      )

      toast({
        title: "Succès",
        description: "Synchronisation terminée"
      })
    } catch (error) {
      console.error('Error syncing integration:', error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la synchronisation",
        variant: "destructive"
      })
    }
  }

  const updateIntegrationSettings = async (integrationId: string, settings: any) => {
    try {
      // Simuler la mise à jour des paramètres
      setIntegrations(prev =>
        prev.map(integration =>
          integration.id === integrationId
            ? { ...integration, sync_settings: settings }
            : integration
        )
      )

      toast({
        title: "Succès",
        description: "Paramètres mis à jour"
      })
    } catch (error) {
      console.error('Error updating integration settings:', error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les paramètres",
        variant: "destructive"
      })
    }
  }

  return {
    integrations,
    loading,
    connectIntegration,
    disconnectIntegration,
    syncIntegration,
    updateIntegrationSettings,
    refetch: fetchIntegrations
  }
}