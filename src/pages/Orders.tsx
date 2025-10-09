import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Package, Search, Plus, Filter, Download, Eye, Edit, 
  Truck, CreditCard, Clock, CheckCircle, DollarSign
} from 'lucide-react'
import { useOrdersDemo } from '@/hooks/useOrdersDemo'
import { Skeleton } from '@/components/ui/skeleton'

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  
  const { orders, stats, isLoading } = useOrdersDemo({
    status: statusFilter,
    search: searchTerm
  })

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'En attente', variant: 'secondary' },
      processing: { label: 'En cours', variant: 'default' },
      shipped: { label: 'Expédiée', variant: 'default' },
      delivered: { label: 'Livrée', variant: 'default' },
      cancelled: { label: 'Annulée', variant: 'destructive' }
    }
    return statusMap[status] || { label: status, variant: 'default' }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-background p-6">
      <div className="container mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Gestion des Commandes
            </h1>
            <p className="text-muted-foreground mt-2">
              Suivez et gérez toutes vos commandes en temps réel
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nouvelle Commande
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-blue-500/10">
                      <Package className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-green-500/10">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Livrées</p>
                      <p className="text-2xl font-bold">{stats.delivered}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-orange-500/10">
                      <Clock className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">En cours</p>
                      <p className="text-2xl font-bold">{stats.processing}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-purple-500/10">
                      <DollarSign className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">CA Total</p>
                      <p className="text-2xl font-bold">€{stats.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une commande..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filtres
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Aucune commande</h3>
                <p className="text-muted-foreground">Vous n'avez pas encore de commandes.</p>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => {
              const statusInfo = getStatusBadge(order.status)
              return (
                <Card key={order.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${
                          order.status === 'delivered' ? 'bg-green-500/10' :
                          order.status === 'processing' ? 'bg-blue-500/10' :
                          order.status === 'shipped' ? 'bg-purple-500/10' :
                          'bg-gray-500/10'
                        }`}>
                          {order.status === 'delivered' ? (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          ) : order.status === 'shipped' ? (
                            <Truck className="w-6 h-6 text-purple-500" />
                          ) : (
                            <Clock className="w-6 h-6 text-blue-500" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{order.order_number}</h3>
                            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                          </div>
                          <p className="text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xl font-bold">{order.total_amount?.toFixed(2) || 0}€</p>
                        </div>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Eye className="w-4 h-4" />
                          Détails
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}