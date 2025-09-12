import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Package, TrendingUp, RefreshCw, Settings, ExternalLink } from 'lucide-react'
import { useRealIntegrations, Integration } from '@/hooks/useRealIntegrations'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface ShopifyStoreCardProps {
  integration: Integration
  stats?: {
    products: number
    orders: number
    revenue: number
  }
}

export function ShopifyStoreCard({ integration, stats }: ShopifyStoreCardProps) {
  const { syncProducts, syncOrders, isSyncingProducts, isSyncingOrders } = useRealIntegrations()
  const { toast } = useToast()

  const handleSyncProducts = () => {
    syncProducts({ integrationId: integration.id })
  }

  const handleSyncOrders = () => {
    syncOrders({ integrationId: integration.id })
  }

  const handleFullSync = () => {
    syncProducts({ integrationId: integration.id })
    setTimeout(() => {
      syncOrders({ integrationId: integration.id })
    }, 2000)
    
    toast({
      title: "Synchronisation complète démarrée",
      description: "Synchronisation des produits et commandes en cours..."
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500'
      case 'disconnected': return 'bg-red-500'
      case 'error': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Jamais'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100">
              <span className="text-lg font-bold text-green-600">S</span>
            </div>
            <div>
              <CardTitle className="text-lg">Shopify</CardTitle>
              <p className="text-sm text-muted-foreground">
                {integration.shop_domain || 'Boutique connectée'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={`${getStatusColor(integration.connection_status)} text-white`}
            >
              {integration.connection_status === 'connected' ? 'Connecté' : 
               integration.connection_status === 'disconnected' ? 'Déconnecté' : 'Erreur'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Statistiques */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <Package className="w-5 h-5 mx-auto mb-1 text-blue-500" />
            <div className="text-2xl font-bold">{stats?.products || 0}</div>
            <div className="text-xs text-muted-foreground">Produits</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <ShoppingCart className="w-5 h-5 mx-auto mb-1 text-green-500" />
            <div className="text-2xl font-bold">{stats?.orders || 0}</div>
            <div className="text-xs text-muted-foreground">Commandes</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-purple-500" />
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.revenue || 0)}
            </div>
            <div className="text-xs text-muted-foreground">CA</div>
          </div>
        </div>

        {/* Dernière synchronisation */}
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">Dernière sync:</span> {formatDate(integration.last_sync_at)}
        </div>

        {/* Actions de synchronisation */}
        <div className="space-y-2">
          <Button 
            onClick={handleFullSync}
            className="w-full"
            disabled={isSyncingProducts || isSyncingOrders}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${(isSyncingProducts || isSyncingOrders) ? 'animate-spin' : ''}`} />
            Synchronisation complète
          </Button>
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSyncProducts}
              disabled={isSyncingProducts}
            >
              <Package className="w-4 h-4 mr-1" />
              {isSyncingProducts ? 'Sync...' : 'Produits'}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSyncOrders}
              disabled={isSyncingOrders}
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
              {isSyncingOrders ? 'Sync...' : 'Commandes'}
            </Button>
          </div>
        </div>

        {/* Liens utiles */}
        <div className="flex gap-2 pt-2 border-t">
          {integration.shop_domain && (
            <Button 
              variant="ghost" 
              size="sm"
              asChild
            >
              <a 
                href={`https://${integration.shop_domain}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Voir boutique
              </a>
            </Button>
          )}
          <Button variant="ghost" size="sm">
            <Settings className="w-3 h-3 mr-1" />
            Paramètres
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}