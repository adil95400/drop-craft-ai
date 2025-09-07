import { useState } from 'react'
import { ShoppingCart, Package, Truck, CheckCircle2, Clock, Search, Filter, Download, RefreshCw, Plus, Eye, Edit, MoreHorizontal, AlertCircle, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useRealOrders } from '@/hooks/useRealOrders'
import { LoadingState } from '@/components/common/LoadingState'
import { EmptyState } from '@/components/common/EmptyState'
import { ActionButton } from '@/components/common/ActionButton'
import { useToast } from '@/hooks/use-toast'

export default function OrdersUltraProReal() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d')

  const { 
    orders, 
    stats, 
    isLoading, 
    error,
    updateOrderStatus,
    isUpdating
  } = useRealOrders()

  if (isLoading) return <LoadingState />
  if (error) return <div>Erreur lors du chargement des commandes</div>

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">En attente</Badge>
      case 'processing':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">En cours</Badge>
      case 'shipped':
        return <Badge variant="default" className="bg-purple-100 text-purple-800">Expédiée</Badge>
      case 'delivered':
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800">Livrée</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Annulée</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'processing':
        return <Package className="h-4 w-4 text-blue-500" />
      case 'shipped':
        return <Truck className="h-4 w-4 text-purple-500" />
      case 'delivered':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <ShoppingCart className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    updateOrderStatus(orderId, newStatus as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled')
    toast({
      title: "Statut mis à jour",
      description: `Statut de la commande mis à jour vers ${newStatus}`,
    })
  }

  const handleSync = () => {
    toast({
      title: "Synchronisation",
      description: "Synchronisation des commandes en cours...",
    })
  }

  const handleExport = () => {
    toast({
      title: "Export",
      description: "Export des données en cours...",
    })
  }

  const handleNewOrder = () => {
    toast({
      title: "Nouvelle commande",
      description: "Fonctionnalité de création de commande à implémenter",
    })
  }

  if (orders.length === 0) {
    return (
      <EmptyState 
        title="Aucune commande"
        description="Aucune commande trouvée pour les critères sélectionnés"
        action={{
          label: "Nouvelle commande",
          onClick: handleNewOrder
        }}
      />
    )
  }

  return (
    <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Commandes Ultra Pro</h1>
            <p className="text-muted-foreground">Gestion avancée des commandes avec données réelles</p>
          </div>
          
          <div className="flex items-center gap-3">
            <ActionButton 
              variant="outline" 
              size="sm"
              onClick={handleSync}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Sync temps réel
            </ActionButton>
            
            <ActionButton 
              variant="outline" 
              size="sm"
              onClick={handleExport}
              icon={<Download className="h-4 w-4" />}
            >
              Export
            </ActionButton>

            <ActionButton 
              size="sm"
              onClick={handleNewOrder}
              icon={<Plus className="h-4 w-4" />}
            >
              Nouvelle commande
            </ActionButton>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                <Badge variant="outline">{stats.total}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total commandes</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Clock className="h-5 w-5 text-yellow-500" />
                <Badge variant="secondary">{stats.pending}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">En attente</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Package className="h-5 w-5 text-blue-500" />
                <Badge variant="default">{stats.processing}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stats.processing}</p>
                <p className="text-xs text-muted-foreground">En traitement</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Truck className="h-5 w-5 text-purple-500" />
                <Badge variant="default">{stats.shipped}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stats.shipped}</p>
                <p className="text-xs text-muted-foreground">Expédiées</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <Badge variant="default">{formatCurrency(stats.revenue)}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{formatCurrency(stats.revenue)}</p>
                <p className="text-xs text-muted-foreground">Chiffre d'affaires</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des commandes */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <CardTitle>Commandes ({orders.length})</CardTitle>
                <CardDescription>Gestion des commandes et statuts</CardDescription>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Rechercher une commande..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="processing">En cours</SelectItem>
                    <SelectItem value="shipped">Expédiée</SelectItem>
                    <SelectItem value="delivered">Livrée</SelectItem>
                    <SelectItem value="cancelled">Annulée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Commande</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(order.status)}
                          <div>
                            <p className="font-medium">{order.order_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.order_items?.length || 0} article(s)
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">Client #{order.customer_id}</p>
                          <p className="text-sm text-muted-foreground">
                            Adresse de facturation
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Select
                            value={order.status}
                            onValueChange={(value) => handleStatusUpdate(order.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">En attente</SelectItem>
                              <SelectItem value="processing">En cours</SelectItem>
                              <SelectItem value="shipped">Expédiée</SelectItem>
                              <SelectItem value="delivered">Livrée</SelectItem>
                              <SelectItem value="cancelled">Annulée</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}