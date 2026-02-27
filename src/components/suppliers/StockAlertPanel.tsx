import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, TrendingDown, Package, RefreshCw } from 'lucide-react'
import { useSupplierStock, type StockMonitorResult } from '@/hooks/useSupplierStock'

interface StockAlertPanelProps {
  supplierId: string
  monitorResult?: StockMonitorResult
}

export function StockAlertPanel({ supplierId, monitorResult }: StockAlertPanelProps) {
  const { monitorStock, isMonitoring } = useSupplierStock(supplierId)

  if (!monitorResult) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Monitoring du Stock</h3>
          <Button
            onClick={() => monitorStock(10)}
            disabled={isMonitoring}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isMonitoring ? 'animate-spin' : ''}`} />
            Vérifier
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Lancez un monitoring pour détecter les ruptures et alertes de stock
        </p>
      </Card>
    )
  }

  const { summary, outOfStock, lowStock, alternatives } = monitorResult

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Produits vérifiés</span>
          </div>
          <div className="text-2xl font-bold">{summary.totalChecked}</div>
        </Card>

        <Card className="p-4 border-destructive">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-muted-foreground">Ruptures</span>
          </div>
          <div className="text-2xl font-bold text-destructive">{summary.outOfStock}</div>
        </Card>

        <Card className="p-4 border-warning">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-4 w-4 text-warning" />
            <span className="text-sm text-muted-foreground">Stock faible</span>
          </div>
          <div className="text-2xl font-bold text-warning">{summary.lowStock}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Alertes créées</span>
          </div>
          <div className="text-2xl font-bold">{summary.alertsCreated}</div>
        </Card>
      </div>

      {/* Out of Stock */}
      {outOfStock.length > 0 && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Ruptures de Stock ({outOfStock.length})
          </h4>
          <div className="space-y-2">
            {outOfStock.map((item) => (
              <div
                key={item.sku}
                className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg"
              >
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">SKU: {item.sku}</div>
                </div>
                <Badge variant="destructive">Stock: 0</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Low Stock */}
      {lowStock.length > 0 && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-warning" />
            Stock Faible ({lowStock.length})
          </h4>
          <div className="space-y-2">
            {lowStock.map((item) => (
              <div
                key={item.sku}
                className="flex items-center justify-between p-3 bg-warning/10 rounded-lg"
              >
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">SKU: {item.sku}</div>
                </div>
                <Badge variant="outline" className="border-warning text-warning">
                  Stock: {item.stock}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4">
            Fournisseurs Alternatifs ({alternatives.length})
          </h4>
          <div className="space-y-4">
            {alternatives.map((item) => (
              <div key={item.sku} className="border rounded-lg p-4">
                <div className="font-medium mb-2">{item.name}</div>
                <div className="text-sm text-muted-foreground mb-3">SKU: {item.sku}</div>
                <div className="space-y-2">
                  {item.alternativeSuppliers.map((supplier) => (
                    <div
                      key={supplier.supplierId}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{supplier.supplierName}</span>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">Stock: {supplier.stock}</Badge>
                        <span className="font-medium">{supplier.price}€</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
