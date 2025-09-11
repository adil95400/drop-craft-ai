import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Store, RefreshCw, Settings, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useStores } from '@/hooks/useStores'
import { StoreCard } from './components/StoreCard'

const StoresPage = () => {
  const { stores, loading, syncStore, disconnectStore, refetch } = useStores()

  const handleSync = async (storeId: string) => {
    await syncStore(storeId)
  }

  const handleDisconnect = async (storeId: string) => {
    await disconnectStore(storeId)
  }

  const getTotalStats = () => {
    return stores.reduce((acc, store) => ({
      products: acc.products + store.products_count,
      orders: acc.orders + store.orders_count,
      revenue: acc.revenue + store.revenue
    }), { products: 0, orders: 0, revenue: 0 })
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
          <Link to="/stores/connect">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Connecter une boutique
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats globales */}
      {stores.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total produits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.products.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total commandes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.orders.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Chiffre d'affaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.revenue.toLocaleString('fr-FR', { 
                  style: 'currency', 
                  currency: 'EUR' 
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Liste des boutiques */}
      {stores.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <Store className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <CardTitle>Aucune boutique connectée</CardTitle>
            <CardDescription>
              Connectez votre première boutique pour commencer à synchroniser vos données
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/stores/connect">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Connecter une boutique
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              onSync={handleSync}
              onDisconnect={handleDisconnect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default StoresPage