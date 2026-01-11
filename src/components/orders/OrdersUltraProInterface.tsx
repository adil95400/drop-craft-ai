import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Package, Truck, CheckCircle, Clock, AlertCircle, Search, Filter, Eye, Edit, RefreshCw } from 'lucide-react'
import { useRealOrders } from '@/hooks/useRealOrders'
import { useRealTracking } from '@/hooks/useRealTracking'

export function OrdersUltraProInterface() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  
  const { orders, stats, updateOrderStatus, isUpdating } = useRealOrders()
  const { 
    trackingOrders, 
    trackPackage, 
    updateOrderTracking, 
    getTrackingStats,
    autoRefreshTracking,
    isTracking,
    isUpdating: isUpdatingTracking,
    isAutoRefreshing
  } = useRealTracking()

  const trackingStats = getTrackingStats()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'processing':
        return <Package className="w-4 h-4 text-blue-500" />
      case 'shipped':
        return <Truck className="w-4 h-4 text-orange-500" />
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: 'secondary',
      processing: 'default',
      shipped: 'default',
      delivered: 'default',
      cancelled: 'destructive'
    }
    
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      processing: 'bg-blue-500',
      shipped: 'bg-orange-500',
      delivered: 'bg-green-500',
      cancelled: 'bg-red-500'
    }

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    )
  }

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    updateOrderStatus(orderId, newStatus as "pending" | "shipped" | "processing" | "delivered" | "cancelled")
  }

  const handleTrackingUpdate = (orderId: string, trackingNumber: string) => {
    updateOrderTracking({ orderId, trackingNumber, status: 'shipped' })
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = !statusFilter || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Commandes Ultra Pro</h2>
          <p className="text-muted-foreground">
            Gérez vos commandes avec suivi en temps réel
          </p>
        </div>
        <Button 
          onClick={() => autoRefreshTracking()}
          disabled={isAutoRefreshing}
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isAutoRefreshing ? 'animate-spin' : ''}`} />
          {isAutoRefreshing ? 'Actualisation...' : 'Actualiser suivi'}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">En attente</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Expédiées</p>
                <p className="text-2xl font-bold">{trackingStats.shipped}</p>
              </div>
              <Truck className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Livrées</p>
                <p className="text-2xl font-bold">{trackingStats.delivered}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Revenus</p>
                <p className="text-2xl font-bold">{stats.revenue.toFixed(0)}€</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="tracking">Suivi Colis</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher une commande..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="processing">En traitement</SelectItem>
                <SelectItem value="shipped">Expédiée</SelectItem>
                <SelectItem value="delivered">Livrée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">#{order.order_number}</h3>
                       <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(order.status)}
                      <span className="text-lg font-bold">{order.total_amount}€</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Articles</p>
                      <p className="text-sm">{order.order_items?.length || 0} article(s)</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Numéro de suivi</p>
                      <p className="text-sm">{order.tracking_number || 'Non assigné'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Transporteur</p>
                      <p className="text-sm">Non défini</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select 
                      value={order.status} 
                      onValueChange={(value) => handleStatusUpdate(order.id, value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="processing">En traitement</SelectItem>
                        <SelectItem value="shipped">Expédiée</SelectItem>
                        <SelectItem value="delivered">Livrée</SelectItem>
                        <SelectItem value="cancelled">Annulée</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      Détails
                    </Button>

                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>

                    {order.tracking_number && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => trackPackage({ 
                          trackingNumber: order.tracking_number!, 
                          carrier: 'auto'
                        })}
                        disabled={isTracking}
                      >
                        <Truck className="w-4 h-4 mr-1" />
                        {isTracking ? 'Suivi...' : 'Suivre'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Suivi des Colis en Temps Réel</CardTitle>
              <CardDescription>
                Suivez vos colis automatiquement avec 17track
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trackingOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">#{order.order_number}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Suivi: {order.tracking_number} • Transporteur: {order.carrier}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Client: {order.customer_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => trackPackage({ 
                          trackingNumber: order.tracking_number, 
                          carrier: order.carrier 
                        })}
                        disabled={isTracking}
                      >
                        <RefreshCw className={`w-4 h-4 mr-1 ${isTracking ? 'animate-spin' : ''}`} />
                        Actualiser
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Évolution des Commandes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-7 gap-2">
                    {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, i) => {
                      const height = Math.random() * 60 + 20
                      return (
                        <div key={day} className="flex flex-col items-center gap-1">
                          <div 
                            className="w-full bg-primary/80 rounded-t"
                            style={{ height: `${height}px` }}
                          />
                          <span className="text-xs text-muted-foreground">{day}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cette semaine</span>
                    <span className="font-medium text-success">+18% vs semaine précédente</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance de Livraison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Délai moyen de livraison</span>
                    <span className="font-medium">7.2 jours</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-success h-2 rounded-full" style={{ width: '72%' }} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Taux de livraison à temps</span>
                    <span className="font-medium text-success">94.5%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '94.5%' }} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Satisfaction client</span>
                    <span className="font-medium">4.8/5 ⭐</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}