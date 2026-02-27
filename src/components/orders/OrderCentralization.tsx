import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShoppingBag, Package, Truck, AlertTriangle, CheckCircle, Clock, Eye, MoreHorizontal, Search, Filter } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface CentralizedOrder {
  id: string
  order_number: string
  platform: 'shopify' | 'woocommerce' | 'amazon' | 'ebay'
  customer_name: string
  customer_email: string
  total_amount: number
  currency: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  fulfillment_status: 'unfulfilled' | 'partial' | 'fulfilled'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  items: OrderItem[]
  shipping_address: any
  created_at: string
  updated_at: string
  supplier_orders?: SupplierOrder[]
}

interface OrderItem {
  id: string
  product_name: string
  sku: string
  quantity: number
  unit_price: number
  total_price: number
  supplier_id?: string
  fulfillment_status: 'pending' | 'ordered' | 'shipped' | 'delivered'
}

interface SupplierOrder {
  id: string
  supplier_name: string
  supplier_id: string
  items: OrderItem[]
  status: 'pending' | 'ordered' | 'shipped' | 'delivered'
  tracking_number?: string
  total_amount: number
  created_at: string
  estimated_delivery?: string
}

export function OrderCentralization() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<CentralizedOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<CentralizedOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<CentralizedOrder | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [platformFilter, setPlatformFilter] = useState<string>('all')

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [orders, searchTerm, statusFilter, platformFilter])

  const loadOrders = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, customers(*), order_items(*)')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      const mappedOrders: CentralizedOrder[] = (data || []).map((order: any) => ({
        id: order.id,
        order_number: order.order_number || `ORD-${order.id.slice(-6)}`,
        platform: order.source_platform || 'shopify',
        customer_name: order.customers?.name || order.customer_name || 'Client Inconnu',
        customer_email: order.customers?.email || order.customer_email || 'Non spécifié',
        total_amount: order.total_amount || 0,
        currency: order.currency || 'EUR',
        status: order.status || 'pending',
        fulfillment_status: order.fulfillment_status || 'unfulfilled',
        payment_status: order.payment_status || 'pending',
        items: (order.order_items || []).map((item: any) => ({
          id: item.id,
          product_name: item.product_name || 'Produit',
          sku: item.supplier_sku || item.sku || '',
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          total_price: (item.unit_price || 0) * (item.quantity || 1),
          supplier_id: item.supplier_id || null,
          fulfillment_status: item.fulfillment_status || 'pending',
        })),
        shipping_address: order.shipping_address || {},
        created_at: order.created_at,
        updated_at: order.updated_at,
        supplier_orders: []
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
      setIsLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = orders

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    if (platformFilter !== 'all') {
      filtered = filtered.filter(order => order.platform === platformFilter)
    }

    setFilteredOrders(filtered)
  }


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/10 text-warning'
      case 'confirmed': return 'bg-primary/10 text-primary'
      case 'processing': return 'bg-info/10 text-info'
      case 'shipped': return 'bg-primary/10 text-primary'
      case 'delivered': return 'bg-success/10 text-success'
      case 'cancelled': return 'bg-destructive/10 text-destructive'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getPlatformIcon = (platform: string) => {
    return <ShoppingBag className="w-4 h-4" />
  }

  const handleOrderAction = async (orderId: string, action: string) => {
    try {
      const statusMap: Record<string, string> = {
        confirm: 'confirmed',
        process: 'processing',
        ship: 'shipped',
        deliver: 'delivered',
        cancel: 'cancelled',
      }
      const newStatus = statusMap[action]
      if (!newStatus) {
        toast({ title: "Action inconnue", variant: "destructive" })
        return
      }

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId)

      if (error) throw error

      toast({ title: "Statut mis à jour", description: `Commande passée en "${newStatus}"` })
      await loadOrders()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message || "Impossible d'exécuter l'action",
        variant: "destructive"
      })
    }
  }

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing' || o.status === 'confirmed').length,
    fulfilled: orders.filter(o => o.status === 'delivered').length,
    revenue: orders.reduce((sum, o) => sum + o.total_amount, 0)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-8 h-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Total commandes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="w-8 h-8 text-warning" />
              <div>
                <div className="text-2xl font-bold text-warning">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Package className="w-8 h-8 text-info" />
              <div>
                <div className="text-2xl font-bold text-info">{stats.processing}</div>
                <p className="text-xs text-muted-foreground">En traitement</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-8 h-8 text-success" />
              <div>
                <div className="text-2xl font-bold text-success">{stats.revenue.toFixed(0)}€</div>
                <p className="text-xs text-muted-foreground">Chiffre d'affaires</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par numéro de commande, client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="confirmed">Confirmée</SelectItem>
                  <SelectItem value="processing">En traitement</SelectItem>
                  <SelectItem value="shipped">Expédiée</SelectItem>
                  <SelectItem value="delivered">Livrée</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Plateforme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes plateformes</SelectItem>
                  <SelectItem value="shopify">Shopify</SelectItem>
                  <SelectItem value="woocommerce">WooCommerce</SelectItem>
                  <SelectItem value="amazon">Amazon</SelectItem>
                  <SelectItem value="ebay">eBay</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Commandes Centralisées ({filteredOrders.length})</CardTitle>
          <CardDescription>
            Vue unifiée de toutes vos commandes multi-plateformes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Plateforme</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Fulfillment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.order_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(order.platform)}
                        <span className="capitalize">{order.platform}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {order.total_amount.toFixed(2)} {order.currency}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                       <Badge 
                         variant="outline" 
                         className={order.fulfillment_status === 'fulfilled' ? 'bg-success/10 text-success' : 
                                   order.fulfillment_status === 'partial' ? 'bg-warning/10 text-warning' :
                                   'bg-muted text-muted-foreground'}
                       >
                        {order.fulfillment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Détails de la commande {order.order_number}</DialogTitle>
                              <DialogDescription>
                                Gestion centralisée et fulfillment automatique
                              </DialogDescription>
                            </DialogHeader>
                            {selectedOrder && <OrderDetailsView order={selectedOrder} onUpdate={loadOrders} />}
                          </DialogContent>
                        </Dialog>
                        
                        <Button size="sm" variant="outline">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

function OrderDetailsView({ order, onUpdate }: { order: CentralizedOrder; onUpdate: () => void }) {
  const { toast } = useToast()
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/10 text-warning'
      case 'confirmed': return 'bg-primary/10 text-primary'
      case 'processing': return 'bg-info/10 text-info'
      case 'shipped': return 'bg-primary/10 text-primary'
      case 'delivered': return 'bg-success/10 text-success'
      case 'cancelled': return 'bg-destructive/10 text-destructive'
      case 'ordered': return 'bg-primary/10 text-primary'
      default: return 'bg-muted text-muted-foreground'
    }
  }
  
  
  const handleSupplierAction = async (action: string, supplierOrderId?: string) => {
    try {
      if (action === 'confirm_order' && supplierOrderId) {
        const { error } = await supabase
          .from('orders')
          .update({ status: 'processing', updated_at: new Date().toISOString() })
          .eq('id', order.id)
        if (error) throw error
        toast({ title: "Commande confirmée" })
      } else if (action === 'auto_create_orders') {
        const { error } = await supabase.functions.invoke('order-fulfillment-auto', {
          body: { order_id: order.id }
        })
        if (error) throw error
        toast({ title: "Fulfillment automatique déclenché" })
      } else {
        toast({ title: "Action en cours", description: `${action}` })
      }
      onUpdate()
    } catch (error: any) {
      toast({ title: "Erreur", description: error?.message || "Action échouée", variant: "destructive" })
    }
  }

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
        <TabsTrigger value="fulfillment">Fulfillment</TabsTrigger>
        <TabsTrigger value="tracking">Suivi</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div><strong>Nom:</strong> {order.customer_name}</div>
              <div><strong>Email:</strong> {order.customer_email}</div>
              <div><strong>Plateforme:</strong> <span className="capitalize">{order.platform}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Détails Commande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div><strong>Numéro:</strong> {order.order_number}</div>
              <div><strong>Total:</strong> {order.total_amount.toFixed(2)} {order.currency}</div>
              <div><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Produits commandés</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Qté</TableHead>
                  <TableHead>Prix unitaire</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product_name}</TableCell>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.unit_price.toFixed(2)}€</TableCell>
                    <TableCell>{item.total_price.toFixed(2)}€</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(item.fulfillment_status)}>
                        {item.fulfillment_status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="fulfillment" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Commandes Fournisseurs</CardTitle>
            <CardDescription>
              Gestion automatique des commandes vers les fournisseurs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {order.supplier_orders && order.supplier_orders.length > 0 ? (
              <div className="space-y-4">
                {order.supplier_orders.map((supplierOrder) => (
                  <Card key={supplierOrder.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{supplierOrder.supplier_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {supplierOrder.items.length} produit(s) - {supplierOrder.total_amount.toFixed(2)}€
                          </p>
                        </div>
                        <Badge variant="outline" className={getStatusColor(supplierOrder.status)}>
                          {supplierOrder.status}
                        </Badge>
                      </div>

                      {supplierOrder.tracking_number && (
                        <div className="flex items-center gap-2 text-sm">
                          <Truck className="w-4 h-4" />
                          <span>Suivi: {supplierOrder.tracking_number}</span>
                        </div>
                      )}

                      <div className="flex gap-2 mt-3">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleSupplierAction('view_details', supplierOrder.id)}
                        >
                          Voir détails
                        </Button>
                        {supplierOrder.status === 'pending' && (
                          <Button 
                            size="sm"
                            onClick={() => handleSupplierAction('confirm_order', supplierOrder.id)}
                          >
                            Confirmer commande
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune commande fournisseur automatique détectée</p>
                <Button 
                  className="mt-4"
                  onClick={() => handleSupplierAction('auto_create_orders')}
                >
                  Créer automatiquement
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="tracking" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suivi des expéditions</CardTitle>
            <CardDescription>
              Suivi en temps réel de toutes les expéditions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.supplier_orders?.filter(so => so.tracking_number).map((supplierOrder) => (
                <div key={supplierOrder.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{supplierOrder.supplier_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {supplierOrder.tracking_number}
                      </p>
                    </div>
                    <Badge variant="outline" className={getStatusColor(supplierOrder.status)}>
                      {supplierOrder.status}
                    </Badge>
                  </div>
                  
                  {supplierOrder.estimated_delivery && (
                    <div className="text-sm text-muted-foreground">
                      Livraison estimée: {new Date(supplierOrder.estimated_delivery).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )) || (
                <div className="text-center py-8 text-muted-foreground">
                  <Truck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun numéro de suivi disponible</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}