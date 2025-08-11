import { useState } from 'react'
import { Package, Truck, MapPin, Clock, Search, Filter, Eye, Crown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { useOrders } from '@/hooks/useOrders'
import { Link } from 'react-router-dom'

const trackingSteps = [
  { id: 'pending', label: 'En attente', icon: Clock },
  { id: 'processing', label: 'Traitement', icon: Package },
  { id: 'shipped', label: 'Expédié', icon: Truck },
  { id: 'delivered', label: 'Livré', icon: MapPin }
]

const getStatusProgress = (status: string): number => {
  const statusMap: { [key: string]: number } = {
    'pending': 25,
    'processing': 50,
    'shipped': 75,
    'delivered': 100,
    'cancelled': 0
  }
  return statusMap[status] || 0
}

const getStatusColor = (status: string): string => {
  const colorMap: { [key: string]: string } = {
    'pending': 'bg-warning',
    'processing': 'bg-primary',
    'shipped': 'bg-accent',
    'delivered': 'bg-success',
    'cancelled': 'bg-destructive'
  }
  return colorMap[status] || 'bg-muted'
}

export default function Tracking() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { orders, stats, isLoading } = useOrders()

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Chargement du suivi des commandes...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Truck className="w-8 h-8 text-primary" />
            Suivi des Commandes
          </h1>
          <p className="text-muted-foreground mt-2">
            Suivez l'état et la livraison de toutes vos commandes en temps réel
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtres
          </Button>
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            Vue Temps Réel
          </Button>
          <Link to="/tracking-ultra-pro">
            <Button 
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              <Crown className="w-4 h-4 mr-2" />
              Tracking Ultra Pro
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commandes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Transit</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.shipped || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Livrées</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Tracking List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Commande #{order.order_number}</CardTitle>
                  <CardDescription>
                    {order.tracking_number && (
                      <span>Tracking: {order.tracking_number}</span>
                    )}
                    {!order.tracking_number && (
                      <span>Pas encore de numéro de suivi</span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={order.status === 'delivered' ? 'default' : 'secondary'}
                    className={`${getStatusColor(order.status)} text-white`}
                  >
                    {order.status === 'pending' && 'En attente'}
                    {order.status === 'processing' && 'En traitement'}
                    {order.status === 'shipped' && 'Expédié'}
                    {order.status === 'delivered' && 'Livré'}
                    {order.status === 'cancelled' && 'Annulé'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {order.total_amount.toLocaleString('fr-FR')}€
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progression</span>
                    <span>{getStatusProgress(order.status)}%</span>
                  </div>
                  <Progress value={getStatusProgress(order.status)} />
                </div>

                {/* Tracking Steps */}
                <div className="flex justify-between items-center relative">
                  {trackingSteps.map((step, index) => {
                    const isActive = getStatusProgress(order.status) >= (index + 1) * 25
                    const Icon = step.icon
                    
                    return (
                      <div key={step.id} className="flex flex-col items-center space-y-1">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center
                          ${isActive 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground'
                          }
                        `}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className={`text-xs ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {step.label}
                        </span>
                      </div>
                    )
                  })}
                  
                  {/* Connection Line */}
                  <div className="absolute top-4 left-4 right-4 h-0.5 bg-muted -z-10">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${getStatusProgress(order.status)}%` }}
                    />
                  </div>
                </div>

                {/* Order Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <span className="text-sm text-muted-foreground">Date de commande</span>
                    <p className="font-medium">
                      {new Date(order.created_at || '').toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Statut</span>
                    <p className="font-medium">
                      {order.status === 'pending' && 'En attente'}
                      {order.status === 'processing' && 'En traitement'}
                      {order.status === 'shipped' && 'Expédié'}
                      {order.status === 'delivered' && 'Livré'}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Voir Détails
                  </Button>
                  {order.tracking_number && (
                    <Button variant="outline" size="sm">
                      <Truck className="h-4 w-4 mr-2" />
                      Suivre le Colis
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredOrders.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Aucune commande trouvée avec ces filtres'
                  : 'Aucune commande pour le moment'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}