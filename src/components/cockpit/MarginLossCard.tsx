/**
 * Margin Loss Detection Card - Products losing money or with dangerously low margins
 */
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TrendingDown, ArrowRight, AlertTriangle, ImageOff } from 'lucide-react'
import { UnifiedProduct } from '@/hooks/unified/useProductsUnified'

interface MarginLossCardProps {
  products: UnifiedProduct[]
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(v)
}

export function MarginLossCard({ products }: MarginLossCardProps) {
  const navigate = useNavigate()

  // Products with negative or dangerously low margins
  const atRisk = products
    .filter(p => p.cost_price && p.cost_price > 0 && p.price > 0)
    .map(p => {
      const margin = ((p.price - (p.cost_price || 0)) / p.price) * 100
      const loss = p.cost_price! - p.price
      return { ...p, calculatedMargin: margin, loss }
    })
    .filter(p => p.calculatedMargin < 15)
    .sort((a, b) => a.calculatedMargin - b.calculatedMargin)
    .slice(0, 8)

  const negativeCount = atRisk.filter(p => p.calculatedMargin < 0).length
  const lowCount = atRisk.filter(p => p.calculatedMargin >= 0 && p.calculatedMargin < 15).length
  const totalLoss = atRisk
    .filter(p => p.calculatedMargin < 0)
    .reduce((sum, p) => sum + (p.loss * (p.stock_quantity || 1)), 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-destructive" />
            Pertes de marge
            {atRisk.length > 0 && (
              <Badge variant="destructive" className="text-xs">{atRisk.length}</Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate('/products/scoring')}>
            Scoring <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded bg-destructive/10">
            <p className="text-lg font-bold text-destructive">{negativeCount}</p>
            <p className="text-[10px] text-muted-foreground">Perte nette</p>
          </div>
          <div className="p-2 rounded bg-yellow-500/10">
            <p className="text-lg font-bold text-yellow-600">{lowCount}</p>
            <p className="text-[10px] text-muted-foreground">Marge &lt;15%</p>
          </div>
          <div className="p-2 rounded bg-muted">
            <p className={cn("text-lg font-bold", totalLoss > 0 ? "text-destructive" : "text-muted-foreground")}>
              {totalLoss > 0 ? formatCurrency(totalLoss) : '0 €'}
            </p>
            <p className="text-[10px] text-muted-foreground">Perte stock</p>
          </div>
        </div>

        {/* Product list */}
        {atRisk.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <AlertTriangle className="h-6 w-6 mx-auto mb-1.5 opacity-40" />
            <p className="text-sm">Toutes les marges sont saines !</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
            {atRisk.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-2 p-2 rounded border hover:border-primary/30 cursor-pointer transition-all"
                onClick={() => navigate(`/products/${p.id}`)}
              >
                <div className="h-7 w-7 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImageOff className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
                <span className="text-sm truncate flex-1">{p.name}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-muted-foreground">{formatCurrency(p.price)}</span>
                  <Badge variant="outline" className={cn(
                    "text-[10px]",
                    p.calculatedMargin < 0 ? "text-destructive border-destructive/30" : "text-yellow-600 border-yellow-500/30"
                  )}>
                    {p.calculatedMargin.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
