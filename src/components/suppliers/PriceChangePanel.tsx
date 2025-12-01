import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, DollarSign, RefreshCw } from 'lucide-react'
import { usePriceMonitor, type PriceMonitorResult } from '@/hooks/usePriceMonitor'

interface PriceChangePanelProps {
  supplierId: string
  monitorResult?: PriceMonitorResult
}

export function PriceChangePanel({ supplierId, monitorResult }: PriceChangePanelProps) {
  const { monitorPrices, isMonitoring } = usePriceMonitor(supplierId)

  if (!monitorResult) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Monitoring des Prix</h3>
          <Button
            onClick={() => monitorPrices(5)}
            disabled={isMonitoring}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isMonitoring ? 'animate-spin' : ''}`} />
            Vérifier
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Lancez un monitoring pour détecter les changements de prix
        </p>
      </Card>
    )
  }

  const { summary, significantChanges } = monitorResult

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Produits suivis</span>
          </div>
          <div className="text-2xl font-bold">{summary.totalProducts}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Changements</span>
          </div>
          <div className="text-2xl font-bold">{summary.priceChanges}</div>
        </Card>

        <Card className="p-4 border-primary">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Significatifs</span>
          </div>
          <div className="text-2xl font-bold text-primary">{summary.significantChanges}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Variation moy.</span>
          </div>
          <div className="text-2xl font-bold">
            {summary.averageChange > 0 ? '+' : ''}
            {summary.averageChange.toFixed(1)}%
          </div>
        </Card>
      </div>

      {/* Significant Changes */}
      {significantChanges.length > 0 && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4">
            Changements Significatifs ({significantChanges.length})
          </h4>
          <div className="space-y-3">
            {significantChanges.map((change) => (
              <div
                key={change.productId}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">{change.name}</div>
                  <div className="text-sm text-muted-foreground">SKU: {change.sku}</div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground line-through">
                      {change.oldPrice.toFixed(2)}€
                    </div>
                    <div className="font-bold">{change.newPrice.toFixed(2)}€</div>
                  </div>
                  
                  <Badge
                    variant={change.changeType === 'increase' ? 'destructive' : 'default'}
                    className="flex items-center gap-1"
                  >
                    {change.changeType === 'increase' ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {change.changeType === 'increase' ? '+' : '-'}
                    {change.changePercent.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
