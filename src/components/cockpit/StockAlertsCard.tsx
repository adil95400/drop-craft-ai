/**
 * Carte des alertes de stock critiques
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AlertTriangle, PackageX, Clock, ArrowRight } from 'lucide-react'
import { StockAlert } from '@/hooks/useStockPredictions'
import { useNavigate } from 'react-router-dom'

interface StockAlertsCardProps {
  alerts: StockAlert[]
  stats: { criticalCount: number; highCount: number; avgDaysToStockout: number }
}

const urgencyConfig = {
  critical: { label: 'Critique', color: 'bg-destructive/10 text-destructive border-destructive/20' },
  high: { label: 'Élevée', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  medium: { label: 'Moyenne', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  low: { label: 'Faible', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
}

export function StockAlertsCard({ alerts, stats }: StockAlertsCardProps) {
  const navigate = useNavigate()

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <PackageX className="h-4 w-4 text-destructive" />
            Alertes stock
            {alerts.length > 0 && (
              <Badge variant="destructive" className="text-xs">{alerts.length}</Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate('/stock/price-monitor')}>
            Moniteur <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded bg-destructive/10">
            <p className="text-lg font-bold text-destructive">{stats.criticalCount}</p>
            <p className="text-[10px] text-muted-foreground">Critiques</p>
          </div>
          <div className="p-2 rounded bg-orange-500/10">
            <p className="text-lg font-bold text-orange-600">{stats.highCount}</p>
            <p className="text-[10px] text-muted-foreground">Élevées</p>
          </div>
          <div className="p-2 rounded bg-muted">
            <p className="text-lg font-bold">{stats.avgDaysToStockout}j</p>
            <p className="text-[10px] text-muted-foreground">Moy. rupture</p>
          </div>
        </div>

        {/* Liste des alertes */}
        {alerts.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <AlertTriangle className="h-6 w-6 mx-auto mb-1.5 opacity-40" />
            <p className="text-sm">Aucune alerte de stock</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
            {alerts.slice(0, 8).map((alert, i) => {
              const config = urgencyConfig[alert.urgency]
              return (
                <div key={i} className="flex items-center justify-between text-sm p-2 rounded border">
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{alert.productId.slice(0, 8)}...</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">{alert.daysUntilStockout}j</span>
                    <Badge variant="outline" className={cn("text-[10px]", config.color)}>{config.label}</Badge>
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
