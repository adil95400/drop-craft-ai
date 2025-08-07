import { useState } from 'react'
import { MapPin, Clock, Truck, Package, Search, Filter, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'

interface ShipmentInTransit {
  id: string
  orderNumber: string
  customerName: string
  trackingNumber: string
  carrier: string
  currentLocation: string
  destination: string
  estimatedDelivery: string
  progress: number
  lastUpdate: string
  status: 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delayed'
}

const mockShipments: ShipmentInTransit[] = [
  {
    id: '1',
    orderNumber: '#ORD-2024-001',
    customerName: 'Marie Dubois',
    trackingNumber: 'FR123456789',
    carrier: 'Colissimo',
    currentLocation: 'Centre de tri Lyon',
    destination: 'Paris 15ème',
    estimatedDelivery: '2024-01-16T14:00:00',
    progress: 75,
    lastUpdate: '2024-01-15T10:30:00',
    status: 'in_transit'
  },
  {
    id: '2',
    orderNumber: '#ORD-2024-002',
    customerName: 'Pierre Martin',
    trackingNumber: 'UPS987654321',
    carrier: 'UPS',
    currentLocation: 'Dépôt Marseille',
    destination: 'Nice',
    estimatedDelivery: '2024-01-16T16:30:00',
    progress: 60,
    lastUpdate: '2024-01-15T08:45:00',
    status: 'in_transit'
  },
  {
    id: '3',
    orderNumber: '#ORD-2024-003',
    customerName: 'Sophie Bernard',
    trackingNumber: 'DHL456789123',
    carrier: 'DHL',
    currentLocation: 'En livraison - Tournée 23',
    destination: 'Bordeaux',
    estimatedDelivery: '2024-01-15T17:00:00',
    progress: 90,
    lastUpdate: '2024-01-15T13:15:00',
    status: 'out_for_delivery'
  },
  {
    id: '4',
    orderNumber: '#ORD-2024-004',
    customerName: 'Lucas Petit',
    trackingNumber: 'CHR789123456',
    carrier: 'Chronopost',
    currentLocation: 'Retardé - Conditions météo',
    destination: 'Strasbourg',
    estimatedDelivery: '2024-01-17T11:00:00',
    progress: 40,
    lastUpdate: '2024-01-15T09:20:00',
    status: 'delayed'
  }
]

export default function TrackingInTransit() {
  const [shipments, setShipments] = useState(mockShipments)
  const [searchTerm, setSearchTerm] = useState('')
  const [carrierFilter, setCarrierFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = shipment.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCarrier = carrierFilter === 'all' || shipment.carrier === carrierFilter
    const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter
    return matchesSearch && matchesCarrier && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'picked_up': return 'bg-blue-100 text-blue-800'
      case 'in_transit': return 'bg-orange-100 text-orange-800'
      case 'out_for_delivery': return 'bg-green-100 text-green-800'
      case 'delayed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'picked_up': return 'Collecté'
      case 'in_transit': return 'En transit'
      case 'out_for_delivery': return 'En cours de livraison'
      case 'delayed': return 'Retardé'
      default: return 'Inconnu'
    }
  }

  const stats = {
    totalInTransit: shipments.length,
    outForDelivery: shipments.filter(s => s.status === 'out_for_delivery').length,
    delayed: shipments.filter(s => s.status === 'delayed').length,
    deliveryToday: shipments.filter(s => new Date(s.estimatedDelivery).toDateString() === new Date().toDateString()).length
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Colis en Transit</h1>
          <p className="text-muted-foreground">Suivi en temps réel des colis en cours de livraison</p>
        </div>
        <Button className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Truck className="h-4 w-4 text-blue-500" />
              En Transit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInTransit}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-green-500" />
              En Livraison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.outForDelivery}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-red-500" />
              Retardés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delayed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-orange-500" />
              Livraison Aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.deliveryToday}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une commande..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={carrierFilter} onValueChange={setCarrierFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Transporteur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les transporteurs</SelectItem>
            <SelectItem value="Colissimo">Colissimo</SelectItem>
            <SelectItem value="UPS">UPS</SelectItem>
            <SelectItem value="DHL">DHL</SelectItem>
            <SelectItem value="Chronopost">Chronopost</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="picked_up">Collecté</SelectItem>
            <SelectItem value="in_transit">En transit</SelectItem>
            <SelectItem value="out_for_delivery">En livraison</SelectItem>
            <SelectItem value="delayed">Retardé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Shipments List */}
      <div className="space-y-4">
        {filteredShipments.map((shipment) => (
          <Card key={shipment.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{shipment.orderNumber}</h3>
                    <Badge className={getStatusColor(shipment.status)}>
                      {getStatusText(shipment.status)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    {shipment.customerName} • {shipment.carrier} • {shipment.trackingNumber}
                  </div>
                </div>
                <Button size="sm" variant="outline">Voir Détails</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Position actuelle:</span>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">{shipment.currentLocation}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Destination:</span>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">{shipment.destination}</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progression de la livraison</span>
                  <span className="text-sm text-muted-foreground">{shipment.progress}%</span>
                </div>
                <Progress value={shipment.progress} className="h-2" />
              </div>

              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Dernière MAJ: {new Date(shipment.lastUpdate).toLocaleDateString('fr-FR')} à {new Date(shipment.lastUpdate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Livraison prévue:</span>
                  <span className={new Date(shipment.estimatedDelivery) < new Date() ? 'text-red-600 font-medium' : ''}>
                    {new Date(shipment.estimatedDelivery).toLocaleDateString('fr-FR')} à {new Date(shipment.estimatedDelivery).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredShipments.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun colis en transit</h3>
            <p className="text-muted-foreground">Tous les colis sont livrés ou en attente d'expédition</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}