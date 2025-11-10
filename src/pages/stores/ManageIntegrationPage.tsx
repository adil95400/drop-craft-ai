import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Loader2, Settings, Activity, Database, AlertTriangle } from 'lucide-react'
import { BackButton } from '@/components/navigation/BackButton'

export default function ManageIntegrationPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [integration, setIntegration] = useState<any>(null)
  const [syncLogs, setSyncLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (id) {
      loadIntegrationDetails()
      loadSyncLogs()
    }
  }, [id])

  const loadIntegrationDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      setIntegration(data)
    } catch (error) {
      console.error('Error loading integration:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails de l'intégration",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadSyncLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('sync_logs')
        .select('*')
        .eq('integration_id', id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      setSyncLogs(data || [])
    } catch (error) {
      console.error('Error loading sync logs:', error)
    }
  }

  const triggerSync = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('sync-integration', {
        body: { integration_id: id, sync_type: 'full' }
      })

      if (error) throw error

      toast({
        title: "Synchronisation lancée",
        description: "La synchronisation complète a été démarrée",
      })

      // Reload data after a delay
      setTimeout(() => {
        loadIntegrationDetails()
        loadSyncLogs()
      }, 2000)

    } catch (error) {
      console.error('Sync error:', error)
      toast({
        title: "Erreur",
        description: "Impossible de lancer la synchronisation",
        variant: "destructive"
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR')
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      'active': 'default',
      'error': 'destructive',
      'syncing': 'secondary',
      'completed': 'default',
      'failed': 'destructive'
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status}
      </Badge>
    )
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

  if (!integration) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Intégration introuvable
            </h3>
            <p className="text-gray-600 mb-6">
              L'intégration demandée n'existe pas ou vous n'avez pas l'autorisation de la voir.
            </p>
            <Button onClick={() => navigate('/stores/integrations')}>
              Retour aux intégrations
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <BackButton to="/dashboard/stores/integrations" label="Retour aux intégrations" />
      </div>
      <div className="flex items-center space-x-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {integration.store_config?.shop_name || `Boutique ${integration.platform_name}`}
          </h1>
          <p className="text-gray-600 capitalize">
            Intégration {integration.platform_name}
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="sync-logs">Logs de sync</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Statut de l'intégration</span>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(integration.connection_status)}
                    <Button onClick={triggerSync} size="sm">
                      <Activity className="h-4 w-4 mr-2" />
                      Synchroniser
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Plateforme</p>
                    <p className="text-lg font-semibold capitalize">{integration.platform_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Créée le</p>
                    <p className="text-lg font-semibold">{formatDate(integration.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Dernière sync</p>
                    <p className="text-lg font-semibold">
                      {integration.last_sync_at ? formatDate(integration.last_sync_at) : 'Jamais'}
                    </p>
                  </div>
                </div>

                {integration.store_config && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Informations de la boutique</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {Object.entries(integration.store_config).map(([key, value]) => (
                        <div key={key}>
                          <span className="font-medium text-gray-700 capitalize">
                            {key.replace('_', ' ')}:
                          </span>
                          <span className="ml-2 text-gray-600">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sync-logs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Historique des synchronisations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {syncLogs.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune synchronisation effectuée</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {syncLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(log.status)}
                          <span className="text-sm text-gray-600">
                            {formatDate(log.created_at)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500 capitalize">
                          {log.sync_type}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Produits synchronisés:</span>
                          <span className="ml-2">{log.products_synced || 0}</span>
                        </div>
                        <div>
                          <span className="font-medium">Commandes synchronisées:</span>
                          <span className="ml-2">{log.orders_synced || 0}</span>
                        </div>
                      </div>

                      {log.errors && log.errors.length > 0 && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                          <p className="text-sm font-medium text-red-800 mb-1">Erreurs:</p>
                          <ul className="text-sm text-red-700 list-disc list-inside">
                            {log.errors.map((error: string, index: number) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Paramètres de l'intégration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Synchronisation automatique</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Configure la fréquence de synchronisation automatique des données
                  </p>
                  <Button variant="outline" disabled>
                    Configuration automatique (Bientôt disponible)
                  </Button>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Types de données</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Choisissez quelles données synchroniser
                  </p>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked disabled />
                      <span className="text-sm">Produits</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked disabled />
                      <span className="text-sm">Commandes</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" disabled />
                      <span className="text-sm">Clients</span>
                    </label>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium text-red-600 mb-2">Zone de danger</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Actions irréversibles pour cette intégration
                  </p>
                  <Button variant="destructive" disabled>
                    Supprimer l'intégration
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}