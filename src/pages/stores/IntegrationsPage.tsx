import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Loader2, RefreshCw, Settings, Trash2, Activity, AlertCircle, CheckCircle, Clock } from 'lucide-react'

export function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadIntegrations()
  }, [])

  const loadIntegrations = async () => {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setIntegrations(data || [])
    } catch (error) {
      console.error('Error loading integrations:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les intégrations",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const syncIntegration = async (integrationId: string) => {
    setSyncing(integrationId)
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-integration', {
        body: { integration_id: integrationId, sync_type: 'full' }
      })

      if (error) throw error

      toast({
        title: "Synchronisation lancée",
        description: "La synchronisation des données est en cours...",
      })

      // Reload integrations to show updated status
      setTimeout(() => {
        loadIntegrations()
      }, 2000)

    } catch (error) {
      console.error('Sync error:', error)
      toast({
        title: "Erreur de synchronisation",
        description: "Impossible de lancer la synchronisation",
        variant: "destructive"
      })
    } finally {
      setSyncing(null)
    }
  }

  const testConnection = async (integrationId: string) => {
    try {
      const integration = integrations.find(i => i.id === integrationId)
      if (!integration) return

      const { data, error } = await supabase.functions.invoke('test-integration', {
        body: { integration_id: integrationId }
      })

      if (error) throw error

      toast({
        title: data.success ? "Connexion réussie" : "Connexion échouée",
        description: data.message || "Test de connexion effectué",
        variant: data.success ? "default" : "destructive"
      })

      loadIntegrations()
    } catch (error) {
      console.error('Connection test error:', error)
      toast({
        title: "Erreur de test",
        description: "Impossible de tester la connexion",
        variant: "destructive"
      })
    }
  }

  const deleteIntegration = async (integrationId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette intégration ?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', integrationId)

      if (error) throw error

      toast({
        title: "Intégration supprimée",
        description: "L'intégration a été supprimée avec succès",
      })

      loadIntegrations()
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'intégration",
        variant: "destructive"
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'syncing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      'active': 'default',
      'error': 'destructive',
      'syncing': 'secondary',
      'disconnected': 'outline',
      'never': 'outline'
    } as const

    const labels = {
      'active': 'Actif',
      'error': 'Erreur',
      'syncing': 'Synchronisation',
      'disconnected': 'Déconnecté',
      'never': 'Jamais synchronisé'
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais'
    return new Date(dateString).toLocaleString('fr-FR')
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Intégrations</h1>
          <p className="text-gray-600 mt-2">
            Gérez vos intégrations e-commerce et leur synchronisation
          </p>
        </div>
        <Button onClick={loadIntegrations} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {integrations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune intégration
            </h3>
            <p className="text-gray-600 mb-6">
              Commencez par connecter votre première boutique
            </p>
            <Button>
              Ajouter une intégration
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(integration.connection_status)}
                    <div>
                      <CardTitle className="text-lg">
                        {integration.platform_data?.shop_name || `Boutique ${integration.platform}`}
                      </CardTitle>
                      <p className="text-sm text-gray-600 capitalize">
                        {integration.platform}
                        {integration.platform_data?.domain && ` • ${integration.platform_data.domain}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(integration.connection_status)}
                    {getStatusBadge(integration.sync_status || 'never')}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Créée le</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(integration.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Dernière sync</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(integration.last_sync_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Statut</p>
                    <p className="text-sm text-gray-600 capitalize">
                      {integration.sync_status || 'never'}
                    </p>
                  </div>
                </div>

                {integration.sync_errors && integration.sync_errors.length > 0 && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm font-medium text-red-800 mb-1">
                      Erreurs de synchronisation :
                    </p>
                    <ul className="text-sm text-red-700 list-disc list-inside">
                      {integration.sync_errors.map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => syncIntegration(integration.id)}
                    disabled={syncing === integration.id || integration.sync_status === 'syncing'}
                    size="sm"
                  >
                    {syncing === integration.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Synchroniser
                  </Button>
                  
                  <Button
                    onClick={() => testConnection(integration.id)}
                    variant="outline"
                    size="sm"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Tester
                  </Button>
                  
                  <Button
                    onClick={() => deleteIntegration(integration.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}