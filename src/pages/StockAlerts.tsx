import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  AlertTriangle, Package, TrendingDown, RefreshCw, Plus, Edit, Trash2,
  Bell, Settings, Filter, Search, Eye, BarChart3
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface StockAlert {
  id: string
  product_id: string
  product_name: string
  current_stock: number
  threshold: number
  alert_type: 'low_stock' | 'out_of_stock' | 'overstock'
  status: 'active' | 'resolved' | 'dismissed'
  created_at: string
  updated_at: string
}

export default function StockAlerts() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState<StockAlert | null>(null)

  // Fetch products with low stock
  const { data: products, isLoading } = useQuery({
    queryKey: ['products-stock', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      
      const { data, error } = await supabase
        .from('products')
        .select('id, name, stock_quantity, category, price, sku')
        .eq('user_id', user.id)
        .order('stock_quantity', { ascending: true })
      
      if (error) throw error
      return data
    },
    enabled: !!user?.id
  })

  // Generate mock stock alerts based on products
  const stockAlerts: StockAlert[] = products?.map((product, index) => ({
    id: `alert-${product.id}`,
    product_id: product.id,
    product_name: product.name,
    current_stock: product.stock_quantity,
    threshold: 10,
    alert_type: product.stock_quantity === 0 ? 'out_of_stock' : 
                product.stock_quantity < 5 ? 'low_stock' : 'overstock',
    status: product.stock_quantity === 0 ? 'active' : 
            product.stock_quantity < 10 ? 'active' : 'resolved',
    created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  })).filter(alert => alert.status === 'active' || filterStatus === 'all') || []

  const filteredAlerts = stockAlerts.filter(alert => {
    const matchesSearch = !searchTerm || 
      alert.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || 
      alert.status === filterStatus ||
      alert.alert_type === filterStatus

    return matchesSearch && matchesFilter
  })

  const alertStats = {
    total: stockAlerts.length,
    active: stockAlerts.filter(a => a.status === 'active').length,
    lowStock: stockAlerts.filter(a => a.alert_type === 'low_stock').length,
    outOfStock: stockAlerts.filter(a => a.alert_type === 'out_of_stock').length
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'out_of_stock': return 'destructive'
      case 'low_stock': return 'secondary'
      case 'overstock': return 'default'
      default: return 'outline'
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'out_of_stock': return <AlertTriangle className="w-4 h-4" />
      case 'low_stock': return <TrendingDown className="w-4 h-4" />
      case 'overstock': return <Package className="w-4 h-4" />
      default: return <Bell className="w-4 h-4" />
    }
  }

  const getAlertLabel = (type: string) => {
    switch (type) {
      case 'out_of_stock': return 'Rupture de stock'
      case 'low_stock': return 'Stock faible'
      case 'overstock': return 'Surstock'
      default: return 'Alerte'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alertes de Stock</h1>
          <p className="text-muted-foreground">
            Surveillez et gérez les niveaux de stock de vos produits
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Paramètres
          </Button>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle alerte
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une alerte de stock</DialogTitle>
                <DialogDescription>
                  Configurez une nouvelle alerte pour surveiller le stock d'un produit
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Produit</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} (Stock: {product.stock_quantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Seuil d'alerte</Label>
                  <Input type="number" placeholder="10" />
                </div>
                <div>
                  <Label>Type d'alerte</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Type d'alerte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low_stock">Stock faible</SelectItem>
                      <SelectItem value="out_of_stock">Rupture de stock</SelectItem>
                      <SelectItem value="overstock">Surstock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="notifications" />
                  <Label htmlFor="notifications">Notifications email</Label>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button className="flex-1">Créer l'alerte</Button>
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Annuler
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Alertes</p>
                <p className="text-2xl font-bold">{alertStats.total}</p>
              </div>
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alertes Actives</p>
                <p className="text-2xl font-bold text-red-600">{alertStats.active}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stock Faible</p>
                <p className="text-2xl font-bold text-yellow-600">{alertStats.lowStock}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ruptures</p>
                <p className="text-2xl font-bold text-red-600">{alertStats.outOfStock}</p>
              </div>
              <Package className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
          <TabsTrigger value="rules">Règles d'alerte</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un produit..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les alertes</SelectItem>
                    <SelectItem value="active">Actives</SelectItem>
                    <SelectItem value="resolved">Résolues</SelectItem>
                    <SelectItem value="low_stock">Stock faible</SelectItem>
                    <SelectItem value="out_of_stock">Rupture</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Alerts List */}
          <div className="space-y-4">
            {filteredAlerts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucune alerte</h3>
                  <p className="text-muted-foreground">
                    Aucune alerte de stock ne correspond à vos critères.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredAlerts.map((alert) => (
                <Card key={alert.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        {getAlertIcon(alert.alert_type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{alert.product_name}</h4>
                            <Badge variant={getAlertColor(alert.alert_type)}>
                              {getAlertLabel(alert.alert_type)}
                            </Badge>
                            <Badge variant={alert.status === 'active' ? 'destructive' : 'secondary'}>
                              {alert.status === 'active' ? 'Actif' : 'Résolu'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Stock actuel: <strong>{alert.current_stock}</strong></span>
                            <span>Seuil: <strong>{alert.threshold}</strong></span>
                            <span>Créé le {format(new Date(alert.created_at), 'PPp', { locale: fr })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-2" />
                          Voir
                        </Button>
                        <Button size="sm" variant="outline">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Réapprovisionner
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Règles d'alerte automatiques</CardTitle>
              <CardDescription>
                Configurez des règles pour générer automatiquement des alertes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Stock faible général</h4>
                  <p className="text-sm text-muted-foreground">
                    Alerte quand le stock passe sous 10 unités
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Rupture imminente</h4>
                  <p className="text-sm text-muted-foreground">
                    Alerte 3 jours avant rupture prévue
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Surstock détecté</h4>
                  <p className="text-sm text-muted-foreground">
                    Alerte quand le stock dépasse 100 unités
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historique des alertes</CardTitle>
              <CardDescription>
                Consultez l'historique complet de vos alertes de stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Alerte résolue: Produit {index + 1}</p>
                        <p className="text-sm text-muted-foreground">
                          Stock réapprovisionné - {format(new Date(Date.now() - index * 24 * 60 * 60 * 1000), 'PPp', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">Résolu</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}