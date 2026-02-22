/**
 * Top Products Card - Best performers by revenue potential and margin
 */
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Crown, ArrowRight, ImageOff, TrendingUp } from 'lucide-react'
import { UnifiedProduct } from '@/hooks/unified/useProductsUnified'

interface TopProductsCardProps {
  products: UnifiedProduct[]
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)
}

export function TopProductsCard({ products }: TopProductsCardProps) {
  const navigate = useNavigate()

  // Rank by revenue potential (price * stock)
  const topByRevenue = [...products]
    .filter(p => p.price > 0 && (p.stock_quantity || 0) > 0)
    .sort((a, b) => (b.price * (b.stock_quantity || 0)) - (a.price * (a.stock_quantity || 0)))
    .slice(0, 5)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Crown className="h-4 w-4 text-yellow-500" />
            Top Produits
          </CardTitle>
          <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate('/products')}>
            Catalogue <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {topByRevenue.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Crown className="h-6 w-6 mx-auto mb-1.5 opacity-40" />
            <p className="text-sm">Aucun produit en stock</p>
          </div>
        ) : (
          <div className="space-y-2">
            {topByRevenue.map((p, i) => {
              const revenue = p.price * (p.stock_quantity || 0)
              const margin = p.profit_margin

              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-2 rounded-lg border hover:border-primary/30 hover:bg-muted/30 cursor-pointer transition-all"
                  onClick={() => navigate('/import/preview', {
                    state: {
                      product: {
                        title: p.name || p.title,
                        description: p.description || '',
                        price: p.price || 0,
                        images: p.image_url ? [p.image_url] : [],
                        category: p.category || '',
                        sku: p.sku || '',
                      },
                      returnTo: '/cockpit',
                    }
                  })}
                >
                  <span className={cn(
                    "text-sm font-bold w-5 text-center shrink-0",
                    i === 0 && "text-yellow-500",
                    i === 1 && "text-muted-foreground",
                    i === 2 && "text-orange-400",
                    i > 2 && "text-muted-foreground/60"
                  )}>
                    {i + 1}
                  </span>
                  <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageOff className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(p.price)} × {p.stock_quantity}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">{formatCurrency(revenue)}</p>
                    {margin != null && (
                      <Badge variant="outline" className={cn(
                        "text-[10px]",
                        margin >= 30 ? "text-green-600" : margin >= 15 ? "text-yellow-600" : "text-destructive"
                      )}>
                        <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                        {margin.toFixed(0)}%
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
