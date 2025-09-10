import { useParams, NavLink } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Settings, 
  RefreshCw, 
  BarChart3, 
  Package, 
  ShoppingCart, 
  Users,
  ExternalLink
} from 'lucide-react'
import { useStores } from '@/hooks/useStores'
import { StoreProducts } from './StoreProducts'
import { StoreOrders } from './StoreOrders'
import { StoreAnalytics } from './StoreAnalytics'

export function StoreDashboardPage() {
  const { storeId } = useParams()
  const { stores, syncStore } = useStores()
  
  const store = stores.find(s => s.id === storeId)

  if (!store) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Boutique non trouvée</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const platformColors = {
    shopify: 'bg-green-500',
    woocommerce: 'bg-purple-500',
    prestashop: 'bg-blue-500',
    magento: 'bg-orange-500'
  }

  const statusColors = {
    connected: 'bg-success text-success-foreground',
    disconnected: 'bg-destructive text-destructive-foreground',
    syncing: 'bg-warning text-warning-foreground',
    error: 'bg-destructive text-destructive-foreground'
  }

  const statusLabels = {
    connected: 'Connectée',
    disconnected: 'Déconnectée',
    syncing: 'Synchronisation...',
    error: 'Erreur'
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <NavLink to="/dashboard/stores">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux boutiques
            </NavLink>
          </Button>
          <div className="flex items-center space-x-3">
            {store.logo_url ? (
              <img 
                src={store.logo_url} 
                alt={store.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className={`w-12 h-12 rounded-lg ${platformColors[store.platform]} flex items-center justify-center text-white font-semibold text-lg`}>
                {store.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{store.name}</h1>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{store.platform}</Badge>
                <Badge className={statusColors[store.status]}>
                  {statusLabels[store.status]}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.open(`https://${store.domain}`, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Voir la boutique
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => syncStore(store.id)}
            disabled={store.status === 'syncing'}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${store.status === 'syncing' ? 'animate-spin' : ''}`} />
            Synchroniser
          </Button>
          <Button variant="outline" size="sm" asChild>
            <NavLink to={`/dashboard/stores/${storeId}/settings`}>
              <Settings className="h-4 w-4 mr-2" />
              Paramètres
            </NavLink>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Produits</p>
                <p className="text-2xl font-bold">{store.products_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Commandes</p>
                <p className="text-2xl font-bold">{store.orders_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Chiffre d'affaires</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(store.revenue, store.currency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Taux conversion</p>
                <p className="text-2xl font-bold">16.2%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="products">
            <Package className="h-4 w-4 mr-2" />
            Produits
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Commandes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <StoreAnalytics />
        </TabsContent>

        <TabsContent value="products">
          <StoreProducts />
        </TabsContent>

        <TabsContent value="orders">
          <StoreOrders />
        </TabsContent>
      </Tabs>
    </div>
  )
}