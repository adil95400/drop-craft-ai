/**
 * Page Commandes moderne - Gestion complète des commandes
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ActionButton } from '@/components/common/ActionButton'
import { Helmet } from 'react-helmet-async'
import { useUnifiedSystem } from '@/hooks/useUnifiedSystem'
import { 
  Package, Search, Filter, MoreHorizontal, 
  Eye, Truck, CheckCircle, XCircle, Clock,
  RefreshCw, Download, AlertTriangle
} from 'lucide-react'

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  status: string
  total_amount: number
  created_at: string
  tracking_number?: string
  items_count: number
  shipping_address: string
}

const ModernOrdersPage: React.FC = () => {
  const { user, loading, getOrders } = useUnifiedSystem()
  const [orders, setOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loadingOrders, setLoadingOrders] = useState(true)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    if (!user?.id) return
    setLoadingOrders(true)
    try {
      const ordersData = await getOrders()
      
      // Mapper les données réelles vers le format interface Order
      const mappedOrders = ordersData.map((order: any) => ({
        id: order.id,
        order_number: order.order_number || `ORD-${order.id.slice(-6)}`,
        customer_name: order.customers?.name || `Client ${order.customer_id?.slice(-6) || 'Inconnu'}`,
        customer_email: order.customers?.email || '',
        status: order.status || 'pending',
        total_amount: order.total_amount || 0,
        created_at: order.created_at,
        tracking_number: order.tracking_number || undefined,
        items_count: Array.isArray(order.order_items) ? order.order_items.length : 1,
        shipping_address: typeof order.shipping_address === 'object' 
          ? `${order.shipping_address?.city || ''}, ${order.shipping_address?.country || ''}`
          : order.shipping_address || 'Non spécifiée'
      }))
      setOrders(mappedOrders)
    } catch (error) {
      console.error('Erreur chargement commandes:', error)
    } finally {
      setLoadingOrders(false)
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any, icon: React.ReactNode }> = {
      pending: { variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
      processing: { variant: 'default', icon: <Package className="h-3 w-3" /> },
      shipped: { variant: 'default', icon: <Truck className="h-3 w-3" /> },
      delivered: { variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
      cancelled: { variant: 'destructive', icon: <XCircle className="h-3 w-3" /> }
    }
    const config = variants[status] || variants.pending
    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length
  }

  if (loading || loadingOrders) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Commandes - Drop Craft AI | Gestion des Commandes</title>
        <meta name="description" content="Gérez vos commandes dropshipping. Suivi, traitement et automatisation des expéditions." />
      </Helmet>

      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Commandes</h1>
            <p className="text-muted-foreground">
              Gérez vos {orders.length} commandes avec suivi automatique
            </p>
          </div>
          
          <div className="flex gap-2">
            <ActionButton variant="outline" onClick={loadOrders}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </ActionButton>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{orderStats.total}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{orderStats.pending}</div>
              <p className="text-xs text-muted-foreground">En attente</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{orderStats.processing}</div>
              <p className="text-xs text-muted-foreground">En traitement</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{orderStats.shipped}</div>
              <p className="text-xs text-muted-foreground">Expédiées</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{orderStats.delivered}</div>
              <p className="text-xs text-muted-foreground">Livrées</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList>
            <TabsTrigger value="orders">Toutes les commandes</TabsTrigger>
            <TabsTrigger value="automation">Automatisation</TabsTrigger>
            <TabsTrigger value="tracking">Suivi en temps réel</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            {/* Filtres */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par numéro ou client..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="pending">En attente</option>
                    <option value="processing">En traitement</option>
                    <option value="shipped">Expédiées</option>
                    <option value="delivered">Livrées</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Table des commandes */}
            <Card>
              <CardHeader>
                <CardTitle>Commandes ({filteredOrders.length})</CardTitle>
                <CardDescription>
                  Gestion complète de vos commandes avec suivi automatique
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Commande</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Suivi</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.order_number}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.customer_name}</div>
                            <div className="text-sm text-muted-foreground">{order.shipping_address}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(order.status)}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{order.total_amount}€</div>
                          <div className="text-sm text-muted-foreground">{order.items_count} articles</div>
                        </TableCell>
                        <TableCell>
                          {order.tracking_number ? (
                            <Badge variant="outline">{order.tracking_number}</Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">Pas de suivi</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Truck className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Automatisation des Commandes</CardTitle>
                <CardDescription>
                  Configurez l'envoi automatique vers vos fournisseurs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Envoi automatique</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Transférez automatiquement les commandes vers vos fournisseurs
                    </p>
                    <Badge variant="default">Activé</Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Suivi automatique</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Récupération automatique des numéros de suivi
                    </p>
                    <Badge variant="default">Activé</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Suivi en Temps Réel</CardTitle>
                <CardDescription>
                  Monitoring des expéditions et alertes automatiques
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Système de suivi opérationnel</span>
                    </div>
                    <Badge variant="default">En ligne</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">24</div>
                      <p className="text-sm text-muted-foreground">Colis en transit</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">89%</div>
                      <p className="text-sm text-muted-foreground">Taux de livraison</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">5.2j</div>
                      <p className="text-sm text-muted-foreground">Délai moyen</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

export default ModernOrdersPage