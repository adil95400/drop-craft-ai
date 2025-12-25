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
  Bell, Settings, Search, Eye, Loader2, CheckCircle
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface StockAlert {
  id: string
  product_id: string | null
  alert_type: string
  severity: string
  message: string | null
  threshold_value: number | null
  current_value: number | null
  is_resolved: boolean
  resolved_at: string | null
  created_at: string
  product?: {
    name: string
    stock_quantity: number
  }
}

export default function StockAlerts() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newAlert, setNewAlert] = useState({
    product_id: '',
    alert_type: 'low_stock',
    threshold_value: 10
  })

  // Fetch stock alerts from database
  const { data: alerts = [], isLoading: isLoadingAlerts } = useQuery({
    queryKey: ['stock-alerts', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      
      const { data, error } = await supabase
        .from('stock_alerts')
        .select(`
          *,
          product:products(name, stock_quantity)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as StockAlert[]
    },
    enabled: !!user?.id
  })

  // Fetch products for creating new alerts
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products-for-alerts', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      
      const { data, error } = await supabase
        .from('products')
        .select('id, name, stock_quantity, sku')
        .eq('user_id', user.id)
        .order('name')
      
      if (error) throw error
      return data
    },
    enabled: !!user?.id
  })

  // Create alert mutation
  const createAlert = useMutation({
    mutationFn: async (alertData: typeof newAlert) => {
      if (!user?.id) throw new Error('Non authentifié')
      
      const product = products.find(p => p.id === alertData.product_id)
      
      const { data, error } = await supabase
        .from('stock_alerts')
        .insert([{
          user_id: user.id,
          product_id: alertData.product_id,
          alert_type: alertData.alert_type,
          severity: alertData.alert_type === 'out_of_stock' ? 'critical' : 'warning',
          message: `Alerte stock pour ${product?.name || 'produit'}`,
          threshold_value: alertData.threshold_value,
          current_value: product?.stock_quantity || 0,
          is_resolved: false
        }])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] })
      toast({ title: "Alerte créée", description: "L'alerte de stock a été créée" })
      setIsCreateModalOpen(false)
      setNewAlert({ product_id: '', alert_type: 'low_stock', threshold_value: 10 })
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de créer l'alerte", variant: "destructive" })
    }
  })

  // Resolve alert mutation
  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('stock_alerts')
        .update({ 
          is_resolved: true, 
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id
        })
        .eq('id', alertId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] })
      toast({ title: "Alerte résolue" })
    }
  })

  // Delete alert mutation
  const deleteAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('stock_alerts')
        .delete()
        .eq('id', alertId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] })
      toast({ title: "Alerte supprimée" })
    }
  })

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    const productName = alert.product?.name || ''
    const matchesSearch = !searchTerm || 
      productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'active' && !alert.is_resolved) ||
      (filterStatus === 'resolved' && alert.is_resolved) ||
      alert.alert_type === filterStatus

    return matchesSearch && matchesFilter
  })

  // Stats
  const alertStats = {
    total: alerts.length,
    active: alerts.filter(a => !a.is_resolved).length,
    lowStock: alerts.filter(a => a.alert_type === 'low_stock' && !a.is_resolved).length,
    outOfStock: alerts.filter(a => a.alert_type === 'out_of_stock' && !a.is_resolved).length
  }

  const getAlertColor = (type: string, isResolved: boolean): any => {
    if (isResolved) return 'secondary'
    switch (type) {
      case 'out_of_stock': return 'destructive'
      case 'low_stock': return 'default'
      case 'overstock': return 'outline'
      default: return 'outline'
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'out_of_stock': return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'low_stock': return <TrendingDown className="w-4 h-4 text-yellow-500" />
      case 'overstock': return <Package className="w-4 h-4 text-blue-500" />
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

  const isLoading = isLoadingAlerts || isLoadingProducts

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
                  <Select 
                    value={newAlert.product_id} 
                    onValueChange={(value) => setNewAlert({ ...newAlert, product_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} (Stock: {product.stock_quantity ?? 0})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Seuil d'alerte</Label>
                  <Input 
                    type="number" 
                    value={newAlert.threshold_value}
                    onChange={(e) => setNewAlert({ ...newAlert, threshold_value: parseInt(e.target.value) || 0 })}
                    placeholder="10" 
                  />
                </div>
                <div>
                  <Label>Type d'alerte</Label>
                  <Select 
                    value={newAlert.alert_type}
                    onValueChange={(value) => setNewAlert({ ...newAlert, alert_type: value })}
                  >
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
                <div className="flex gap-2 pt-4">
                  <Button 
                    className="flex-1" 
                    onClick={() => createAlert.mutate(newAlert)}
                    disabled={!newAlert.product_id || createAlert.isPending}
                  >
                    {createAlert.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Créer l'alerte
                  </Button>
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
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mt-2" />
                ) : (
                  <p className="text-2xl font-bold">{alertStats.total}</p>
                )}
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
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mt-2" />
                ) : (
                  <p className="text-2xl font-bold text-red-600">{alertStats.active}</p>
                )}
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
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mt-2" />
                ) : (
                  <p className="text-2xl font-bold text-yellow-600">{alertStats.lowStock}</p>
                )}
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
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mt-2" />
                ) : (
                  <p className="text-2xl font-bold text-red-600">{alertStats.outOfStock}</p>
                )}
              </div>
              <Package className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="alerts">Alertes ({filteredAlerts.length})</TabsTrigger>
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
            {isLoading ? (
              <Card>
                <CardContent className="p-8 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            ) : filteredAlerts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucune alerte</h3>
                  <p className="text-muted-foreground mb-4">
                    {alerts.length === 0 
                      ? "Créez votre première alerte de stock"
                      : "Aucune alerte ne correspond à vos critères"}
                  </p>
                  {alerts.length === 0 && (
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nouvelle alerte
                    </Button>
                  )}
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
                            <h4 className="font-medium">{alert.product?.name || 'Produit inconnu'}</h4>
                            <Badge variant={getAlertColor(alert.alert_type, alert.is_resolved)}>
                              {getAlertLabel(alert.alert_type)}
                            </Badge>
                            {alert.is_resolved ? (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Résolu
                              </Badge>
                            ) : (
                              <Badge variant="destructive">Actif</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Stock actuel: <strong>{alert.current_value ?? alert.product?.stock_quantity ?? 0}</strong></span>
                            <span>Seuil: <strong>{alert.threshold_value ?? 10}</strong></span>
                            <span>Créé le {format(new Date(alert.created_at), 'PPp', { locale: fr })}</span>
                          </div>
                          {alert.message && (
                            <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!alert.is_resolved && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => resolveAlert.mutate(alert.id)}
                            disabled={resolveAlert.isPending}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Résoudre
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-destructive"
                          onClick={() => deleteAlert.mutate(alert.id)}
                          disabled={deleteAlert.isPending}
                        >
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

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historique des alertes résolues</CardTitle>
              <CardDescription>
                Consultez les alertes qui ont été résolues
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.filter(a => a.is_resolved).length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Aucune alerte résolue pour le moment
                    </p>
                  ) : (
                    alerts.filter(a => a.is_resolved).map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div>
                            <p className="font-medium">Alerte résolue: {alert.product?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {alert.resolved_at && format(new Date(alert.resolved_at), 'PPp', { locale: fr })}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">Résolu</Badge>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
