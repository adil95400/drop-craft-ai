/**
 * Interface moderne des commandes inspirée des concurrents
 * Table avec statuts, tracking et détails
 */
import React, { useState, useEffect } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  ShoppingCart,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreVertical,
  Eye,
  Edit,
  Download,
  TrendingUp,
  DollarSign,
  Activity
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useLegacyPlan } from '@/lib/migration-helper'

interface Order {
  id: string
  order_number: string
  customer_name?: string
  total_amount: number
  currency: string
  status: string
  payment_status?: string
  shipping_status?: string
  tracking_number?: string
  created_at: string
  updated_at: string
  customer_jsonb?: any
}

export default function ModernOrders() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { isPro, isUltraPro } = useLegacyPlan()
  
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    // Pour l'instant, données mockées
    // fetchOrders()
    setOrders([
      {
        id: '1',
        order_number: 'CMD-2024-001',
        customer_name: 'Jean Dupont',
        total_amount: 89.99,
        currency: 'EUR',
        status: 'completed',
        payment_status: 'paid',
        shipping_status: 'delivered',
        tracking_number: 'FR123456789',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ])
    setLoading(false)
  }, [user])

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
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
    const variants = {
      pending: { variant: 'outline' as const, label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      processing: { variant: 'default' as const, label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: Package },
      shipped: { variant: 'secondary' as const, label: 'Expédiée', color: 'bg-purple-100 text-purple-800', icon: Truck },
      delivered: { variant: 'default' as const, label: 'Livrée', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { variant: 'destructive' as const, label: 'Annulée', color: 'bg-red-100 text-red-800', icon: AlertCircle },
      completed: { variant: 'default' as const, label: 'Terminée', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    }
    
    const config = variants[status as keyof typeof variants] || variants.pending
    const IconComponent = config.icon
    
    return (
      <Badge variant={config.variant} className={`${config.color} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "order_number",
      header: "Commande",
      cell: ({ row }) => {
        const order = row.original
        return (
          <div className="space-y-1 min-w-[120px]">
            <div className="font-medium text-sm">{order.order_number}</div>
            <div className="text-xs text-muted-foreground">
              {formatDate(order.created_at)}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "customer_name",
      header: "Client",
      cell: ({ row }) => {
        const customerName = row.original.customer_name || 'Client invité'
        return (
          <div className="font-medium text-sm">{customerName}</div>
        )
      },
    },
    {
      accessorKey: "total_amount",
      header: "Montant",
      cell: ({ row }) => {
        const order = row.original
        return (
          <div className="text-right font-medium">
            {formatCurrency(order.total_amount, order.currency)}
          </div>
        )
      },
    },
    {
      accessorKey: "payment_status",
      header: "Paiement",
      cell: ({ row }) => {
        const status = row.original.payment_status || 'pending'
        const statusConfig = {
          paid: { label: 'Payé', color: 'bg-green-100 text-green-800' },
          pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
          failed: { label: 'Échoué', color: 'bg-red-100 text-red-800' },
          refunded: { label: 'Remboursé', color: 'bg-gray-100 text-gray-800' }
        }
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
        
        return (
          <Badge variant="outline" className={config.color}>
            {config.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Statut",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      accessorKey: "tracking_number",
      header: "Suivi",
      cell: ({ row }) => {
        const tracking = row.original.tracking_number
        return tracking ? (
          <div className="flex items-center space-x-1">
            <Truck className="h-3 w-3 text-muted-foreground" />
            <span className="font-mono text-xs">{tracking}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const order = row.original
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Ouvrir menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                <Eye className="mr-2 h-4 w-4" />
                Voir détails
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Modifier statut
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Facture PDF
              </DropdownMenuItem>
              {order.tracking_number && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Truck className="mr-2 h-4 w-4" />
                    Suivi colis
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  // Stats mockées
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    totalRevenue: orders.reduce((sum, o) => sum + o.total_amount, 0)
  }

  const filters = (
    <>
      <Select defaultValue="all">
        <SelectTrigger className="h-8 w-[150px]">
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
      
      <Select defaultValue="all">
        <SelectTrigger className="h-8 w-[150px]">
          <SelectValue placeholder="Paiement" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous paiements</SelectItem>
          <SelectItem value="paid">Payé</SelectItem>
          <SelectItem value="pending">En attente</SelectItem>
          <SelectItem value="failed">Échoué</SelectItem>
        </SelectContent>
      </Select>
    </>
  )

  const toolbar = (
    <>
      <Button variant="outline" size="sm">
        <Download className="mr-2 h-4 w-4" />
        Exporter
      </Button>
    </>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header moderne */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commandes</h1>
          <p className="text-muted-foreground">
            Gérez vos {stats.total} commandes et leur statut
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isUltraPro && (
            <Button variant="outline" size="sm">
              <TrendingUp className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          )}
        </div>
      </div>

      {/* KPIs modernes */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              +12% ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              +23% vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Nécessitent attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Cours</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
            <p className="text-xs text-muted-foreground">
              En traitement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table moderne avec DataTable */}
      <Card>
        <CardHeader>
          <CardTitle>Gestion des commandes</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={orders}
            searchKey="order_number"
            searchPlaceholder="Rechercher une commande..."
            filters={filters}
            toolbar={toolbar}
          />
        </CardContent>
      </Card>

      {/* Dialog de détails commande */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Commande {selectedOrder.order_number}
              </DialogTitle>
              <DialogDescription>
                Détails complets de la commande
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Informations générales</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Numéro:</span>
                      <span className="font-mono">{selectedOrder.order_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Client:</span>
                      <span>{selectedOrder.customer_name || 'Client invité'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Montant:</span>
                      <span className="font-medium">{formatCurrency(selectedOrder.total_amount, selectedOrder.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{formatDate(selectedOrder.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Statuts</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Commande:</span>
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                    {selectedOrder.payment_status && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Paiement:</span>
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          {selectedOrder.payment_status}
                        </Badge>
                      </div>
                    )}
                    {selectedOrder.tracking_number && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Suivi:</span>
                        <span className="font-mono text-xs">{selectedOrder.tracking_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}