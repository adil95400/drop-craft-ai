import { useState } from 'react';
import { useSupplierStock } from '@/hooks/useSupplierStock';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Package, RefreshCw, Search, TrendingDown, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface MultiSupplierStockManagerProps {
  supplierId: string;
}

export function MultiSupplierStockManager({ supplierId }: MultiSupplierStockManagerProps) {
  const { monitorStock, isMonitoring, lastMonitorResult } = useSupplierStock(supplierId);
  const [threshold, setThreshold] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const handleMonitor = () => {
    monitorStock(threshold);
  };

  const filteredOutOfStock = lastMonitorResult?.outOfStock.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredLowStock = lastMonitorResult?.lowStock.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Monitoring du stock multi-fournisseurs</CardTitle>
          <CardDescription>
            Surveillez les niveaux de stock et recevez des alertes automatiques
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Seuil d'alerte stock faible</Label>
              <Input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                placeholder="10"
              />
            </div>
            <Button
              onClick={handleMonitor}
              disabled={isMonitoring}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isMonitoring ? 'animate-spin' : ''}`} />
              {isMonitoring ? 'Analyse...' : 'Analyser le stock'}
            </Button>
          </div>

          {lastMonitorResult && (
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{lastMonitorResult.summary.totalChecked}</div>
                  <div className="text-sm text-muted-foreground">Produits vérifiés</div>
                </CardContent>
              </Card>

              <Card className="border-destructive/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <div className="text-2xl font-bold text-destructive">
                      {lastMonitorResult.summary.outOfStock}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">Ruptures de stock</div>
                </CardContent>
              </Card>

              <Card className="border-warning/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-warning" />
                    <div className="text-2xl font-bold text-warning">
                      {lastMonitorResult.summary.lowStock}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">Stock faible</div>
                </CardContent>
              </Card>

              <Card className="border-primary/50">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-primary">
                    {lastMonitorResult.summary.alertsCreated}
                  </div>
                  <div className="text-sm text-muted-foreground">Alertes créées</div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {lastMonitorResult && (lastMonitorResult.outOfStock.length > 0 || lastMonitorResult.lowStock.length > 0) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Alertes stock</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {filteredOutOfStock.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  Ruptures de stock ({filteredOutOfStock.length})
                </div>
                
                <div className="space-y-2">
                  {filteredOutOfStock.map((item, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <span>{item.name}</span>
                        <Badge variant="destructive">{item.sku}</Badge>
                      </AlertTitle>
                      <AlertDescription>
                        Stock: {item.stock} unités • Vérifié le {new Date(item.lastChecked).toLocaleString('fr-FR')}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {filteredLowStock.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <TrendingDown className="h-4 w-4 text-warning" />
                  Stock faible ({filteredLowStock.length})
                </div>
                
                <div className="space-y-2">
                  {filteredLowStock.map((item, index) => (
                    <Alert key={index} className="border-warning/50">
                      <Package className="h-4 w-4 text-warning" />
                      <AlertTitle className="flex items-center justify-between">
                        <span>{item.name}</span>
                        <div className="flex gap-2">
                          <Badge variant="outline">{item.sku}</Badge>
                          <Badge variant="secondary">
                            {item.stock}/{item.threshold}
                          </Badge>
                        </div>
                      </AlertTitle>
                      <AlertDescription>
                        Stock actuel: {item.stock} • Seuil: {item.threshold} • Vérifié le {new Date(item.lastChecked).toLocaleString('fr-FR')}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {lastMonitorResult.alternatives.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">
                  Fournisseurs alternatifs disponibles ({lastMonitorResult.alternatives.length})
                </div>
                
                <div className="space-y-2">
                  {lastMonitorResult.alternatives.map((alt, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="font-medium mb-2">{alt.name}</div>
                        <div className="flex gap-2 flex-wrap">
                          {alt.alternativeSuppliers.map((supplier, idx) => (
                            <Badge key={idx} variant="outline">
                              {supplier.supplierName}: {supplier.stock} unités à {supplier.price}€
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!lastMonitorResult && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Lancez une analyse pour surveiller les niveaux de stock</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
