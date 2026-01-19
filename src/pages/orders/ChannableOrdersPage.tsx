/**
 * Page Commandes avec design Channable
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useDataExport } from '@/hooks/useDataExport'
import { 
  ChannablePageLayout,
  ChannableStatsGrid,
  ChannableSearchBar,
  ChannableCategoryFilter,
  ChannableCard,
  ChannableEmptyState,
  ChannableQuickActions
} from '@/components/channable'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Button } from '@/components/ui/button'
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
  Package, 
  Eye, 
  Edit, 
  Download, 
  TruckIcon, 
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ShoppingCart,
  DollarSign,
  Truck
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ShipmentCreationDialog } from '@/components/fulfillment/ShipmentCreationDialog'

const orderCategories = [
  { id: 'all', label: 'Toutes', icon: Package, count: 0 },
  { id: 'pending', label: 'En attente', icon: Clock, count: 0 },
  { id: 'processing', label: 'Traitement', icon: Loader2, count: 0 },
  { id: 'shipped', label: 'Expédiées', icon: Truck, count: 0 },
  { id: 'delivered', label: 'Livrées', icon: CheckCircle, count: 0 },
  { id: 'cancelled', label: 'Annulées', icon: XCircle, count: 0 },
]

export default function ChannableOrdersPage() {
  const navigate = useNavigate()
  const { exportData, isExporting } = useDataExport()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [shipmentDialogOpen, setShipmentDialogOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['orders', selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (selectedCategory !== 'all') {
        query = query.eq('status', selectedCategory)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    },
  })

  // Calcul des stats
  const stats = [
    {
      label: 'Total Commandes',
      value: orders?.length || 0,
      icon: ShoppingCart,
      trend: '+12%',
      color: 'primary' as const
    },
    {
      label: 'En cours',
      value: orders?.filter(o => ['pending', 'processing'].includes(o.status)).length || 0,
      icon: Clock,
      trend: '+5%',
      color: 'warning' as const
    },
    {
      label: 'Livrées',
      value: orders?.filter(o => o.status === 'delivered').length || 0,
      icon: CheckCircle,
      trend: '+18%',
      color: 'success' as const
    },
    {
      label: 'Chiffre d\'affaires',
      value: `${(orders?.reduce((acc, o) => acc + (o.total_amount || 0), 0) || 0).toFixed(0)}€`,
      icon: DollarSign,
      trend: '+25%',
      color: 'primary' as const
    }
  ]

  // Catégories avec comptages
  const categoriesWithCounts = orderCategories.map(cat => ({
    ...cat,
    count: cat.id === 'all' 
      ? orders?.length || 0 
      : orders?.filter(o => o.status === cat.id).length || 0
  }))

  // Actions rapides
  const quickActions = [
    {
      label: 'Nouvelle commande',
      icon: Plus,
      onClick: () => navigate('/orders/new'),
      variant: 'default' as const
    },
    {
      label: 'Exporter',
      icon: Download,
      onClick: () => exportData('orders', 'csv'),
      variant: 'outline' as const
    }
  ]

  // Filtrage
  const filteredOrders = orders?.filter(order =>
    order.order_number?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
      processing: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      shipped: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
      delivered: 'bg-green-500/10 text-green-600 border-green-500/30',
      cancelled: 'bg-red-500/10 text-red-600 border-red-500/30',
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

  const handleCreateShipment = (orderId: string) => {
    setSelectedOrderId(orderId)
    setShipmentDialogOpen(true)
  }

  return (
    <ChannablePageWrapper
      title="Centre de Commandes"
      description="Gérez, suivez et optimisez toutes vos commandes en un seul endroit"
      heroImage="orders"
      badge={{ label: "Commandes", icon: Package }}
    >

      {/* Stats Grid */}
      <ChannableStatsGrid stats={stats} />

      {/* Quick Actions */}
      <ChannableQuickActions actions={quickActions} />

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <ChannableCategoryFilter
          categories={categoriesWithCounts}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        <ChannableSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Rechercher par n° commande..."
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <ChannableEmptyState
          icon={Package}
          title="Aucune commande trouvée"
          description={searchQuery 
            ? "Aucune commande ne correspond à votre recherche" 
            : "Vos commandes apparaîtront ici une fois créées"
          }
          action={{
            label: 'Créer une commande',
            onClick: () => navigate('/orders/new')
          }}
        />
      ) : (
        <>
          {/* Desktop Table */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="hidden md:block bg-card rounded-xl border shadow-sm overflow-hidden"
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">N° Commande</TableHead>
                  <TableHead className="font-semibold">Statut</TableHead>
                  <TableHead className="font-semibold">Montant</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Expédition</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order, index) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(order.status)} border`}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {order.total_amount?.toFixed(2)} {order.currency}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(order.created_at), { 
                        addSuffix: true,
                        locale: fr 
                      })}
                    </TableCell>
                    <TableCell>
                      {(order.status === 'processing' || order.status === 'pending') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCreateShipment(order.id)}
                          className="group-hover:border-primary group-hover:text-primary transition-colors"
                        >
                          <TruckIcon className="w-4 h-4 mr-1" />
                          Expédier
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate(`/orders/${order.id}`)}
                          className="hover:bg-primary/10 hover:text-primary"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate(`/orders/${order.id}/edit`)}
                          className="hover:bg-primary/10 hover:text-primary"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </motion.div>

          {/* Mobile Cards */}
          <div className="md:hidden grid gap-3">
            {filteredOrders.map((order, index) => (
              <ChannableCard
                key={order.id}
                title={order.order_number}
                description={`${order.total_amount?.toFixed(2)} ${order.currency} - ${formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: fr })}`}
                status={order.status as any}
                badge={{ label: getStatusLabel(order.status) }}
                onClick={() => navigate(`/orders/${order.id}`)}
              />
            ))}
          </div>
        </>
      )}

      {/* Shipment Dialog */}
      {selectedOrderId && (
        <ShipmentCreationDialog
          open={shipmentDialogOpen}
          onOpenChange={setShipmentDialogOpen}
          orderId={selectedOrderId}
        />
      )}
    </ChannablePageWrapper>
  )
}
