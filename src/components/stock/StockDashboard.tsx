import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useStockManagement } from '@/hooks/useStockManagement'
import { StockPredictions } from './StockPredictions'
import { StockAlerts } from './StockAlerts'
import { AutoReorderManager } from './AutoReorderManager'
import { StockAnalytics } from './StockAnalytics'
import { 
  Package, 
  Warehouse, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp,
  Activity,
  DollarSign,
  RefreshCw,
  Brain,
  Zap,
  BarChart3
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export const StockDashboard = () => {
  const { 
    stockStats, 
    activeAlerts, 
    stockLevels, 
    warehouses,
    isLoading 
  } = useStockManagement()

  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical')
  const highAlerts = activeAlerts.filter(a => a.severity === 'high')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion du Stock</h1>
          <p className="text-muted-foreground mt-2">
            Prédictions ML, alertes temps réel et optimisation multi-entrepôts
          </p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* KPIs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Produits
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockStats.total_products}</div>
            <p className="text-xs text-muted-foreground">
              Dans {stockStats.total_warehouses} entrepôts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valeur du Stock
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stockStats.total_stock_value)}
            </div>
            <p className="text-xs text-muted-foreground">
              Coût total estimé
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Stock Faible
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {stockStats.low_stock_items}
            </div>
            <p className="text-xs text-muted-foreground">
              Articles sous le seuil
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alertes Actives
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {stockStats.active_alerts}
            </div>
            <p className="text-xs text-muted-foreground">
              {criticalAlerts.length} critiques, {highAlerts.length} élevées
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {criticalAlerts.length} Alerte{criticalAlerts.length > 1 ? 's' : ''} Critique{criticalAlerts.length > 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {criticalAlerts.slice(0, 3).map(alert => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{alert.product?.name || 'Produit'}</p>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                </div>
                <Badge variant="destructive">{alert.alert_type}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="alerts">
            Alertes
            {activeAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {activeAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reorder">
            <Zap className="h-4 w-4 mr-2" />
            Réappro Auto
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="levels">Niveaux de Stock</TabsTrigger>
          <TabsTrigger value="predictions">
            <Brain className="h-4 w-4 mr-2" />
            Prédictions ML
          </TabsTrigger>
          <TabsTrigger value="movements">Mouvements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Entrepôts Actifs</CardTitle>
                <CardDescription>
                  {warehouses.length} entrepôts configurés
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {warehouses.slice(0, 5).map(warehouse => (
                  <div key={warehouse.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Warehouse className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{warehouse.name}</p>
                        <p className="text-sm text-muted-foreground">{warehouse.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {warehouse.current_utilization}/{warehouse.capacity}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round((warehouse.current_utilization / warehouse.capacity) * 100)}% utilisé
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Produits à Réapprovisionner</CardTitle>
                <CardDescription>
                  Articles atteignant le seuil de réapprovisionnement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {stockLevels
                  .filter(level => level.available_quantity <= level.reorder_point && level.available_quantity > 0)
                  .slice(0, 5)
                  .map(level => (
                    <div key={level.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{level.product?.name || 'Produit'}</p>
                        <p className="text-sm text-muted-foreground">
                          {level.warehouse?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-orange-500">
                          {level.available_quantity} restant{level.available_quantity > 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Seuil: {level.reorder_point}
                        </p>
                      </div>
                    </div>
                  ))}
                {stockLevels.filter(level => level.available_quantity <= level.reorder_point).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun produit à réapprovisionner
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <StockAlerts />
        </TabsContent>

        <TabsContent value="reorder">
          <AutoReorderManager />
        </TabsContent>

        <TabsContent value="analytics">
          <StockAnalytics />
        </TabsContent>

        <TabsContent value="levels">
          <Card>
            <CardHeader>
              <CardTitle>Niveaux de Stock</CardTitle>
              <CardDescription>
                Vue détaillée de tous les niveaux de stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stockLevels.map(level => (
                  <div key={level.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {level.product?.image_url && (
                        <img 
                          src={level.product.image_url} 
                          alt={level.product.name}
                          className="h-12 w-12 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium">{level.product?.name || 'Produit'}</p>
                        <p className="text-sm text-muted-foreground">
                          {level.product?.sku} • {level.warehouse?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {level.available_quantity} disponible{level.available_quantity > 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {level.reserved_quantity} réservé{level.reserved_quantity > 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="w-32">
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              level.available_quantity === 0 ? 'bg-red-500' :
                              level.available_quantity <= level.reorder_point ? 'bg-orange-500' :
                              level.available_quantity >= level.max_stock_level ? 'bg-blue-500' :
                              'bg-green-500'
                            }`}
                            style={{ 
                              width: `${Math.min((level.available_quantity / level.max_stock_level) * 100, 100)}%` 
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {Math.round((level.available_quantity / level.max_stock_level) * 100)}% de capacité
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {stockLevels.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun niveau de stock configuré
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions">
          {stockLevels.length > 0 && warehouses.length > 0 ? (
            <StockPredictions 
              productId={stockLevels[0]?.product_id || ''}
              warehouseId={warehouses[0]?.id || ''}
              currentStock={stockLevels[0]?.available_quantity || 0}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Prédictions ML</CardTitle>
                <CardDescription>
                  Prévisions de rupture de stock basées sur l'IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">
                  Aucun produit disponible pour les prédictions. Ajoutez des produits et des entrepôts pour commencer.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Mouvements</CardTitle>
              <CardDescription>
                Tous les mouvements de stock récents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Aucun mouvement récent
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
