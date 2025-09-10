import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MoreHorizontal, 
  RefreshCw, 
  Settings, 
  TrendingUp, 
  Package, 
  ShoppingCart,
  ExternalLink
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Store } from '@/hooks/useStores'
import { Link } from 'react-router-dom'

interface StoreCardProps {
  store: Store
  onSync: (storeId: string) => void
  onDisconnect: (storeId: string) => void
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

export function StoreCard({ store, onSync, onDisconnect }: StoreCardProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais'
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  return (
    <Card className="hover:shadow-card transition-smooth">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
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
            <CardTitle className="text-lg">{store.name}</CardTitle>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {store.platform}
              </Badge>
              <Badge className={statusColors[store.status]}>
                {statusLabels[store.status]}
              </Badge>
            </div>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onSync(store.id)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Synchroniser
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/dashboard/stores/${store.id}/settings`}>
                <Settings className="mr-2 h-4 w-4" />
                Paramètres
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => window.open(`https://${store.domain}`, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Voir la boutique
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDisconnect(store.id)}
              className="text-destructive"
            >
              Déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Package className="h-4 w-4 text-muted-foreground mr-1" />
            </div>
            <div className="text-2xl font-bold text-foreground">{store.products_count}</div>
            <div className="text-sm text-muted-foreground">Produits</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <ShoppingCart className="h-4 w-4 text-muted-foreground mr-1" />
            </div>
            <div className="text-2xl font-bold text-foreground">{store.orders_count}</div>
            <div className="text-sm text-muted-foreground">Commandes</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground mr-1" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(store.revenue, store.currency)}
            </div>
            <div className="text-sm text-muted-foreground">CA</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <span>Dernière sync: {formatDate(store.last_sync)}</span>
        </div>
        
        <div className="flex gap-2">
          <Button asChild size="sm" className="flex-1">
            <Link to={`/dashboard/stores/${store.id}`}>
              Gérer
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onSync(store.id)}
            disabled={store.status === 'syncing'}
          >
            <RefreshCw className={`h-4 w-4 ${store.status === 'syncing' ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}