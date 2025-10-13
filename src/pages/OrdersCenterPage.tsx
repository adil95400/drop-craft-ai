import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Helmet } from 'react-helmet-async'
import { useUnifiedSystem } from '@/hooks/useUnifiedSystem'
import { 
  Package, Search, Filter, MoreVertical,
  Truck, CheckCircle, Clock, AlertCircle,
  ShoppingCart, TrendingUp, MapPin, Phone,
  Mail, ExternalLink, Printer, Download
} from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  customer: {
    name: string
    email: string
    phone: string
  }
  platform: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  items: number
  createdAt: string
  trackingNumber?: string
  shippingAddress: {
    street: string
    city: string
    country: string
    postalCode: string
  }
}

export default function OrdersCenterPage() {
  const { toast } = useToast()
  const { user, getOrders } = useUnifiedSystem()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const ordersData = await getOrders()
      
      // Map data to Order interface
      const mappedOrders: Order[] = ordersData.map((order: any) => ({
        id: order.id,
        orderNumber: order.order_number || `ORD-${order.id.slice(-8).toUpperCase()}`,
        customer: {
          name: order.customers?.name || 'Client inconnu',
          email: order.customers?.email || '',
          phone: order.customers?.phone || ''
        },
        platform: order.platform || 'Shopify',
        status: order.status || 'pending',
        total: order.total_amount || 0,
        items: Array.isArray(order.order_items) ? order.order_items.length : 1,
        createdAt: order.created_at,
        trackingNumber: order.tracking_number,
        shippingAddress: typeof order.shipping_address === 'object' ? {
          street: order.shipping_address?.street || '',
          city: order.shipping_address?.city || '',
          country: order.shipping_address?.country || '',
          postalCode: order.shipping_address?.postal_code || ''
        } : {
          street: '',
          city: '',
          country: '',
          postalCode: ''
        }
      }))
      
      setOrders(mappedOrders)
    } catch (error) {
      console.error('Error loading orders:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les commandes",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleUpdateStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    ))
    toast({
      title: "Statut mis à jour",
      description: `La commande a été marquée comme ${newStatus}`
    })
  }

  const handlePrintLabel = (order: Order) => {
    toast({
      title: "Impression en cours",
      description: `Étiquette d'expédition pour ${order.orderNumber}`
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'processing': return <Package className="h-4 w-4" />
      case 'shipped': return <Truck className="h-4 w-4" />
      case 'delivered': return <CheckCircle className="h-4 w-4" />
      case 'cancelled': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: Order['status']) => {
    const variants = {
      pending: 'secondary',
      processing: 'default',
      shipped: 'default',
      delivered: 'default',
      cancelled: 'destructive'
    }
    return (
      <Badge variant={variants[status] as any} className="gap-1">
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    totalRevenue: orders.reduce((sum, o) => sum + o.total, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Centre Commandes - Drop Craft AI</title>
        <meta name="description" content="Gestion centralisée multi-plateformes de vos commandes" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Centre Commandes</h1>
            <p className="text-muted-foreground">
              Gestion unifiée de toutes vos plateformes e-commerce
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button>
              <Package className="h-4 w-4 mr-2" />
              Nouvelle commande
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">En traitement</p>
                <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Expédiées</p>
                <p className="text-2xl font-bold text-green-600">{stats.shipped}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">CA Total</p>
                <p className="text-2xl font-bold">€{stats.totalRevenue.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par numéro, client, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full md:w-auto">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="all">Tous</TabsTrigger>
                  <TabsTrigger value="pending">En attente</TabsTrigger>
                  <TabsTrigger value="processing">Traitement</TabsTrigger>
                  <TabsTrigger value="shipped">Expédiées</TabsTrigger>
                  <TabsTrigger value="delivered">Livrées</TabsTrigger>
                  <TabsTrigger value="cancelled">Annulées</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="grid gap-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header Row */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                        {getStatusBadge(order.status)}
                        <Badge variant="outline">{order.platform}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ShoppingCart className="h-3 w-3" />
                          {order.items} article{order.items > 1 ? 's' : ''}
                        </span>
                        <span>•</span>
                        <span className="font-medium text-foreground">€{order.total.toFixed(2)}</span>
                        <span>•</span>
                        <span>{new Date(order.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handlePrintLabel(order)}>
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Customer & Shipping Info */}
                  <div className="grid gap-4 md:grid-cols-2 p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">CLIENT</p>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{order.customer.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {order.customer.email}
                        </div>
                        {order.customer.phone && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {order.customer.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">LIVRAISON</p>
                      <div className="space-y-1">
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div>
                            <p>{order.shippingAddress.street}</p>
                            <p>{order.shippingAddress.postalCode} {order.shippingAddress.city}</p>
                            <p>{order.shippingAddress.country}</p>
                          </div>
                        </div>
                        {order.trackingNumber && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Truck className="h-3 w-3" />
                            Suivi: {order.trackingNumber}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <Button size="sm" onClick={() => handleUpdateStatus(order.id, 'processing')}>
                        <Package className="h-4 w-4 mr-2" />
                        Traiter
                      </Button>
                    )}
                    {order.status === 'processing' && (
                      <Button size="sm" onClick={() => handleUpdateStatus(order.id, 'shipped')}>
                        <Truck className="h-4 w-4 mr-2" />
                        Expédier
                      </Button>
                    )}
                    {order.status === 'shipped' && (
                      <Button size="sm" onClick={() => handleUpdateStatus(order.id, 'delivered')}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Marquer livrée
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Voir détails
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-2">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-lg font-medium">Aucune commande trouvée</p>
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? 'Essayez de modifier vos critères de recherche' : 'Vos commandes apparaîtront ici'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
