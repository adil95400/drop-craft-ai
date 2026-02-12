/**
 * Centre de Commandes avec design Channable premium
 * Pagination, filtres avancés et mise à jour de statut réels
 */
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, Filter, Package, Truck, CheckCircle2,
  Clock, AlertCircle, Download, RefreshCw, Eye, 
  Plus, DollarSign, TrendingUp, Sparkles, ChevronLeft, ChevronRight,
  Calendar, MapPin, Loader2, Store, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useToast } from '@/hooks/use-toast';
import { useApiOrders } from '@/hooks/api';
import { supabase } from '@/integrations/supabase/client';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { useShopifyOrderImport } from '@/hooks/useShopifyOrderImport';
import { AutoOrderDashboard } from '@/components/orders/AutoOrderDashboard';
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';

const ITEMS_PER_PAGE = 20;

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
  tracking_number?: string;
}

// Composant carte de stat amélioré
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  trend, 
  color = 'primary',
  onClick
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number; 
  trend?: string;
  color?: 'primary' | 'success' | 'warning' | 'destructive';
  onClick?: () => void;
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-green-500/10 text-green-600 border-green-500/20',
    warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    destructive: 'bg-red-500/10 text-red-600 border-red-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn("relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow", onClick && "cursor-pointer")} onClick={onClick}>
        <div className={cn("absolute inset-0 opacity-5", colorClasses[color].split(' ')[0])} />
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className={cn("p-2.5 rounded-xl border", colorClasses[color])}>
              <Icon className="h-5 w-5" />
            </div>
            {trend && (
              <Badge variant="secondary" className="text-xs font-medium bg-green-500/10 text-green-600 border-0">
                {trend}
              </Badge>
            )}
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Composant carte de commande amélioré
function OrderCard({ 
  order, 
  onView, 
  onUpdateStatus 
}: { 
  order: Order; 
  onView: () => void; 
  onUpdateStatus: (status: string) => void;
}) {
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; icon: React.ElementType; label: string }> = {
      pending: { color: 'bg-amber-500/10 text-amber-600 border-amber-500/30', icon: Clock, label: 'En attente' },
      processing: { color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: Package, label: 'Traitement' },
      shipped: { color: 'bg-purple-500/10 text-purple-600 border-purple-500/30', icon: Truck, label: 'Expédié' },
      delivered: { color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: CheckCircle2, label: 'Livré' },
      cancelled: { color: 'bg-red-500/10 text-red-600 border-red-500/30', icon: AlertCircle, label: 'Annulé' },
    };
    return configs[status] || configs.pending;
  };

  const config = getStatusConfig(order.status);
  const StatusIcon = config.icon;

  const getNextStatus = () => {
    const statusFlow: Record<string, string> = {
      pending: 'processing',
      processing: 'shipped',
      shipped: 'delivered',
    };
    return statusFlow[order.status];
  };

  const getNextStatusLabel = () => {
    const labels: Record<string, string> = {
      pending: 'Traiter',
      processing: 'Expédier',
      shipped: 'Livrer',
    };
    return labels[order.status];
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group hover:shadow-md transition-all border-0 shadow-sm overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className={cn("p-2.5 rounded-xl border", config.color)}>
                <StatusIcon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold truncate">{order.order_number}</h3>
                  <Badge className={cn("border", config.color)}>
                    {config.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {order.customer_name} • {order.items_count || 0} article(s)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="font-semibold">
                  {order.total_amount.toFixed(2)} {order.currency}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onView}
                  className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary"
                >
                  <Eye className="w-4 h-4" />
                </Button>

                {getNextStatus() && (
                  <Button
                    size="sm"
                    onClick={() => onUpdateStatus(getNextStatus())}
                    className="bg-primary hover:bg-primary/90 shadow-sm"
                  >
                    {getNextStatusLabel()}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function OrdersCenterPage() {
  const navigate = useNavigate();
  const { user } = useUnifiedAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  
  // FastAPI hooks
  const { fulfillOrder, updateStatus, bulkFulfill } = useApiOrders();
  
  // Shopify order import
  const { integrations, importOrders, isImporting } = useShopifyOrderImport();

  const [activeMainTab, setActiveMainTab] = useState<'orders' | 'auto-order'>('orders');

  useEffect(() => {
    loadOrders();
  }, [user]);

  // Filtrage et pagination mémorisés
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(query) ||
        order.customer_name.toLowerCase().includes(query) ||
        order.tracking_number?.toLowerCase().includes(query)
      );
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filtre par date
    if (dateRange.start) {
      filtered = filtered.filter(order => 
        new Date(order.created_at) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(order => 
        new Date(order.created_at) <= new Date(dateRange.end)
      );
    }

    // Tri
    filtered.sort((a, b) => {
      const factor = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'date') {
        return factor * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      }
      return factor * (a.total_amount - b.total_amount);
    });

    return filtered;
  }, [orders, searchQuery, statusFilter, dateRange, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateRange]);

  const loadOrders = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data: rawOrders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200);
      
      if (error) throw error;

      const formattedOrders = (rawOrders || []).map((order: any) => ({
        id: order.id,
        order_number: order.order_number || order.id?.slice(0, 8),
        customer_id: order.customer_id || '',
        customer_name: order.customer_name || 'Client',
        status: order.status || 'pending',
        total_amount: order.total_amount || 0,
        currency: order.currency || 'EUR',
        created_at: order.created_at,
        delivery_date: order.delivery_date,
        items_count: order.items_count || 0,
        tracking_number: order.tracking_number,
      }));
      
      setOrders(formattedOrders);
    } catch (error: any) {
      console.warn('Error loading orders:', error);
      toast({
        title: "Erreur de chargement",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setIsUpdatingStatus(orderId);
    
    updateStatus.mutate(
      { orderId, status: newStatus },
      {
        onSuccess: () => {
          const statusLabels: Record<string, string> = {
            pending: 'En attente',
            processing: 'En traitement',
            shipped: 'Expédiée',
            delivered: 'Livrée',
            cancelled: 'Annulée'
          };

          toast({
            title: "✓ Statut mis à jour",
            description: `La commande est maintenant "${statusLabels[newStatus] || newStatus}"`
          });

          // Optimistic update
          setOrders(prev => prev.map(o => 
            o.id === orderId ? { ...o, status: newStatus } : o
          ));
          setIsUpdatingStatus(null);
        },
        onError: (error: any) => {
          toast({
            title: "Erreur de mise à jour",
            description: error.message,
            variant: "destructive"
          });
          setIsUpdatingStatus(null);
        },
      }
    );
  };

  const handleExport = async () => {
    try {
      // Client-side CSV export
      const headers = ['ID', 'Numéro', 'Client', 'Statut', 'Montant', 'Date'];
      const rows = filteredOrders.map(o => [o.id, o.order_number, o.customer_name, o.status, o.total_amount, o.created_at]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `commandes-export-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export terminé",
        description: `${filteredOrders.length} commandes exportées`
      });
    } catch (error: any) {
      toast({
        title: "Erreur d'export",
        description: error.message,
        variant: "destructive"
      });
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

  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  const totalRevenue = orders.reduce((acc, o) => acc + (o.total_amount || 0), 0);

  return (
    <ChannablePageWrapper
      title="Centre de Commandes"
      subtitle="Gestion & Suivi"
      description="Vue unifiée de toutes vos commandes avec gestion avancée et suivi en temps réel"
      heroImage="orders"
      badge={{
        label: 'Live',
        icon: Sparkles
      }}
      actions={
        <>
          {integrations && integrations.length > 0 && (
            <Button 
              variant="outline"
              onClick={() => {
                const integration = integrations[0];
                importOrders(integration.id, {
                  onSuccess: () => loadOrders()
                });
              }}
              disabled={isImporting}
              className="gap-2 backdrop-blur-sm bg-background/50"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Store className="h-4 w-4" />
              )}
              Importer Shopify
            </Button>
          )}
          <Button 
            onClick={() => navigate('/orders/new')} 
            className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
          >
            <Plus className="h-4 w-4" />
            Nouvelle commande
          </Button>
          <Button 
            variant="outline" 
            onClick={loadOrders} 
            disabled={isLoading}
            className="gap-2 backdrop-blur-sm bg-background/50"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Actualiser
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExport}
            className="gap-2 backdrop-blur-sm bg-background/50"
          >
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </>
      }
    >
      <AdvancedFeatureGuide {...ADVANCED_GUIDES.orders} />
      {/* Main Tabs: Orders vs Auto-Order */}
      <Tabs value={activeMainTab} onValueChange={(v) => setActiveMainTab(v as 'orders' | 'auto-order')} className="mb-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="orders" className="gap-2">
            <Package className="w-4 h-4" />
            Commandes
          </TabsTrigger>
          <TabsTrigger value="auto-order" className="gap-2">
            <Zap className="w-4 h-4" />
            Auto-Order
            <Badge variant="secondary" className="ml-1 text-xs">PRO</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="auto-order" className="mt-6">
          <AutoOrderDashboard />
        </TabsContent>

        <TabsContent value="orders" className="mt-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
            <StatCard icon={Package} label="Total" value={statusCounts.all} trend="+12%" color="primary" onClick={() => setStatusFilter('all')} />
            <StatCard icon={Clock} label="En attente" value={statusCounts.pending} color="warning" onClick={() => setStatusFilter('pending')} />
            <StatCard icon={Package} label="Traitement" value={statusCounts.processing} color="primary" onClick={() => setStatusFilter('processing')} />
            <StatCard icon={Truck} label="Expédiées" value={statusCounts.shipped} color="primary" onClick={() => setStatusFilter('shipped')} />
            <StatCard icon={DollarSign} label="CA Total" value={`${totalRevenue.toFixed(0)}€`} trend="+25%" color="success" onClick={() => navigate('/analytics')} />
          </div>
          {/* Search & Filter */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher par numéro, client ou tracking..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-0 bg-muted/50 focus-visible:ring-1"
                />
              </div>
              
              {/* Filtres de date */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Calendar className="w-4 h-4" />
                    Période
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Date de début</Label>
                      <Input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date de fin</Label>
                      <Input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setDateRange({ start: '', end: '' })}
                    >
                      Réinitialiser
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Tri */}
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(v) => {
                const [by, order] = v.split('-') as ['date' | 'amount', 'asc' | 'desc'];
                setSortBy(by);
                setSortOrder(order);
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Trier par..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Date (récent)</SelectItem>
                  <SelectItem value="date-asc">Date (ancien)</SelectItem>
                  <SelectItem value="amount-desc">Montant (élevé)</SelectItem>
                  <SelectItem value="amount-asc">Montant (faible)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
            </Card>
          </motion.div>

          {/* Orders List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Tabs defaultValue="all" onValueChange={setStatusFilter} className="space-y-4">
          <TabsList className="bg-muted/50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
            <TabsTrigger value="all" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Toutes ({statusCounts.all})
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              En attente ({statusCounts.pending})
            </TabsTrigger>
            <TabsTrigger value="processing" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Traitement ({statusCounts.processing})
            </TabsTrigger>
            <TabsTrigger value="shipped" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Expédiées ({statusCounts.shipped})
            </TabsTrigger>
            <TabsTrigger value="delivered" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Livrées ({statusCounts.delivered})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter} className="space-y-3 mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : paginatedOrders.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="text-center py-12">
                  <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">Aucune commande</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Aucune commande ne correspond à vos critères
                  </p>
                  <Button onClick={() => navigate('/orders/new')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Créer une commande
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Info pagination */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Affichage {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} sur {filteredOrders.length} commandes
                  </span>
                  <span>{totalPages} page(s)</span>
                </div>

                <div className="space-y-3">
                  {paginatedOrders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <OrderCard 
                        order={order}
                        onView={() => navigate(`/orders/${order.id}`)}
                        onUpdateStatus={(status) => handleUpdateStatus(order.id, status)}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Précédent
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let page: number;
                        if (totalPages <= 5) {
                          page = i + 1;
                        } else if (currentPage <= 3) {
                          page = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          page = totalPages - 4 + i;
                        } else {
                          page = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
            </TabsContent>
            </Tabs>
          </motion.div>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
