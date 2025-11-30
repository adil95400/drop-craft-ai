import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useFulfillmentShipments } from '@/hooks/useFulfillmentShipments'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Package, TruckIcon, Search, RefreshCw, FileText, CheckCircle, Clock, XCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function FulfillmentDashboardPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  const { 
    shipments, 
    isLoading, 
    refetch,
    syncTracking,
    isSyncing,
    generateLabels,
    isGenerating
  } = useFulfillmentShipments(
    statusFilter !== 'all' ? { status: statusFilter } : undefined
  )

  const stats = {
    total: shipments?.length || 0,
    in_transit: shipments?.filter(s => s.status === 'in_transit').length || 0,
    delivered: shipments?.filter(s => s.status === 'delivered').length || 0,
    pending: shipments?.filter(s => s.status === 'created' || s.status === 'printed').length || 0,
  }

  const filteredShipments = shipments?.filter(shipment =>
    shipment.tracking_number.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'created': return <Clock className="w-4 h-4" />
      case 'printed': return <FileText className="w-4 h-4" />
      case 'picked_up': return <Package className="w-4 h-4" />
      case 'in_transit': return <TruckIcon className="w-4 h-4" />
      case 'delivered': return <CheckCircle className="w-4 h-4" />
      case 'failed': return <XCircle className="w-4 h-4" />
      default: return <Package className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      created: 'bg-muted text-muted-foreground',
      printed: 'bg-blue-500/10 text-blue-500',
      picked_up: 'bg-purple-500/10 text-purple-500',
      in_transit: 'bg-yellow-500/10 text-yellow-500',
      delivered: 'bg-green-500/10 text-green-500',
      failed: 'bg-red-500/10 text-red-500',
    }
    return colors[status] || 'bg-muted'
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fulfillment & Expéditions</h1>
          <p className="text-muted-foreground">Gérez vos expéditions et suivez vos colis</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Expéditions</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">En Transit</p>
              <p className="text-2xl font-bold text-yellow-500">{stats.in_transit}</p>
            </div>
            <TruckIcon className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Livrées</p>
              <p className="text-2xl font-bold text-green-500">{stats.delivered}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">En Attente</p>
              <p className="text-2xl font-bold text-blue-500">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par numéro de suivi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="created">Créées</SelectItem>
              <SelectItem value="printed">Étiquettes imprimées</SelectItem>
              <SelectItem value="picked_up">Récupérées</SelectItem>
              <SelectItem value="in_transit">En transit</SelectItem>
              <SelectItem value="delivered">Livrées</SelectItem>
              <SelectItem value="failed">Échec</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement des expéditions...
          </div>
        ) : filteredShipments?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucune expédition trouvée
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro de suivi</TableHead>
                <TableHead>Transporteur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShipments?.map((shipment) => (
                <TableRow key={shipment.id}>
                  <TableCell className="font-medium">
                    {shipment.tracking_number}
                  </TableCell>
                  <TableCell>
                    {shipment.carrier?.carrier_name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(shipment.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(shipment.status)}
                        {shipment.status}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {shipment.shipping_address?.city}, {shipment.shipping_address?.country}
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(shipment.created_at), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => syncTracking(shipment.id)}
                        disabled={isSyncing}
                      >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                      </Button>
                      {shipment.label_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(shipment.label_url, '_blank')}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
