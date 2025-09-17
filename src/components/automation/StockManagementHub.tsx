import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { 
  Package, AlertTriangle, TrendingDown, RefreshCw, Users, 
  Clock, CheckCircle, BarChart3, Target, ArrowUp, ArrowDown,
  Plus, Settings, Eye, Truck, DollarSign, Calendar
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { stockManagementService, type StockAlert, type BackupSupplier, type StockMovement } from '@/services/StockManagementService'

export function StockManagementHub() {
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [stats, setStats] = useState({
    total_products: 0,
    low_stock_products: 0,
    out_of_stock_products: 0,
    auto_reorders_active: 0,
    reorders_this_month: 0,
    stock_value: 0,
    top_moving_products: []
  })
  const [loading, setLoading] = useState(true)
  const [urgencyFilter, setUrgencyFilter] = useState<string>('')
  const [showReorderDialog, setShowReorderDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<StockAlert | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadStockData()
  }, [urgencyFilter])

  const loadStockData = async () => {
    try {
      setLoading(true)
      const [alertsData, movementsData, statsData] = await Promise.all([
        stockManagementService.getStockAlerts(urgencyFilter),
        stockManagementService.getStockMovements(),
        stockManagementService.getStockDashboardStats()
      ])

      setAlerts(alertsData)
      setMovements(movementsData)
      setStats(statsData)
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de stock",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAutoReorder = async (productId: string) => {
    try {
      await stockManagementService.executeAutoReorder(productId)
      toast({
        title: "Commande automatique lancée",
        description: "La commande de réapprovisionnement a été créée"
      })
      await loadStockData()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de lancer la commande automatique",
        variant: "destructive"
      })
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-100 border-green-200'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in': return <ArrowUp className="h-4 w-4 text-green-600" />
      case 'out': return <ArrowDown className="h-4 w-4 text-red-600" />
      case 'adjustment': return <Settings className="h-4 w-4 text-blue-600" />
      case 'reserved': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'returned': return <RefreshCw className="h-4 w-4 text-purple-600" />
      default: return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Gestion Intelligente des Stocks</h2>
          <p className="text-muted-foreground">
            Automatisation complète et fournisseurs de backup
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrer par urgence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Toutes urgences</SelectItem>
              <SelectItem value="critical">Critique</SelectItem>
              <SelectItem value="high">Élevée</SelectItem>
              <SelectItem value="medium">Moyenne</SelectItem>
              <SelectItem value="low">Faible</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadStockData} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Produits Total</p>
                <p className="text-2xl font-bold">{stats.total_products}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Stock Faible</p>
                <p className="text-2xl font-bold">{stats.low_stock_products}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Rupture Stock</p>
                <p className="text-2xl font-bold">{stats.out_of_stock_products}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Auto-Commandes</p>
                <p className="text-2xl font-bold">{stats.auto_reorders_active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Commandes Mois</p>
                <p className="text-2xl font-bold">{stats.reorders_this_month}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-emerald-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Valeur Stock</p>
                <p className="text-2xl font-bold">{stats.stock_value.toLocaleString()}€</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="alerts">Alertes Stock</TabsTrigger>
          <TabsTrigger value="movements">Mouvements</TabsTrigger>
          <TabsTrigger value="reorders">Auto-Commandes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {alerts.map((alert) => (
              <StockAlertCard 
                key={alert.id}
                alert={alert}
                onReorder={() => {
                  setSelectedProduct(alert)
                  setShowReorderDialog(true)
                }}
                onAutoReorder={() => handleAutoReorder(alert.product_id)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mouvements de Stock Récents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {movements.slice(0, 15).map((movement) => (
                  <StockMovementRow key={movement.id} movement={movement} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reorders" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Règles de Réapprovisionnement</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Configuration des règles automatiques à venir
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fournisseurs de Backup</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Gestion des fournisseurs alternatifs à venir
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Produits les Plus Actifs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.top_moving_products.slice(0, 5).map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Vélocité: {product.velocity} unités/jour
                        </p>
                      </div>
                      <Badge variant="outline">#{index + 1}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prédictions de Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Algorithmes de prédiction IA à venir
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Reorder Dialog */}
      <Dialog open={showReorderDialog} onOpenChange={setShowReorderDialog}>
        <DialogContent className="max-w-2xl">
          {selectedProduct && (
            <ReorderDialog 
              product={selectedProduct}
              onSuccess={() => {
                setShowReorderDialog(false)
                loadStockData()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StockAlertCard({ 
  alert, 
  onReorder, 
  onAutoReorder 
}: { 
  alert: StockAlert
  onReorder: () => void
  onAutoReorder: () => void
}) {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-100 border-green-200'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const stockPercentage = (alert.current_stock / alert.reorder_point) * 100
  const daysUntilStockout = Math.max(0, Math.ceil(
    (new Date(alert.estimated_stockout_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ))

  return (
    <Card className={`border-l-4 ${alert.urgency === 'critical' ? 'border-l-red-500' : alert.urgency === 'high' ? 'border-l-orange-500' : 'border-l-yellow-500'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{alert.product_name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Stock actuel: {alert.current_stock} unités
            </p>
          </div>
          <Badge className={getUrgencyColor(alert.urgency)}>
            {alert.urgency === 'critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
            {alert.urgency.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stock Level */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Niveau de stock</span>
            <span>{alert.current_stock}/{alert.reorder_point}</span>
          </div>
          <Progress 
            value={Math.min(stockPercentage, 100)} 
            className={`h-2 ${stockPercentage < 50 ? '[&>div]:bg-red-500' : stockPercentage < 80 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'}`}
          />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Seuil minimum</p>
            <p className="font-bold">{alert.minimum_threshold}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Rupture dans</p>
            <p className="font-bold">{daysUntilStockout} jours</p>
          </div>
          <div>
            <p className="text-muted-foreground">Qté recommandée</p>
            <p className="font-bold">{alert.recommended_order_quantity}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Fournisseur principal</p>
            <p className="font-bold">{alert.supplier_name || 'Non défini'}</p>
          </div>
        </div>

        {/* Backup Suppliers */}
        {alert.backup_suppliers.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Fournisseurs de backup ({alert.backup_suppliers.length})</p>
            <div className="flex flex-wrap gap-1">
              {alert.backup_suppliers.slice(0, 3).map((supplier, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {supplier.name} - {supplier.price}€
                </Badge>
              ))}
              {alert.backup_suppliers.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{alert.backup_suppliers.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          <Button 
            size="sm" 
            onClick={onReorder}
            className="flex-1"
          >
            <Package className="h-4 w-4 mr-1" />
            Commander
          </Button>
          {alert.auto_reorder_enabled && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={onAutoReorder}
            >
              <Target className="h-4 w-4 mr-1" />
              Auto
            </Button>
          )}
          <Button size="sm" variant="outline">
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function StockMovementRow({ movement }: { movement: StockMovement }) {
  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in': return <ArrowUp className="h-4 w-4 text-green-600" />
      case 'out': return <ArrowDown className="h-4 w-4 text-red-600" />
      case 'adjustment': return <Settings className="h-4 w-4 text-blue-600" />
      case 'reserved': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'returned': return <RefreshCw className="h-4 w-4 text-purple-600" />
      default: return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center space-x-3">
        {getMovementIcon(movement.movement_type)}
        <div>
          <p className="font-medium">Produit #{movement.product_id.slice(0, 8)}</p>
          <p className="text-sm text-muted-foreground">{movement.reason}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold ${movement.movement_type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
          {movement.movement_type === 'in' ? '+' : '-'}{movement.quantity}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(movement.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}

function ReorderDialog({ 
  product, 
  onSuccess 
}: { 
  product: StockAlert
  onSuccess: () => void 
}) {
  const [quantity, setQuantity] = useState(product.recommended_order_quantity)
  const [selectedSupplier, setSelectedSupplier] = useState(product.supplier_id || '')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleReorder = async () => {
    try {
      setLoading(true)
      await stockManagementService.executeAutoReorder(product.product_id, true)
      toast({
        title: "Commande créée",
        description: "La commande de réapprovisionnement a été créée"
      })
      onSuccess()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Commande de Réapprovisionnement</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <Label>Produit</Label>
          <p className="font-medium">{product.product_name}</p>
          <p className="text-sm text-muted-foreground">Stock actuel: {product.current_stock}</p>
        </div>

        <div>
          <Label htmlFor="quantity">Quantité à commander</Label>
          <Input
            id="quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            min="1"
          />
        </div>

        <div>
          <Label htmlFor="supplier">Fournisseur</Label>
          <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un fournisseur" />
            </SelectTrigger>
            <SelectContent>
              {product.supplier_name && (
                <SelectItem value={product.supplier_id || ''}>
                  {product.supplier_name} (Principal)
                </SelectItem>
              )}
              {product.backup_suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name} - {supplier.price}€ ({supplier.lead_time_days}j)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-sm font-medium">Estimation</p>
          <div className="grid grid-cols-2 gap-2 text-sm mt-2">
            <div>
              <span className="text-muted-foreground">Coût total:</span>
              <span className="font-medium ml-2">
                {(quantity * (product.backup_suppliers.find(s => s.id === selectedSupplier)?.price || 0)).toLocaleString()}€
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Délai:</span>
              <span className="font-medium ml-2">
                {product.backup_suppliers.find(s => s.id === selectedSupplier)?.lead_time_days || 0}j
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onSuccess}>
          Annuler
        </Button>
        <Button onClick={handleReorder} disabled={loading}>
          {loading ? 'Création...' : 'Créer la Commande'}
        </Button>
      </div>
    </div>
  )
}