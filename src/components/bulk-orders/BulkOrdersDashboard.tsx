/**
 * Bulk Orders Dashboard
 * Interface principale pour les commandes groupées
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  useBulkSupplierOrders, 
  useBulkSupplierOrdersStats,
  useDeleteBulkSupplierOrder,
  useSubmitBulkSupplierOrder
} from '@/hooks/useBulkSupplierOrders';
import { 
  Package, Plus, Search, Trash2, Send, Eye,
  ShoppingCart, Clock, CheckCircle, Truck, XCircle,
  DollarSign, Layers, RefreshCw, FileText
} from 'lucide-react';
import { BulkOrderCard } from './BulkOrderCard';
import { CreateBulkOrderDialog } from './CreateBulkOrderDialog';
import { BulkOrderDetailModal } from './BulkOrderDetailModal';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', color: 'bg-gray-500', icon: FileText },
  pending: { label: 'En attente', color: 'bg-yellow-500', icon: Clock },
  processing: { label: 'Traitement', color: 'bg-blue-500', icon: RefreshCw },
  shipped: { label: 'Expédiée', color: 'bg-purple-500', icon: Truck },
  completed: { label: 'Terminée', color: 'bg-green-500', icon: CheckCircle },
  cancelled: { label: 'Annulée', color: 'bg-red-500', icon: XCircle },
};

export function BulkOrdersDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data: orders = [], isLoading: isLoadingOrders } = useBulkSupplierOrders(statusFilter);
  const { data: stats, isLoading: isLoadingStats } = useBulkSupplierOrdersStats();

  // Filter orders by search
  const filteredOrders = orders.filter(o => 
    o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.name && o.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {isLoadingStats ? (
          Array(5).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.total_orders || 0}</p>
                    <p className="text-xs text-muted-foreground">Commandes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <FileText className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.draft_orders || 0}</p>
                    <p className="text-xs text-muted-foreground">Brouillons</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.pending_orders || 0}</p>
                    <p className="text-xs text-muted-foreground">En attente</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Layers className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.total_items || 0}</p>
                    <p className="text-xs text-muted-foreground">Produits</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {(stats?.total_value || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0 })}€
                    </p>
                    <p className="text-xs text-muted-foreground">Valeur totale</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par numéro ou nom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${config.color}`} />
                    {config.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Commande
        </Button>
      </div>

      {/* Orders List */}
      {isLoadingOrders ? (
        <div className="grid gap-4">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Aucune commande groupée</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Créez une commande groupée pour commander plusieurs produits en une fois
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une commande
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => (
            <BulkOrderCard 
              key={order.id}
              order={order}
              onView={() => setSelectedOrderId(order.id)}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreateBulkOrderDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      {/* Detail Modal */}
      {selectedOrderId && (
        <BulkOrderDetailModal
          orderId={selectedOrderId}
          open={!!selectedOrderId}
          onOpenChange={(open) => !open && setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}
