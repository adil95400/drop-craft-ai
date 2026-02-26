import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Loader2, Settings, Activity, Database, AlertTriangle, RefreshCw, TrendingUp, Clock, CheckCircle, Trash2 } from 'lucide-react'
import { BackButton } from '@/components/navigation/BackButton'
import { useStoreIntegrations } from '@/hooks/useStoreIntegrations'
import { useSyncLogs } from '@/hooks/useSyncLogs'
import { PlatformConnectionStatus } from '@/components/integrations/PlatformConnectionStatus'
import { WebhookManager } from '@/components/webhooks/WebhookManager'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { formatDistanceToNow } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'

export default function ManageIntegrationPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const { integrations, syncIntegration, deleteIntegration, isSyncing } = useStoreIntegrations()
  const { logs, stats, isLoading: logsLoading, refetch: refetchLogs } = useSyncLogs(id, 50)
  
  const integration = integrations.find(i => i.id === id)
  const isLoading = !integration && integrations.length === 0

  const handleSync = () => {
    if (id) {
      syncIntegration(id);
      setTimeout(() => refetchLogs(), 2000);
    }
  };

  const handleDelete = () => {
    if (id && confirm('Êtes-vous sûr de vouloir supprimer cette intégration ? Cette action est irréversible.')) {
      deleteIntegration(id);
      navigate('/stores-channels/integrations');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  const formatRelativeTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: getDateFnsLocale() })
  }

  const calculateSuccessRate = () => {
    if (stats.total === 0) return 0;
    return Math.round((stats.completed / stats.total) * 100);
  };

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

  if (isLoading) {
    return (
      <ChannablePageWrapper title="Intégration" description="Chargement…" heroImage="integrations" badge={{ label: 'Intégration', icon: Settings }}>
        <div className="flex items-center justify-center min-h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ChannablePageWrapper>
    )
  }

  if (!integration) {
    return (
      <ChannablePageWrapper title="Intégration introuvable" description="L'intégration demandée n'existe pas" heroImage="integrations" badge={{ label: 'Erreur', icon: AlertTriangle }}>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Intégration introuvable
            </h3>
            <p className="text-muted-foreground mb-6">
              L'intégration demandée n'existe pas ou vous n'avez pas l'autorisation de la voir.
            </p>
            <Button onClick={() => navigate('/stores-channels/integrations')}>
              Retour aux intégrations
            </Button>
          </CardContent>
        </Card>
      </ChannablePageWrapper>
    )
  }

  return (
    <ChannablePageWrapper
      title={integration.store_config?.shop_name || `Boutique ${integration.platform_name}`}
      description={`Intégration ${integration.platform_name} — Gérez la synchronisation et les paramètres`}
      heroImage="integrations"
      badge={{ label: integration.platform_name, icon: Settings }}
      actions={
        <Button onClick={handleSync} disabled={isSyncing}>
          {isSyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Synchroniser
        </Button>
      }
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux de succès</p>
                <p className="text-2xl font-bold text-foreground">{calculateSuccessRate()}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
            </div>
            <Progress value={calculateSuccessRate()} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Syncs totales</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <Activity className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produits</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalProducts}</p>
              </div>
              <div className="h-8 w-8 flex items-center justify-center text-2xl opacity-50">📦</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Commandes</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalOrders}</p>
              </div>
              <div className="h-8 w-8 flex items-center justify-center text-2xl opacity-50">🛒</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="sync-logs">Logs de sync</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              <TabsTrigger value="settings">Paramètres</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Statut de l'intégration</span>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(integration.connection_status)}
                    </div>
                  </CardTitle>
                  <CardDescription>Informations détaillées sur votre intégration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Plateforme</p>
                      <p className="text-lg font-semibold capitalize text-foreground">{integration.platform_name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Créée le</p>
                      <p className="text-lg font-semibold text-foreground">{formatDate(integration.created_at)}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(integration.created_at)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Dernière sync</p>
                      <p className="text-lg font-semibold text-foreground">
                        {integration.last_sync_at ? formatDate(integration.last_sync_at) : 'Jamais'}
                      </p>
                      {integration.last_sync_at && (
                        <p className="text-xs text-muted-foreground">{formatRelativeTime(integration.last_sync_at)}</p>
                      )}
                    </div>
                  </div>

                  {integration.store_config && (
                    <div className="p-4 bg-muted/50 rounded-lg border">
                      <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Informations de la boutique
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {Object.entries(integration.store_config).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center">
                            <span className="font-medium text-muted-foreground capitalize">
                              {key.replace(/_/g, ' ')}:
                            </span>
                            <span className="text-foreground font-mono text-xs bg-background px-2 py-1 rounded">
                              {String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sync-logs" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Historique des synchronisations
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {stats.total} synchronisation{stats.total > 1 ? 's' : ''} • {stats.completed} réussie{stats.completed > 1 ? 's' : ''} • {stats.failed} échouée{stats.failed > 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                    <Button onClick={() => refetchLogs()} variant="outline" size="sm" disabled={logsLoading}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${logsLoading ? 'animate-spin' : ''}`} />
                      Actualiser
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {logs.length === 0 ? (
                    <div className="text-center py-8">
                      <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">Aucune synchronisation effectuée</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {logs.map((log) => (
                        <div key={log.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              {log.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                              {log.status === 'failed' && <AlertTriangle className="h-4 w-4 text-destructive" />}
                              {log.status === 'in_progress' && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
                              {getStatusBadge(log.status)}
                              <span className="text-xs text-muted-foreground">
                                {formatRelativeTime(log.created_at)}
                              </span>
                            </div>
                            <Badge variant="outline" className="capitalize text-xs">
                              {log.sync_type}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                              <span className="text-muted-foreground">Produits:</span>
                              <span className="font-semibold text-foreground">{log.products_synced || 0}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-green-500"></div>
                              <span className="text-muted-foreground">Commandes:</span>
                              <span className="font-semibold text-foreground">{log.orders_synced || 0}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                              <span className="text-muted-foreground">Clients:</span>
                              <span className="font-semibold text-foreground">{log.customers_synced || 0}</span>
                            </div>
                          </div>

                          {log.completed_at && log.started_at && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                              <Clock className="h-3 w-3" />
                              <span>
                                Durée: {Math.round((new Date(log.completed_at).getTime() - new Date(log.started_at).getTime()) / 1000)}s
                              </span>
                            </div>
                          )}

                          {log.errors && log.errors.length > 0 && (
                            <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded">
                              <p className="text-sm font-medium text-destructive mb-1 flex items-center gap-2">
                                <AlertTriangle className="h-3 w-3" />
                                Erreurs ({log.errors.length}):
                              </p>
                              <ul className="text-sm text-destructive/80 list-disc list-inside space-y-1">
                                {log.errors.slice(0, 3).map((error: string, index: number) => (
                                  <li key={index} className="truncate">{error}</li>
                                ))}
                                {log.errors.length > 3 && (
                                  <li className="text-xs">... et {log.errors.length - 3} autre(s)</li>
                                )}
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

            <TabsContent value="webhooks" className="space-y-4">
              <WebhookManager integrationId={integration.id} />
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
                      <h4 className="font-medium text-foreground mb-2">Synchronisation automatique</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Configure la fréquence de synchronisation automatique des données
                      </p>
                      <select 
                        className="w-full border rounded-md px-3 py-2 bg-background text-foreground"
                        value={integration.sync_frequency || 'manual'}
                        disabled
                      >
                        <option value="manual">Manuelle</option>
                        <option value="hourly">Chaque heure</option>
                        <option value="daily">Quotidienne</option>
                        <option value="weekly">Hebdomadaire</option>
                      </select>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] px-1.5">Bientôt</Badge>
                        Configuration automatique
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-foreground mb-2">Types de données</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Choisissez quelles données synchroniser
                      </p>
                      <div className="space-y-3">
                        <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                          <input type="checkbox" defaultChecked className="rounded" disabled />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-foreground">Produits</span>
                            <p className="text-xs text-muted-foreground">Synchroniser tous les produits de votre boutique</p>
                          </div>
                        </label>
                        <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                          <input type="checkbox" defaultChecked className="rounded" disabled />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-foreground">Commandes</span>
                            <p className="text-xs text-muted-foreground">Synchroniser les commandes et leur statut</p>
                          </div>
                        </label>
                        <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                          <input type="checkbox" className="rounded" disabled />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-foreground">Clients</span>
                            <p className="text-xs text-muted-foreground">Synchroniser les informations clients</p>
                          </div>
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        La personnalisation des données sera bientôt disponible
                      </p>
                    </div>

                    <div className="border-t pt-6">
                      <h4 className="font-medium text-destructive mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Zone de danger
                      </h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Actions irréversibles pour cette intégration. Cette action supprimera toutes les données de synchronisation associées.
                      </p>
                      <Button variant="destructive" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer l'intégration
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar with Connection Status */}
        <div className="space-y-6">
          <PlatformConnectionStatus 
            integration={integration}
            onSync={handleSync}
          />
        </div>
      </div>
    </ChannablePageWrapper>
  )
}
