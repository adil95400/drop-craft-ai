import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, Search, Filter, Package, Truck, CheckCircle2,
  Clock, AlertCircle, Download, RefreshCw, Eye, Edit, Loader2,
  MoreHorizontal, XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
  delivery_date?: string;
  items_count: number;
}

export default function OrdersCenterPage() {
  const navigate = useNavigate();
  const { user } = useUnifiedAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Memoized filtered orders
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    return filtered;
  }, [orders, searchQuery, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('order_date', { ascending: false });

      if (error) throw error;

      const formattedOrders = (data || []).map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        customer_id: order.customer_id,
        customer_name: order.customers?.name || 'Client inconnu',
        status: order.status,
        total_amount: order.total_amount,
        currency: order.currency,
        created_at: order.created_at,
        delivery_date: order.delivery_date,
        items_count: 0
      }));
      
      setOrders(formattedOrders);
      toast.success(`${formattedOrders.length} commandes chargées`);
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast.success(`Commande mise à jour: ${newStatus}`);
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ));
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleExport = async () => {
    if (filteredOrders.length === 0) {
      toast.error('Aucune commande à exporter');
      return;
    }

    setIsExporting(true);
    try {
      const csv = convertOrdersToCSV(filteredOrders);
      downloadCSV(csv, `orders-export-${new Date().toISOString().split('T')[0]}.csv`);
      toast.success(`${filteredOrders.length} commandes exportées`);
    } catch (error: any) {
      toast.error(`Erreur d'export: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const convertOrdersToCSV = (orders: Order[]) => {
    const headers = ['Numéro', 'Client', 'Statut', 'Montant', 'Devise', 'Date', 'Articles'];
    const rows = orders.map(o => [
      o.order_number,
      o.customer_name,
      o.status,
      o.total_amount,
      o.currency,
      new Date(o.created_at).toLocaleDateString(),
      o.items_count
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'shipped': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'processing': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'pending': return 'bg-muted text-muted-foreground';
      case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'delivered': return 'Livrée';
      case 'shipped': return 'Expédiée';
      case 'processing': return 'En traitement';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle2 className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'processing': return <Package className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const statusCounts = useMemo(() => ({
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }), [orders]);

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="w-9 h-9">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Centre de Commandes</h1>
          <p className="text-sm text-muted-foreground">
            Vue unifiée de toutes vos commandes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadOrders} disabled={isLoading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting || filteredOrders.length === 0}>
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            <span className="hidden sm:inline">Exporter</span>
          </Button>
        </div>
      </div>

      {/* Stats - responsive grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card 
              className={cn(
                "cursor-pointer transition-all hover:shadow-md active:scale-[0.98]",
                statusFilter === 'all' && "ring-2 ring-primary"
              )}
              onClick={() => setStatusFilter('all')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-xl sm:text-2xl font-bold">{statusCounts.all}</p>
                  </div>
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className={cn(
                "cursor-pointer transition-all hover:shadow-md active:scale-[0.98]",
                statusFilter === 'pending' && "ring-2 ring-primary"
              )}
              onClick={() => setStatusFilter('pending')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">En attente</p>
                    <p className="text-xl sm:text-2xl font-bold">{statusCounts.pending}</p>
                  </div>
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className={cn(
                "cursor-pointer transition-all hover:shadow-md active:scale-[0.98]",
                statusFilter === 'processing' && "ring-2 ring-primary"
              )}
              onClick={() => setStatusFilter('processing')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Traitement</p>
                    <p className="text-xl sm:text-2xl font-bold">{statusCounts.processing}</p>
                  </div>
                  <Package className="h-5 w-5 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className={cn(
                "cursor-pointer transition-all hover:shadow-md active:scale-[0.98]",
                statusFilter === 'shipped' && "ring-2 ring-primary"
              )}
              onClick={() => setStatusFilter('shipped')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Expédiées</p>
                    <p className="text-xl sm:text-2xl font-bold">{statusCounts.shipped}</p>
                  </div>
                  <Truck className="h-5 w-5 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className={cn(
                "cursor-pointer transition-all hover:shadow-md active:scale-[0.98]",
                statusFilter === 'delivered' && "ring-2 ring-primary"
              )}
              onClick={() => setStatusFilter('delivered')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Livrées</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">{statusCounts.delivered}</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des commandes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Commandes ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="w-full flex-wrap h-auto gap-1 mb-4">
              <TabsTrigger value="all" className="text-xs sm:text-sm">Toutes</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs sm:text-sm">Attente</TabsTrigger>
              <TabsTrigger value="processing" className="text-xs sm:text-sm">Traitement</TabsTrigger>
              <TabsTrigger value="shipped" className="text-xs sm:text-sm">Expédiées</TabsTrigger>
              <TabsTrigger value="delivered" className="text-xs sm:text-sm">Livrées</TabsTrigger>
            </TabsList>

            <TabsContent value={statusFilter} className="space-y-3 mt-0">
              {isLoading ? (
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                          <Skeleton className="h-6 w-20" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="font-semibold mb-2">Aucune commande</h3>
                  <p className="text-sm text-muted-foreground">
                    Aucune commande ne correspond à vos critères
                  </p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {filteredOrders.map((order) => (
                    <Card 
                      key={order.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0">
                              {getStatusIcon(order.status)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-sm sm:text-base truncate">{order.order_number}</h3>
                                <Badge className={cn("text-xs", getStatusColor(order.status))}>
                                  {getStatusLabel(order.status)}
                                </Badge>
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                {order.customer_name}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 ml-7 sm:ml-0">
                            <div className="text-left sm:text-right">
                              <p className="font-semibold text-sm sm:text-base">
                                {order.total_amount.toFixed(2)} {order.currency}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  {updatingOrderId === order.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreHorizontal className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/orders/${order.id}`);
                                }}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Voir détails
                                </DropdownMenuItem>
                                {order.status === 'pending' && (
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(order.id, 'processing');
                                  }}>
                                    <Package className="w-4 h-4 mr-2" />
                                    Traiter
                                  </DropdownMenuItem>
                                )}
                                {order.status === 'processing' && (
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(order.id, 'shipped');
                                  }}>
                                    <Truck className="w-4 h-4 mr-2" />
                                    Expédier
                                  </DropdownMenuItem>
                                )}
                                {order.status === 'shipped' && (
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(order.id, 'delivered');
                                  }}>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Marquer livrée
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
