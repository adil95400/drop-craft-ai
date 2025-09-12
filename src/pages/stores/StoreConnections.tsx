import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Store, RefreshCw } from 'lucide-react'
import { ConnectStoreDialog } from './components/ConnectStoreDialog'
import { ShopifyStoreCard } from '@/components/stores/ShopifyStoreCard'
import { useState } from 'react'
import { useRealIntegrations } from '@/hooks/useRealIntegrations'
import { useRealProducts } from '@/hooks/useRealProducts'
import { useRealOrders } from '@/hooks/useRealOrders'

export function StoreConnections() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { integrations, isLoading, stats } = useRealIntegrations()
  const { stats: productStats } = useRealProducts()
  const { stats: orderStats } = useRealOrders()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Boutiques connectées</h2>
            <p className="text-muted-foreground">Gérez vos boutiques e-commerce connectées</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Boutiques connectées</h2>
          <p className="text-muted-foreground">Gérez vos boutiques e-commerce connectées</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Connecter une boutique
          </Button>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Store className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total boutiques</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Connectées</p>
              <p className="text-2xl font-bold">{stats.connected}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-red-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Déconnectées</p>
              <p className="text-2xl font-bold">{stats.disconnected}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <RefreshCw className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Dernière sync</p>
              <p className="text-2xl font-bold">
                {stats.lastSync > new Date(0) ? 
                  stats.lastSync.toLocaleDateString('fr-FR') : 
                  'Jamais'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des boutiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => {
          // Utiliser le composant spécialisé pour Shopify
          if (integration.platform_type === 'shopify') {
            return (
              <ShopifyStoreCard
                key={integration.id}
                integration={integration}
                stats={{
                  products: productStats.total,
                  orders: orderStats.total,
                  revenue: orderStats.revenue
                }}
              />
            )
          }

          // Composant générique pour les autres plateformes
          return (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Store className="w-5 h-5" />
                    {integration.platform_name}
                  </CardTitle>
                  <Badge 
                    variant={integration.connection_status === 'connected' ? 'default' : 'destructive'}
                  >
                    {integration.connection_status === 'connected' ? 'Connecté' : 'Déconnecté'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Plateforme: {integration.platform_type}
                  </p>
                  {integration.shop_domain && (
                    <p className="text-sm text-muted-foreground">
                      Domaine: {integration.shop_domain}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Dernière sync: {integration.last_sync_at ? 
                      new Date(integration.last_sync_at).toLocaleDateString('fr-FR') : 
                      'Jamais'
                    }
                  </p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    Configurer
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Sync
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
        
        {integrations.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Store className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune boutique connectée</h3>
              <p className="text-muted-foreground mb-4 text-center">
                Connectez votre première boutique pour commencer à synchroniser vos données
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Connecter une boutique
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <ConnectStoreDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  )
}