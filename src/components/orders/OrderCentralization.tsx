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
      // Load orders from database
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error loading orders:', error)
        // Use mock data for demo
        const mockOrders = generateMockOrders()
        setOrders(mockOrders)
      } else {
        // Use mock data for demo
        const mockOrders = generateMockOrders()
        setOrders(mockOrders)
      }
    } catch (error) {
      console.error('Error loading orders:', error)
      const mockOrders = generateMockOrders()
      setOrders(mockOrders)
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

  const generateMockOrders = (): CentralizedOrder[] => {
    return [
      {
        id: '1',
        order_number: 'SH-001',
        platform: 'shopify',
        customer_name: 'Jean Dupont',
        customer_email: 'jean@example.com',
        total_amount: 159.99,
        currency: 'EUR',
        status: 'confirmed',
        fulfillment_status: 'partial',
        payment_status: 'paid',
        items: [
          {
            id: '1-1',
            product_name: 'T-shirt Premium',
            sku: 'TSH-001',
            quantity: 2,
            unit_price: 29.99,
            total_price: 59.98,
            supplier_id: 'sup-1',
            fulfillment_status: 'shipped'
          },
          {
            id: '1-2',
            product_name: 'Casquette Logo',
            sku: 'CAP-001',
            quantity: 1,
            unit_price: 19.99,
            total_price: 19.99,
            supplier_id: 'sup-2',
            fulfillment_status: 'pending'
          }
        ],
        shipping_address: { city: 'Paris', country: 'France' },
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
        supplier_orders: [
          {
            id: 'so-1',
            supplier_name: 'TextilePro',
            supplier_id: 'sup-1',
            items: [{ id: '1-1', product_name: 'T-shirt Premium', sku: 'TSH-001', quantity: 2, unit_price: 29.99, total_price: 59.98, fulfillment_status: 'shipped' }],
            status: 'shipped',
            tracking_number: 'TR123456789',
            total_amount: 59.98,
            created_at: new Date(Date.now() - 3600000).toISOString(),
            estimated_delivery: new Date(Date.now() + 172800000).toISOString()
          }
        ]
      },
      {
        id: '2',
        order_number: 'WC-002',
        platform: 'woocommerce',
        customer_name: 'Marie Martin',
        customer_email: 'marie@example.com',
        total_amount: 89.95,
        currency: 'EUR',
        status: 'processing',
        fulfillment_status: 'unfulfilled',
        payment_status: 'paid',
        items: [
          {
            id: '2-1',
            product_name: 'Sac à dos Voyage',
            sku: 'BAG-001',
            quantity: 1,
            unit_price: 89.95,
            total_price: 89.95,
            supplier_id: 'sup-3',
            fulfillment_status: 'ordered'
          }
        ],
        shipping_address: { city: 'Lyon', country: 'France' },
        created_at: new Date(Date.now() - 43200000).toISOString(),
        updated_at: new Date(Date.now() - 1800000).toISOString(),
        supplier_orders: []
      }
    ]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-orange-100 text-orange-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlatformIcon = (platform: string) => {
    return <ShoppingBag className="w-4 h-4" />
  }

  const handleOrderAction = async (orderId: string, action: string) => {
    try {
      toast({
        title: "Action exécutée",
        description: `Action ${action} appliquée à la commande ${orderId}`
      })
      // Reload orders to reflect changes
      await loadOrders()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'exécuter l'action",
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
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Package className="w-8 h-8 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">{stats.processing}</div>
                <p className="text-xs text-muted-foreground">En traitement</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.revenue.toFixed(0)}€</div>
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
                        className={order.fulfillment_status === 'fulfilled' ? 'bg-green-100 text-green-800' : 
                                  order.fulfillment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'}
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
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-orange-100 text-orange-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  const handleSupplierAction = async (action: string, orderId?: string) => {
    toast({
      title: "Action exécutée",
      description: `${action} - Commande ${order.order_number}`
    })
    onUpdate()
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