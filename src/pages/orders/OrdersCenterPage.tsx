/**
 * Centre de Commandes avec design Channable premium
 */
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, Filter, Package, Truck, CheckCircle2,
  Clock, AlertCircle, Download, RefreshCw, Eye, 
  Plus, DollarSign, TrendingUp, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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

// Composant carte de stat amélioré
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  trend, 
  color = 'primary' 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number; 
  trend?: string;
  color?: 'primary' | 'success' | 'warning' | 'destructive';
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
      <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
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
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [user]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter]);

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
    } catch (error: any) {
      toast({
        title: "Erreur de chargement",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
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

    setFilteredOrders(filtered);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: `La commande est maintenant en ${newStatus}`
      });

      loadOrders();
    } catch (error: any) {
      toast({
        title: "Erreur de mise à jour",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleExport = async () => {
    try {
      const csv = convertOrdersToCSV(filteredOrders);
      downloadCSV(csv, `orders-export-${new Date().toISOString().split('T')[0]}.csv`);

      toast({
        title: "Export réussi",
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
      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Package} label="Total" value={statusCounts.all} trend="+12%" color="primary" />
        <StatCard icon={Clock} label="En attente" value={statusCounts.pending} color="warning" />
        <StatCard icon={Package} label="Traitement" value={statusCounts.processing} color="primary" />
        <StatCard icon={Truck} label="Expédiées" value={statusCounts.shipped} color="primary" />
        <StatCard icon={DollarSign} label="CA Total" value={`${totalRevenue.toFixed(0)}€`} trend="+25%" color="success" />
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
                  placeholder="Rechercher par numéro ou client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-0 bg-muted/50 focus-visible:ring-1"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filtres
              </Button>
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
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredOrders.length === 0 ? (
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
              <div className="space-y-3">
                {filteredOrders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <OrderCard 
                      order={order}
                      onView={() => navigate(`/orders/${order.id}`)}
                      onUpdateStatus={(status) => handleUpdateStatus(order.id, status)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </ChannablePageWrapper>
  );
}
