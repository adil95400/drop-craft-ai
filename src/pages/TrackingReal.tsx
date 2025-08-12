import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, Package, CheckCircle2, Clock, AlertTriangle, Search, Filter, Download, RefreshCw, Plus, Eye, Edit, MoreHorizontal, AlertCircle, MapPin, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { useRealOrders } from '@/hooks/useRealOrders'
import { LoadingState } from '@/components/common/LoadingState'
import { EmptyState } from '@/components/common/EmptyState'
import { ActionButton } from '@/components/common/ActionButton'
import { useToast } from '@/hooks/use-toast'

export default function TrackingReal() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const { 
    orders, 
    stats, 
    isLoading, 
    error,
    updateOrderStatus,
    isUpdating
  } = useRealOrders({ 
    search: searchTerm,
    status: statusFilter === 'all' ? undefined : statusFilter
  })

  if (isLoading) return <LoadingState />
  if (error) return <div>Erreur lors du chargement des commandes</div>

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
        return <Package className="h-4 w-4" />
    }
  }

  const handleExport = () => {
    toast({
      title: "Export",
      description: "Export des données en cours...",
    })
  }

  const handleTrackingToday = () => {
    navigate('/tracking/today')
  }

  const handleTrackingInTransit = () => {
    navigate('/tracking/in-transit')
  }

  const handleUltraPro = () => {
    navigate('/tracking-ultra-pro')
  }

  if (orders.length === 0) {
    return (
      <EmptyState 
        title="Aucune commande à suivre"
        description="Il n'y a actuellement aucune commande à suivre"
        action={{
          label: "Voir toutes les commandes",
          onClick: () => navigate('/orders')
        }}
      />
    )
  }

  // Filtrer les commandes qui nécessitent un suivi
  const trackableOrders = orders.filter(order => 
    ['processing', 'shipped'].includes(order.status)
  )

  return (
    <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Suivi des Commandes</h1>
            <p className="text-muted-foreground">Suivi en temps réel des expéditions et livraisons</p>
          </div>
          
          <div className="flex items-center gap-3">
            <ActionButton 
              variant="outline" 
              size="sm"
              onClick={handleTrackingToday}
              icon={<Clock className="h-4 w-4" />}
            >
              Livraisons du jour
            </ActionButton>
            
            <ActionButton 
              variant="outline" 
              size="sm"
              onClick={handleTrackingInTransit}
              icon={<Truck className="h-4 w-4" />}
            >
              En transit
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
              onClick={handleUltraPro}
              icon={<BarChart3 className="h-4 w-4" />}
            >
              Tracking Ultra Pro
            </ActionButton>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <Badge variant="default">{stats.delivered}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stats.delivered}</p>
                <p className="text-xs text-muted-foreground">Livrées</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
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
        </div>

        {/* Liste des commandes à suivre */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <CardTitle>Commandes à suivre ({trackableOrders.length})</CardTitle>
                <CardDescription>Suivi des commandes en cours de traitement et d'expédition</CardDescription>
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
                    <SelectItem value="processing">En cours</SelectItem>
                    <SelectItem value="shipped">Expédiée</SelectItem>
                    <SelectItem value="delivered">Livrée</SelectItem>
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
                    <TableHead>Suivi</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trackableOrders.map((order) => (
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
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        {order.tracking_number ? (
                          <Badge variant="outline" className="font-mono text-xs">
                            {order.tracking_number}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Non disponible</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <MapPin className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
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