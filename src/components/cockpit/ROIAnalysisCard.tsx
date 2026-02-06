/**
 * Carte d'analyse ROI avec top/flop produits
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { CockpitROI } from '@/hooks/useCockpitData'

interface ROIAnalysisCardProps {
  roi: CockpitROI
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)
}

export function ROIAnalysisCard({ roi }: ROIAnalysisCardProps) {
  const profit = roi.totalRevenuePotential - roi.totalCost

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          Analyse ROI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Métriques financières */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-lg font-bold">{formatCurrency(roi.totalRevenuePotential)}</p>
            <p className="text-xs text-muted-foreground">Revenus potentiels</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-lg font-bold">{formatCurrency(roi.totalCost)}</p>
            <p className="text-xs text-muted-foreground">Coût total</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className={cn("text-lg font-bold", profit >= 0 ? "text-green-600" : "text-destructive")}>
              {formatCurrency(profit)}
            </p>
            <p className="text-xs text-muted-foreground">Profit estimé</p>
          </div>
        </div>

        {/* Marge moyenne */}
        <div className="flex items-center justify-between p-3 rounded-lg border">
          <span className="text-sm">Marge moyenne</span>
          <Badge variant={roi.averageMargin >= 30 ? 'default' : 'destructive'} className="gap-1">
            {roi.averageMargin >= 30 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {roi.averageMargin.toFixed(1)}%
          </Badge>
        </div>

        {/* Top produits */}
        {roi.bestMarginProducts.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              Top marges
            </p>
            <div className="space-y-1.5">
              {roi.bestMarginProducts.slice(0, 3).map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1 mr-2">{p.name}</span>
                  <Badge variant="outline" className="text-green-600 shrink-0">{p.profit_margin?.toFixed(0)}%</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Flop produits */}
        {roi.worstMarginProducts.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <ArrowDownRight className="h-3 w-3 text-destructive" />
              Marges les plus faibles
            </p>
            <div className="space-y-1.5">
              {roi.worstMarginProducts.slice(0, 3).map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1 mr-2">{p.name}</span>
                  <Badge variant="outline" className="text-destructive shrink-0">{p.profit_margin?.toFixed(0)}%</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
