import { useState } from 'react'
import { Calendar, MapPin, Clock, Truck, Package, Search, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TodayDelivery {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  address: string
  trackingNumber: string
  carrier: string
  timeSlot: string
  status: 'scheduled' | 'out_for_delivery' | 'delivered' | 'failed' | 'rescheduled'
  driverName?: string
  estimatedTime?: string
  notes?: string
}

const mockDeliveries: TodayDelivery[] = [
  {
    id: '1',
    orderNumber: '#ORD-2024-001',
    customerName: 'Marie Dubois',
    customerPhone: '+33 1 23 45 67 89',
    address: '123 Rue de Rivoli, 75001 Paris',
    trackingNumber: 'FR123456789',
    carrier: 'Colissimo',
    timeSlot: '09:00 - 12:00',
    status: 'delivered',
    driverName: 'Jean Dupont',
    estimatedTime: '10:30'
  },
  {
    id: '2',
    orderNumber: '#ORD-2024-002',
    customerName: 'Pierre Martin',
    customerPhone: '+33 6 12 34 56 78',
    address: '45 Avenue des Champs, 75008 Paris',
    trackingNumber: 'UPS987654321',
    carrier: 'UPS',
    timeSlot: '14:00 - 17:00',
    status: 'out_for_delivery',
    driverName: 'Sophie Lemaire',
    estimatedTime: '15:45'
  },
  {
    id: '3',
    orderNumber: '#ORD-2024-003',
    customerName: 'Lucas Petit',
    customerPhone: '+33 7 98 76 54 32',
    address: '78 Rue de la Paix, 75002 Paris',
    trackingNumber: 'DHL456789123',
    carrier: 'DHL',
    timeSlot: '13:00 - 16:00',
    status: 'scheduled',
    notes: 'Code porte: 4567A'
  },
  {
    id: '4',
    orderNumber: '#ORD-2024-004',
    customerName: 'Emma Bernard',
    customerPhone: '+33 9 87 65 43 21',
    address: '12 Boulevard Saint-Michel, 75005 Paris',
    trackingNumber: 'CHR789123456',
    carrier: 'Chronopost',
    timeSlot: '10:00 - 13:00',
    status: 'failed',
    notes: 'Client absent, tentative 2/3'
  },
  {
    id: '5',
    orderNumber: '#ORD-2024-005',
    customerName: 'Thomas Moreau',
    customerPhone: '+33 1 11 22 33 44',
    address: '89 Rue du Faubourg, 75011 Paris',
    trackingNumber: 'REL555666777',
    carrier: 'Relais Colis',
    timeSlot: '16:00 - 19:00',
    status: 'rescheduled',
    notes: 'Report à demain sur demande client'
  }
]

export default function TrackingToday() {
  const [deliveries, setDeliveries] = useState(mockDeliveries)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [carrierFilter, setCarrierFilter] = useState<string>('all')

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = delivery.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.address.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter
    const matchesCarrier = carrierFilter === 'all' || delivery.carrier === carrierFilter
    return matchesSearch && matchesStatus && matchesCarrier
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'out_for_delivery': return 'bg-orange-100 text-orange-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Programmé'
      case 'out_for_delivery': return 'En cours'
      case 'delivered': return 'Livré'
      case 'failed': return 'Échec'
      case 'rescheduled': return 'Reporté'
      default: return 'Inconnu'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4" />
      case 'out_for_delivery': return <Truck className="h-4 w-4" />
      case 'delivered': return <CheckCircle2 className="h-4 w-4" />
      case 'failed': return <AlertTriangle className="h-4 w-4" />
      case 'rescheduled': return <Calendar className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  const stats = {
    totalDeliveries: deliveries.length,
    scheduled: deliveries.filter(d => d.status === 'scheduled').length,
    inProgress: deliveries.filter(d => d.status === 'out_for_delivery').length,
    delivered: deliveries.filter(d => d.status === 'delivered').length,
    failed: deliveries.filter(d => d.status === 'failed').length
  }

  const todayDate = new Date().toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Livraisons du Jour</h1>
          <p className="text-muted-foreground capitalize">{todayDate}</p>
        </div>
        <Button className="gap-2">
          <Calendar className="h-4 w-4" />
          Voir Planning
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-500" />
              Total Aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDeliveries}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              Programmées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Truck className="h-4 w-4 text-orange-500" />
              En Cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Livrées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Échecs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une livraison..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="scheduled">Programmées</SelectItem>
            <SelectItem value="out_for_delivery">En cours</SelectItem>
            <SelectItem value="delivered">Livrées</SelectItem>
            <SelectItem value="failed">Échecs</SelectItem>
            <SelectItem value="rescheduled">Reportées</SelectItem>
          </SelectContent>
        </Select>
        <Select value={carrierFilter} onValueChange={setCarrierFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Transporteur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="Colissimo">Colissimo</SelectItem>
            <SelectItem value="UPS">UPS</SelectItem>
            <SelectItem value="DHL">DHL</SelectItem>
            <SelectItem value="Chronopost">Chronopost</SelectItem>
            <SelectItem value="Relais Colis">Relais Colis</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Deliveries List */}
      <div className="space-y-4">
        {filteredDeliveries.map((delivery) => (
          <Card key={delivery.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(delivery.status)}
                    <h3 className="font-semibold">{delivery.orderNumber}</h3>
                    <Badge className={getStatusColor(delivery.status)}>
                      {getStatusText(delivery.status)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    {delivery.carrier} • {delivery.trackingNumber} • Créneau: {delivery.timeSlot}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Contacter</Button>
                  <Button size="sm" variant="outline">Modifier</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="font-medium text-sm mb-1">Client</div>
                  <div className="text-sm text-muted-foreground">
                    {delivery.customerName}<br />
                    {delivery.customerPhone}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-sm mb-1 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Adresse de livraison
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {delivery.address}
                  </div>
                </div>
              </div>

              {(delivery.driverName || delivery.estimatedTime) && (
                <div className="bg-muted/50 p-3 rounded-md mb-4">
                  <div className="flex justify-between items-center">
                    {delivery.driverName && (
                      <div className="text-sm">
                        <strong>Chauffeur:</strong> {delivery.driverName}
                      </div>
                    )}
                    {delivery.estimatedTime && (
                      <div className="text-sm">
                        <strong>Heure estimée:</strong> {delivery.estimatedTime}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {delivery.notes && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                  <div className="text-sm">
                    <strong>Note:</strong> {delivery.notes}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDeliveries.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune livraison prévue</h3>
            <p className="text-muted-foreground">Aucune livraison programmée pour aujourd'hui</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}