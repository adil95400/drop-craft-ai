import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { 
  Loader2, 
  ShoppingCart, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  RefreshCw,
  Plus,
  Settings,
  BarChart3,
  Users,
  Package,
  Store,
  Calendar,
  Activity
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

interface IntegrationStats {
  total_integrations: number
  active_integrations: number
  syncing_integrations: number
  error_integrations: number
  total_products_synced: number
  total_orders_synced: number
  sync_success_rate: number
}

interface RecentSync {
  id: string
  integration_id: string
  platform: string
  shop_name: string
  status: string
  products_synced: number
  orders_synced: number
  created_at: string
}

export default function StoreDashboard() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [refreshing, setRefreshing] = useState(false)

  // Charger les intégrations
  const { data: integrations = [], isLoading: loadingIntegrations, refetch: refetchIntegrations } = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    }
  })

  // Charger les logs de synchronisation
  const { data: syncLogs = [], isLoading: loadingSyncs } = useQuery({
    queryKey: ['sync-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sync_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      return data || []
    }
  })

  // Calculer les statistiques
  const stats: IntegrationStats = {
    total_integrations: integrations.length,
    active_integrations: integrations.filter(i => i.connection_status === 'active').length,
    syncing_integrations: integrations.filter(i => i.connection_status === 'syncing').length,
    error_integrations: integrations.filter(i => i.connection_status === 'error').length,
    total_products_synced: syncLogs.reduce((sum, log) => sum + (log.records_succeeded || 0), 0),
    total_orders_synced: syncLogs.reduce((sum, log) => sum + (log.records_processed || 0), 0),
    sync_success_rate: syncLogs.length > 0 
      ? Math.round((syncLogs.filter(log => log.status === 'completed').length / syncLogs.length) * 100)
      : 0
  }

  // Formater les synchronisations récentes avec les vraies données
  const recentSyncs: RecentSync[] = integrations.slice(0, 5).map((integration) => {
    const integrationLogs = syncLogs.filter(log => log.integration_id === integration.id)
    const lastLog = integrationLogs[0]
    const config = integration.store_config as any
    
    return {
      id: integration.id,
      integration_id: integration.id,
      platform: integration.platform_name || 'unknown',
      shop_name: config?.shop_name || integration.shop_domain || 'Boutique',
      status: lastLog?.status || integration.connection_status || 'never',
      products_synced: lastLog?.records_succeeded || 0,
      orders_synced: lastLog?.records_processed || 0,
      created_at: lastLog?.started_at || integration.last_sync_at || integration.created_at
    }
  })

  const loading = loadingIntegrations || loadingSyncs

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([refetchIntegrations()])
      toast({
        title: "Actualisation réussie",
        description: "Les données ont été mises à jour",
      })
    } catch (error) {
      console.error('Refresh error:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'actualiser les données",
        variant: "destructive"
      })
    } finally {
      setRefreshing(false)
    }
  }

  const syncIntegration = async (integrationId: string) => {
    try {
      const { error } = await supabase.functions.invoke('sync-integration', {
        body: { integration_id: integrationId, sync_type: 'full' }
      })

      if (error) throw error

      toast({
        title: "Synchronisation lancée",
        description: "La synchronisation a été démarrée",
      })

      // Recharger après 2 secondes
      setTimeout(() => refetchIntegrations(), 2000)
    } catch (error) {
      console.error('Sync error:', error)
      toast({
        title: "Erreur de synchronisation",
        description: "Impossible de lancer la synchronisation",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const config = {
      'completed': { variant: 'default' as const, label: 'Terminé', icon: CheckCircle, color: 'text-green-500' },
      'failed': { variant: 'destructive' as const, label: 'Échoué', icon: AlertCircle, color: 'text-red-500' },
      'running': { variant: 'secondary' as const, label: 'En cours', icon: Loader2, color: 'text-blue-500' },
      'syncing': { variant: 'secondary' as const, label: 'Synchronisation', icon: RefreshCw, color: 'text-blue-500' },
      'never': { variant: 'outline' as const, label: 'Jamais synchronisé', icon: Calendar, color: 'text-gray-500' }
    }

    const statusConfig = config[status as keyof typeof config] || config['never']
    const Icon = statusConfig.icon

    return (
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${statusConfig.color}`} />
        <Badge variant={statusConfig.variant}>
          {statusConfig.label}
        </Badge>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
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
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Store className="h-8 w-8 text-primary" />
            Dashboard Boutiques
          </h1>
          <p className="text-muted-foreground mt-2">
            Vue d'ensemble de vos intégrations e-commerce
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleRefresh} 
            variant="outline"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button onClick={() => navigate('/dashboard/stores/integrations')} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Gérer
          </Button>
          <Button onClick={() => navigate('/dashboard/stores/connect')}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une boutique
          </Button>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Intégrations</CardTitle>
            <ShoppingCart className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.total_integrations}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              {stats.active_integrations} actives
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Produits Synchronisés</CardTitle>
            <Package className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.total_products_synced.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Depuis le début
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Commandes Synchronisées</CardTitle>
            <Users className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.total_orders_synced.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Depuis le début
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Taux de Réussite</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.sync_success_rate}%</div>
            <Progress value={stats.sync_success_rate} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Statut des intégrations */}
      {stats.total_integrations > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground">
              <Activity className="h-5 w-5 mr-2 text-primary" />
              Statut des Intégrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                <span className="text-2xl font-bold text-foreground">{stats.active_integrations}</span>
                <span className="text-sm text-muted-foreground">Actives</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <RefreshCw className="h-8 w-8 text-blue-500 mb-2" />
                <span className="text-2xl font-bold text-foreground">{stats.syncing_integrations}</span>
                <span className="text-sm text-muted-foreground">En sync</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
                <span className="text-2xl font-bold text-foreground">{stats.error_integrations}</span>
                <span className="text-sm text-muted-foreground">Erreurs</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-950 rounded-lg">
                <BarChart3 className="h-8 w-8 text-gray-500 mb-2" />
                <span className="text-2xl font-bold text-foreground">{stats.total_integrations}</span>
                <span className="text-sm text-muted-foreground">Total</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Intégrations récentes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Intégrations Actives
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/dashboard/stores/integrations')}
            >
              Voir tout
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentSyncs.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium text-foreground mb-2">Aucune intégration</p>
              <p className="text-sm text-muted-foreground mb-6">
                Connectez votre première boutique pour commencer
              </p>
              <Button onClick={() => navigate('/dashboard/stores/connect')}>
                <Plus className="h-4 w-4 mr-2" />
                Connecter une boutique
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSyncs.map((sync) => (
                <div 
                  key={sync.id} 
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary hover:shadow-md transition-all cursor-pointer bg-card"
                  onClick={() => navigate(`/dashboard/stores/integrations/${sync.integration_id}`)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Store className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{sync.shop_name}</p>
                      <p className="text-sm text-muted-foreground capitalize flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs">
                          {sync.platform}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <p className="text-foreground font-medium">{sync.products_synced}</p>
                          <p className="text-xs text-muted-foreground">Produits</p>
                        </div>
                        <div>
                          <p className="text-foreground font-medium">{sync.orders_synced}</p>
                          <p className="text-xs text-muted-foreground">Commandes</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(sync.status)}
                      <p className="text-xs text-muted-foreground">
                        {formatDate(sync.created_at)}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        syncIntegration(sync.integration_id)
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions rapides */}
      {stats.total_integrations === 0 && (
        <Card className="mt-6 border-2 border-dashed border-primary/20">
          <CardContent className="py-16 text-center">
            <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">
              Connectez votre première boutique
            </h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Synchronisez vos produits, commandes et données depuis Shopify, WooCommerce, et plus de 20 plateformes e-commerce
            </p>
            <Button size="lg" onClick={() => navigate('/dashboard/stores/connect')}>
              <Plus className="h-5 w-5 mr-2" />
              Ajouter une intégration
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}