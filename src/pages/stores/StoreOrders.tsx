import { Card, CardContent } from '@/components/ui/card'
import { ShoppingCart, CheckCircle, Package, DollarSign, Clock } from 'lucide-react'
import { OrdersTable } from '@/components/stores/orders/OrdersTable'
import { useOrdersUnified } from '@/hooks/unified'

export function StoreOrders() {
  const { stats, isLoading } = useOrdersUnified()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
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
          <h2 className="text-2xl font-bold">Commandes</h2>
          <p className="text-muted-foreground">Historique et gestion des commandes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <ShoppingCart className="h-6 w-6 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Commandes totales</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 text-success mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.delivered}</div>
            <div className="text-sm text-muted-foreground">Livrées</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 text-warning mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.processing + stats.shipped}</div>
            <div className="text-sm text-muted-foreground">En cours</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-6 w-6 text-info mx-auto mb-2" />
            <div className="text-2xl font-bold">{formatCurrency(stats.avgOrderValue)}</div>
            <div className="text-sm text-muted-foreground">Panier moyen</div>
          </CardContent>
        </Card>
      </div>

      <OrdersTable />
    </div>
  )
}