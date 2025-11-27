import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DollarSign, TrendingDown, Zap, Package } from "lucide-react"

interface SupplierComparison {
  supplierId: string
  supplierName: string
  price: number
  stock: number
  shippingTime: number
  currency?: string
  isBestPrice?: boolean
  isFastest?: boolean
}

interface MultiSupplierComparisonProps {
  comparisons: SupplierComparison[]
  isLoading?: boolean
}

export const MultiSupplierComparison = ({ 
  comparisons, 
  isLoading = false 
}: MultiSupplierComparisonProps) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  if (!comparisons || comparisons.length === 0) {
    return (
      <Card className="p-4 text-center">
        <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Aucun fournisseur disponible
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold">Comparaison Multi-Fournisseurs</h4>
        <span className="text-xs text-muted-foreground">
          {comparisons.length} fournisseur{comparisons.length > 1 ? 's' : ''}
        </span>
      </div>

      {comparisons.map((supplier) => (
        <Card 
          key={supplier.supplierId}
          className={`p-3 transition-all ${
            supplier.isBestPrice 
              ? 'border-primary/50 bg-primary/5' 
              : 'border-border/50'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-sm">
                  {supplier.supplierName}
                </span>
                {supplier.isBestPrice && (
                  <Badge variant="default" className="text-xs gap-1">
                    <TrendingDown className="h-3 w-3" />
                    Meilleur Prix
                  </Badge>
                )}
                {supplier.isFastest && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Zap className="h-3 w-3" />
                    Plus Rapide
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-semibold text-foreground">
                    {supplier.price.toFixed(2)} {supplier.currency || '€'}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Stock: {supplier.stock}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {supplier.shippingTime}j
                  </span>
                </div>
              </div>
            </div>

            {supplier.stock > 0 ? (
              <Badge variant="outline" className="text-xs">
                Disponible
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">
                Rupture
              </Badge>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
