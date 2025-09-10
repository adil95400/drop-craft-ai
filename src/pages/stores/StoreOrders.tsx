import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Truck,
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  customer: {
    name: string
    email: string
  }
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  items: number
  paymentStatus: 'paid' | 'pending' | 'failed'
  shippingMethod: string
  createdAt: string
}

const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'CMD-2024-001',
    customer: {
      name: 'Marie Dubois',
      email: 'marie.dubois@email.com'
    },
    status: 'delivered',
    total: 129.99,
    items: 2,
    paymentStatus: 'paid',
    shippingMethod: 'Colissimo',
    createdAt: '2024-01-10T14:30:00Z'
  },
  {
    id: '2',
    orderNumber: 'CMD-2024-002',
    customer: {
      name: 'Pierre Martin',
      email: 'pierre.martin@email.com'
    },
    status: 'shipped',
    total: 89.50,
    items: 1,
    paymentStatus: 'paid',
    shippingMethod: 'Chronopost',
    createdAt: '2024-01-10T10:15:00Z'
  },
  {
    id: '3',
    orderNumber: 'CMD-2024-003',
    customer: {
      name: 'Sophie Laurent',
      email: 'sophie.laurent@email.com'
    },
    status: 'processing',
    total: 245.00,
    items: 3,
    paymentStatus: 'paid',
    shippingMethod: 'DPD',
    createdAt: '2024-01-10T09:45:00Z'
  },
  {
    id: '4',
    orderNumber: 'CMD-2024-004',
    customer: {
      name: 'Thomas Moreau',
      email: 'thomas.moreau@email.com'
    },
    status: 'pending',
    total: 59.99,
    items: 1,
    paymentStatus: 'pending',
    shippingMethod: 'Colissimo',
    createdAt: '2024-01-10T08:20:00Z'
  }
]

const orderStatusColors = {
  pending: 'bg-warning text-warning-foreground',
  processing: 'bg-blue-500 text-white',
  shipped: 'bg-indigo-500 text-white',
  delivered: 'bg-success text-success-foreground',
  cancelled: 'bg-destructive text-destructive-foreground'
}

const orderStatusLabels = {
  pending: 'En attente',
  processing: 'En traitement',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée'
}

const paymentStatusColors = {
  paid: 'bg-success text-success-foreground',
  pending: 'bg-warning text-warning-foreground',
  failed: 'bg-destructive text-destructive-foreground'
}

const paymentStatusLabels = {
  paid: 'Payée',
  pending: 'En attente',
  failed: 'Échouée'
}

export function StoreOrders() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')

  const filteredOrders = mockOrders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const orderStatuses = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled']

  // Calcul des statistiques
  const totalOrders = mockOrders.length
  const totalRevenue = mockOrders.reduce((sum, order) => sum + order.total, 0)
  const pendingOrders = mockOrders.filter(o => o.status === 'pending').length
  const processingOrders = mockOrders.filter(o => o.status === 'processing').length

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total commandes</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Chiffre d'affaires</p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-warning">{pendingOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Truck className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">En traitement</p>
                <p className="text-2xl font-bold text-blue-500">{processingOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des commandes */}
      <Card>
        <CardHeader>
          <CardTitle>Commandes récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro, client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Statut
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {orderStatuses.map(status => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                  >
                    {status === 'all' ? 'Tous les statuts' : orderStatusLabels[status as keyof typeof orderStatusLabels]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Articles</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="font-mono font-medium">
                        {order.orderNumber}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {order.shippingMethod}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.customer.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={orderStatusColors[order.status]}>
                        {orderStatusLabels[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={paymentStatusColors[order.paymentStatus]}>
                        {paymentStatusLabels[order.paymentStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell>{order.items} articles</TableCell>
                    <TableCell className="text-sm">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Truck className="mr-2 h-4 w-4" />
                            Expédier
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <XCircle className="mr-2 h-4 w-4" />
                            Annuler
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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