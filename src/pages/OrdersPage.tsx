import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useDataExport } from '@/hooks/useDataExport'
import { useNavigate } from 'react-router-dom'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Package, Search, Filter, Eye, Edit, Download, TruckIcon, Plus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ShipmentCreationDialog } from '@/components/fulfillment/ShipmentCreationDialog'

export default function OrdersPage() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const { exportData, isExporting } = useDataExport()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [shipmentDialogOpen, setShipmentDialogOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const handleCreateShipment = (orderId: string) => {
    setSelectedOrderId(orderId)
    setShipmentDialogOpen(true)
  }

  const handleExport = async () => {
    await exportData('orders', 'csv')
  }

  const handleViewOrder = (orderId: string) => {
    navigate(`/orders/${orderId}`)
  }

  const handleEditOrder = (orderId: string) => {
    navigate(`/orders/${orderId}/edit`)
  }

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })

  const filteredOrders = orders?.filter(order =>
    order.order_number.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-500',
      processing: 'bg-blue-500/10 text-blue-500',
      shipped: 'bg-purple-500/10 text-purple-500',
      delivered: 'bg-green-500/10 text-green-500',
      cancelled: 'bg-red-500/10 text-red-500',
    }
    return colors[status] || 'bg-muted text-muted-foreground'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      processing: 'Traitement',
      shipped: 'Expédié',
      delivered: 'Livré',
      cancelled: 'Annulé',
    }
    return labels[status] || status
  }

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Commandes</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Gérez et suivez vos commandes</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport} 
              disabled={isExporting}
              className="flex-1 xs:flex-none"
            >
              <Download className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{isExporting ? 'Export...' : 'Exporter'}</span>
              <span className="sm:hidden">CSV</span>
            </Button>
            <Button size="sm" onClick={() => navigate('/orders/new')} className="flex-1 xs:flex-none">
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Nouvelle commande</span>
              <span className="sm:hidden">Nouveau</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par n° commande..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="processing">Traitement</SelectItem>
              <SelectItem value="shipped">Expédié</SelectItem>
              <SelectItem value="delivered">Livré</SelectItem>
              <SelectItem value="cancelled">Annulé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Chargement...
          </div>
        ) : filteredOrders?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Aucune commande trouvée
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Commande</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Expédition</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders?.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.total_amount} {order.currency}</TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        {(order.status === 'processing' || order.status === 'shipped') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCreateShipment(order.id)}
                          >
                            <TruckIcon className="w-4 h-4 mr-1" />
                            Expédier
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewOrder(order.id)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditOrder(order.id)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {filteredOrders?.map((order) => (
                <Card key={order.id} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{order.order_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} text-[10px] flex-shrink-0`}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {order.total_amount} {order.currency}
                    </span>
                    <div className="flex gap-1">
                      {(order.status === 'processing' || order.status === 'shipped') && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleCreateShipment(order.id)}
                        >
                          <TruckIcon className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => handleViewOrder(order.id)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => handleEditOrder(order.id)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </Card>

      {selectedOrderId && (
        <ShipmentCreationDialog
          open={shipmentDialogOpen}
          onOpenChange={setShipmentDialogOpen}
          orderId={selectedOrderId}
        />
      )}
    </div>
  )
}
