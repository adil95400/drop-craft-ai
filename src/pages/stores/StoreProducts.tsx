import { Card, CardContent } from '@/components/ui/card'
import { Package, AlertTriangle, TrendingUp, ShoppingBag } from 'lucide-react'
import { ProductsTable } from '@/components/stores/products/ProductsTable'
import { useProductsUnified } from '@/hooks/unified'

export function StoreProducts() {
  const { stats, isLoading } = useProductsUnified()

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
          <h2 className="text-2xl font-bold">Produits</h2>
          <p className="text-muted-foreground">Gérez vos produits synchronisés</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-6 w-6 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.active}</div>
            <div className="text-sm text-muted-foreground">Produits actifs</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-6 w-6 text-warning mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.lowStock}</div>
            <div className="text-sm text-muted-foreground">Stock faible</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <ShoppingBag className="h-6 w-6 text-success mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total produits</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 text-info mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.totalValue.toFixed(0)}€</div>
            <div className="text-sm text-muted-foreground">Valeur stock</div>
          </CardContent>
        </Card>
      </div>

      <ProductsTable />
    </div>
  )
}