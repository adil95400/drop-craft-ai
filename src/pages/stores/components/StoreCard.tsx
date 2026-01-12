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
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Store } from '@/hooks/useStores'
import { Link } from 'react-router-dom'
import { getPlatformLogo, platformColors, platformNames } from '@/utils/platformLogos'

interface StoreCardProps {
  store: Store
  onSync: (storeId: string) => void
  onDisconnect: (storeId: string) => void
}

const statusConfig = {
  connected: { 
    color: 'bg-success text-success-foreground', 
    label: 'Connectée', 
    icon: CheckCircle 
  },
  disconnected: { 
    color: 'bg-muted text-muted-foreground', 
    label: 'Déconnectée', 
    icon: XCircle 
  },
  syncing: { 
    color: 'bg-warning text-warning-foreground', 
    label: 'Synchronisation...', 
    icon: Clock 
  },
  error: { 
    color: 'bg-destructive text-destructive-foreground', 
    label: 'Erreur', 
    icon: AlertTriangle 
  }
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

  const StatusIcon = statusConfig[store.status].icon
  const platformLogo = getPlatformLogo(store.platform)

  return (
    <Card className="hover:shadow-elegant transition-smooth group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center space-x-3">
          {platformLogo ? (
            <div className="w-12 h-12 rounded-lg bg-card border overflow-hidden flex items-center justify-center p-1">
              <img 
                src={platformLogo} 
                alt={platformNames[store.platform]}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className={`w-12 h-12 rounded-lg ${platformColors[store.platform]} flex items-center justify-center font-semibold text-lg`}>
              {store.name.charAt(0)}
            </div>
          )}
          <div>
            <CardTitle className="text-lg group-hover:text-primary transition-colors">
              {store.name}
            </CardTitle>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {platformNames[store.platform]}
              </Badge>
              <Badge className={`${statusConfig[store.status].color} flex items-center gap-1`}>
                <StatusIcon className="w-3 h-3" />
                {statusConfig[store.status].label}
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
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem 
              onClick={() => onSync(store.id)}
              disabled={store.status === 'syncing'}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${store.status === 'syncing' ? 'animate-spin' : ''}`} />
              Synchroniser maintenant
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/stores-channels/${store.id}`}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Tableau de bord
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to={`/stores-channels/${store.id}/settings`}>
                <Settings className="mr-2 h-4 w-4" />
                Paramètres avancés
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => window.open(`https://${store.domain}`, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Voir la boutique
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDisconnect(store.id)}
              className="text-destructive focus:text-destructive"
            >
              <XCircle className="mr-2 h-4 w-4" />
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
          {store.settings?.auto_sync && (
            <Badge variant="secondary" className="text-xs">
              Auto {store.settings.sync_frequency}
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button asChild size="sm" className="flex-1">
            <Link to={`/stores-channels/${store.id}`}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onSync(store.id)}
            disabled={store.status === 'syncing'}
            className="px-3"
          >
            <RefreshCw className={`h-4 w-4 ${store.status === 'syncing' ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}