import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Search, 
  Download, 
  Eye,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ShoppingCart,
  MoreHorizontal
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useOrdersUnified, UnifiedOrder } from '@/hooks/unified'

type Order = UnifiedOrder
import { format } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'

export function OrdersTable() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { orders, isLoading, update: updateOrderStatus } = useOrdersUnified()

  // Filtrer les commandes
  const filteredOrders = orders.filter(order => {
    const matchesSearch = !search || 
      order.order_number.toLowerCase().includes(search.toLowerCase()) ||
      order.id.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = !statusFilter || statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const formatPrice = (price: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(price)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { 
        label: 'En attente', 
        variant: 'secondary' as const, 
        icon: Clock,
        color: 'text-yellow-600'
      },
      processing: { 
        label: 'En cours', 
        variant: 'default' as const, 
        icon: Package,
        color: 'text-blue-600'
      },
      shipped: { 
        label: 'Expédiée', 
        variant: 'default' as const, 
        icon: Truck,
        color: 'text-purple-600'
      },
      delivered: { 
        label: 'Livrée', 
        variant: 'default' as const, 
        icon: CheckCircle,
        color: 'text-success'
      },
      cancelled: { 
        label: 'Annulée', 
        variant: 'destructive' as const, 
        icon: XCircle,
        color: 'text-destructive'
      }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrderStatus({ id: orderId, updates: { status: newStatus } })
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Commandes ({filteredOrders.length})
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter commandes
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtres et recherche */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher par numéro de commande..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="processing">En cours</SelectItem>
              <SelectItem value="shipped">Expédiée</SelectItem>
              <SelectItem value="delivered">Livrée</SelectItem>
              <SelectItem value="cancelled">Annulée</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tableau des commandes */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Commande</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Paiement</TableHead>
                <TableHead>Suivi</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">#{order.order_number}</div>
                      <div className="text-sm text-muted-foreground">
                        {order.id.substring(0, 8)}...
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(order.created_at), 'dd MMM yyyy', { locale: getDateFnsLocale() })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(order.created_at), 'HH:mm', { locale: getDateFnsLocale() })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {order.shipping_address?.first_name} {order.shipping_address?.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {order.shipping_address?.email || 'N/A'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(order.total_amount, order.currency)}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(value) => handleStatusChange(order.id, value as Order['status'])}
                    >
                      <SelectTrigger className="w-32 h-8">
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
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={order.payment_status === 'paid' ? 'default' : 'secondary'}
                      className={order.payment_status === 'paid' ? 'bg-success text-success-foreground' : ''}
                    >
                      {order.payment_status === 'paid' ? 'Payé' : 
                       order.payment_status === 'pending' ? 'En attente' :
                       order.payment_status === 'failed' ? 'Échoué' : 'Remboursé'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {order.tracking_number ? (
                      <div className="text-sm">
                        <div className="font-medium">{order.tracking_number}</div>
                        <div className="text-muted-foreground">{order.carrier}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Pas de suivi</span>
                    )}
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
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Facture PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Package className="h-4 w-4 mr-2" />
                          Étiquette d'expédition
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-8">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">Aucune commande trouvée</h3>
            <p className="text-muted-foreground">
              {search || statusFilter 
                ? "Essayez de modifier vos filtres"
                : "Vos commandes apparaîtront ici"
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}