import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Store, Plus, RefreshCw, TrendingUp, Package, ShoppingCart, AlertCircle } from 'lucide-react'
import { useStores } from '@/hooks/useStores'
import { useNavigate } from 'react-router-dom'

export function StoresOverview() {
  const { stores, loading, syncStore } = useStores()
  const navigate = useNavigate()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Boutiques connectées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const getTotalStats = () => {
    return stores.reduce((acc, store) => ({
      products: acc.products + store.products_count,
      orders: acc.orders + store.orders_count,
      revenue: acc.revenue + store.revenue
    }), { products: 0, orders: 0, revenue: 0 })
  }

  const connectedStores = stores.filter(store => store.status === 'connected')
  const errorStores = stores.filter(store => store.status === 'error')
  const stats = getTotalStats()

  if (stores.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Boutiques connectées
          </CardTitle>
          <CardDescription>
            Connectez vos boutiques e-commerce pour centraliser la gestion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Aucune boutique connectée
            </p>
            <Button onClick={() => navigate('/stores-channels')}>
              <Plus className="mr-2 h-4 w-4" />
              Connecter une boutique
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Boutiques</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stores.length}</div>
            <p className="text-xs text-muted-foreground">
              {connectedStores.length} connectées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.products.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total synchronisé
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Toutes boutiques
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.revenue.toLocaleString('fr-FR', { 
                style: 'currency', 
                currency: 'EUR' 
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Chiffre d'affaires
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Aperçu des boutiques */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Boutiques connectées
              </CardTitle>
              <CardDescription>
                Gérez vos boutiques e-commerce depuis un seul endroit
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualiser
              </Button>
              <Button size="sm" onClick={() => navigate('/stores-channels')}>
                Voir toutes
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stores.slice(0, 3).map((store) => (
              <div key={store.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-semibold">
                    {store.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{store.name}</p>
                    <p className="text-sm text-muted-foreground">{store.domain}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">
                    {store.platform}
                  </Badge>
                  <Badge className={`${
                    store.status === 'connected' ? 'bg-success text-success-foreground' :
                    store.status === 'syncing' ? 'bg-warning text-warning-foreground' :
                    store.status === 'error' ? 'bg-destructive text-destructive-foreground' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {store.status === 'connected' ? 'Connectée' :
                     store.status === 'syncing' ? 'Sync...' :
                     store.status === 'error' ? 'Erreur' : 'Déconnectée'}
                  </Badge>
                  <div className="text-right text-sm">
                    <p className="font-medium">{store.products_count} produits</p>
                    <p className="text-muted-foreground">{store.orders_count} commandes</p>
                  </div>
                </div>
              </div>
            ))}

            {errorStores.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive">
                  {errorStores.length} boutique(s) en erreur nécessitent votre attention
                </p>
              </div>
            )}

            {stores.length > 3 && (
              <div className="text-center pt-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/stores')}>
                  Voir {stores.length - 3} boutique(s) de plus
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}