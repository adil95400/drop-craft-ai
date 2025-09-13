import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useConnectedStores } from '@/hooks/useConnectedStores'
import { 
  Store, 
  RefreshCw, 
  Settings, 
  TrendingUp, 
  Package, 
  ShoppingCart,
  ExternalLink,
  Wifi,
  WifiOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface ConnectedStoresProps {
  className?: string
}

export function ConnectedStores({ className }: ConnectedStoresProps) {
  const { stores, loading, syncStore, stats } = useConnectedStores()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'syncing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <WifiOff className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      connected: 'bg-green-100 text-green-800',
      syncing: 'bg-blue-100 text-blue-800',
      error: 'bg-red-100 text-red-800',
      disconnected: 'bg-gray-100 text-gray-800'
    }
    
    const labels = {
      connected: 'Connectée',
      syncing: 'Synchronisation',
      error: 'Erreur',
      disconnected: 'Déconnectée'
    }

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.disconnected}>
        {labels[status as keyof typeof labels] || 'Inconnue'}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Jamais'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Card className={`border-0 shadow-md ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-blue-500" />
            Boutiques Connectées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border-0 shadow-md ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-blue-500" />
            Boutiques Connectées
            <Badge variant="secondary">{stats.connected}/{stats.total}</Badge>
          </CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link to="/stores/connect">
              <Plus className="h-4 w-4 mr-1" />
              Connecter
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {stores.length === 0 ? (
          <div className="text-center py-8">
            <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">Aucune boutique connectée</h3>
            <p className="text-gray-500 mb-4">Connectez vos boutiques en ligne pour commencer</p>
            <Button asChild>
              <Link to="/stores/connect">
                <Plus className="h-4 w-4 mr-2" />
                Connecter une boutique
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Stats globales */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <Package className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <div className="font-semibold text-blue-900">{stats.totalProducts.toLocaleString()}</div>
                <div className="text-xs text-blue-700">Produits</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <div className="font-semibold text-green-900">{stats.totalOrders.toLocaleString()}</div>
                <div className="text-xs text-green-700">Commandes</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                <div className="font-semibold text-purple-900">{formatCurrency(stats.totalSales)}</div>
                <div className="text-xs text-purple-700">CA Total</div>
              </div>
            </div>

            {/* Liste des boutiques */}
            <div className="space-y-3">
              {stores.map((store) => (
                <div key={store.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Store className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{store.platform_name}</h4>
                          {getStatusIcon(store.connection_status)}
                        </div>
                        {store.shop_domain && (
                          <p className="text-sm text-gray-500">{store.shop_domain}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(store.connection_status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                    <div>
                      <span className="text-gray-500">Produits: </span>
                      <span className="font-medium">{store.products_count?.toLocaleString() || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Commandes: </span>
                      <span className="font-medium">{store.orders_count?.toLocaleString() || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">CA: </span>
                      <span className="font-medium">{formatCurrency(store.sales_volume || 0)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Dernière sync: {formatDate(store.last_sync_at)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => syncStore(store.id)}
                        disabled={store.connection_status === 'syncing'}
                      >
                        <RefreshCw className={`h-3 w-3 mr-1 ${store.connection_status === 'syncing' ? 'animate-spin' : ''}`} />
                        Sync
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/stores/${store.id}`}>
                          <Settings className="h-3 w-3 mr-1" />
                          Config
                        </Link>
                      </Button>
                      {store.shop_domain && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={`https://${store.shop_domain}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}