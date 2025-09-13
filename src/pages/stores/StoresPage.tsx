import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useIntegrationsData } from '@/hooks/useIntegrationsData'
import { StoreConnectionStatus } from '@/components/stores/StoreConnectionStatus'
import { Store, Plus, RefreshCw, Settings, Unplug, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function StoresPage() {
  const { integrations, loading, refetch, syncIntegration, disconnectIntegration } = useIntegrationsData()

  const handleSync = async (integrationId: string) => {
    await syncIntegration(integrationId)
  }

  const handleDisconnect = async (integrationId: string) => {
    if (confirm('Êtes-vous sûr de vouloir déconnecter cette boutique ?')) {
      await disconnectIntegration(integrationId)
    }
  }

  const getTotalStats = () => {
    return {
      stores: integrations.length,
      connected: integrations.filter(i => i.connection_status === 'connected').length,
      errors: integrations.filter(i => i.connection_status === 'error').length
    }
  }

  const stats = getTotalStats()

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-muted rounded-md animate-pulse" />
          <div className="w-48 h-8 bg-muted rounded-md animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="w-32 h-6 bg-muted rounded" />
                <div className="w-24 h-4 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="w-full h-4 bg-muted rounded" />
                  <div className="w-3/4 h-4 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Store className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Boutiques connectées</h1>
            <p className="text-muted-foreground">
              Gérez vos boutiques e-commerce connectées
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={refetch} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </Button>
          <Button asChild className="gap-2">
            <Link to="/stores/connect">
              <Plus className="w-4 h-4" />
              Connecter une boutique
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats globales */}
      {integrations.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Boutiques totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.stores}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Connectées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.connected}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Erreurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Liste des boutiques */}
      {integrations.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <Store className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <CardTitle>Aucune boutique connectée</CardTitle>
            <CardDescription>
              Connectez votre première boutique pour commencer à synchroniser vos données
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="gap-2">
              <Link to="/stores/connect">
                <Plus className="w-4 h-4" />
                Connecter une boutique
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <Card key={integration.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Store className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {integration.store_config?.name || integration.platform_name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {integration.platform_name}
                      </p>
                    </div>
                  </div>
                  <StoreConnectionStatus status={integration.connection_status} />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {integration.shop_domain && (
                    <div className="flex items-center gap-2 text-sm">
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground truncate">
                        {integration.shop_domain}
                      </span>
                    </div>
                  )}
                  
                  {integration.last_sync_at && (
                    <div className="text-sm text-muted-foreground">
                      Dernière sync: {new Date(integration.last_sync_at).toLocaleDateString('fr-FR')}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSync(integration.id)}
                      disabled={integration.connection_status === 'connecting'}
                      className="flex-1"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Sync
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(integration.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Unplug className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}