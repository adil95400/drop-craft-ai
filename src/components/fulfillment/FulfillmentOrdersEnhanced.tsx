import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Package, RefreshCw, Search, Filter, Truck, 
  CheckCircle, Clock, XCircle, AlertTriangle,
  RotateCcw, ExternalLink, ChevronDown, ChevronUp
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OrderWithItems {
  id: string;
  order_number: string;
  status: string;
  fulfillment_status: string | null;
  total_amount: number;
  currency: string;
  customer_name: string;
  tracking_number: string | null;
  tracking_url: string | null;
  carrier: string | null;
  shipping_cost: number | null;
  created_at: string;
  error_message: string | null;
  retry_count: number;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { icon: Clock, label: 'En attente', variant: 'secondary' },
  processing: { icon: RefreshCw, label: 'Traitement', variant: 'default' },
  shipped: { icon: Truck, label: 'Expédiée', variant: 'default' },
  delivered: { icon: CheckCircle, label: 'Livrée', variant: 'default' },
  failed: { icon: XCircle, label: 'Échouée', variant: 'destructive' },
  cancelled: { icon: XCircle, label: 'Annulée', variant: 'outline' },
};

export function FulfillmentOrdersEnhanced() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['fulfillment-orders-enhanced', statusFilter],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('orders')
        .select('id, order_number, status, fulfillment_status, total_amount, currency, customer_name, tracking_number, tracking_url, carrier, shipping_cost, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as OrderWithItems[];
    },
  });

  const retryMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'processing', fulfillment_status: 'retry' })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-orders-enhanced'] });
      toast.success('Commande relancée');
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-orders-enhanced'] });
      setSelectedIds(new Set());
      toast.success('Commandes mises à jour');
    },
  });

  const filtered = orders.filter(o => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      o.order_number?.toLowerCase().includes(s) ||
      o.customer_name?.toLowerCase().includes(s) ||
      o.tracking_number?.toLowerCase().includes(s)
    );
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(o => o.id)));
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher commande, client, tracking..." 
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="processing">En traitement</SelectItem>
                <SelectItem value="shipped">Expédiées</SelectItem>
                <SelectItem value="delivered">Livrées</SelectItem>
                <SelectItem value="failed">Échouées</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <span className="text-sm font-medium">{selectedIds.size} sélectionnée(s)</span>
              <Button 
                size="sm" variant="outline"
                onClick={() => bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), status: 'processing' })}
              >
                <Truck className="h-3 w-3 mr-1" /> Traiter
              </Button>
              <Button 
                size="sm" variant="outline"
                onClick={() => bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), status: 'shipped' })}
              >
                <Package className="h-3 w-3 mr-1" /> Expédier
              </Button>
              <Button 
                size="sm" variant="destructive"
                onClick={() => bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), status: 'cancelled' })}
              >
                <XCircle className="h-3 w-3 mr-1" /> Annuler
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Chargement...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Aucune commande</p>
            <p className="text-sm text-muted-foreground">Modifiez vos filtres ou attendez de nouvelles commandes</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="hidden md:grid grid-cols-[40px_1fr_120px_120px_100px_100px_80px] gap-3 px-4 py-2 text-xs text-muted-foreground font-medium">
            <div>
              <Checkbox checked={selectedIds.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
            </div>
            <div>Commande</div>
            <div>Statut</div>
            <div>Transporteur</div>
            <div className="text-right">Montant</div>
            <div className="text-right">Expédition</div>
            <div />
          </div>

          {filtered.map(order => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            const isExpanded = expandedId === order.id;

            return (
              <Card key={order.id} className={`border-border/50 transition-shadow ${selectedIds.has(order.id) ? 'ring-1 ring-primary/50' : ''}`}>
                <CardContent className="p-0">
                  <div className="grid grid-cols-[40px_1fr_auto] md:grid-cols-[40px_1fr_120px_120px_100px_100px_80px] gap-3 items-center p-4">
                    <Checkbox 
                      checked={selectedIds.has(order.id)} 
                      onCheckedChange={() => toggleSelect(order.id)} 
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">#{order.order_number || order.id.slice(0, 8)}</span>
                        <span className="text-xs text-muted-foreground md:hidden">
                          <Badge variant={cfg.variant} className="text-[10px]">
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {cfg.label}
                          </Badge>
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {order.customer_name || 'Client'} • {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: getDateFnsLocale() })}
                      </p>
                    </div>
                    <div className="hidden md:block">
                      <Badge variant={cfg.variant} className="text-xs">
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {cfg.label}
                      </Badge>
                    </div>
                    <div className="hidden md:block text-sm text-muted-foreground">
                      {order.carrier || '—'}
                    </div>
                    <div className="hidden md:block text-right font-medium text-sm">
                      {order.total_amount?.toFixed(2)} {order.currency || '€'}
                    </div>
                    <div className="hidden md:block text-right text-sm text-muted-foreground">
                      {order.shipping_cost ? `${order.shipping_cost.toFixed(2)}€` : '—'}
                    </div>
                    <div className="flex items-center gap-1">
                      {order.status === 'failed' && (
                        <Button 
                          variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => retryMutation.mutate(order.id)}
                          disabled={retryMutation.isPending}
                        >
                          <RotateCcw className="h-4 w-4 text-orange-500" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => setExpandedId(isExpanded ? null : order.id)}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Fulfillment</p>
                          <p className="font-medium">{order.fulfillment_status || 'Manuel'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Tracking</p>
                          {order.tracking_number ? (
                            <div className="flex items-center gap-1">
                              <code className="text-xs font-mono">{order.tracking_number}</code>
                              {order.tracking_url && (
                                <a href={order.tracking_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3 text-primary" />
                                </a>
                              )}
                            </div>
                          ) : (
                            <p className="text-muted-foreground">—</p>
                          )}
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Créée le</p>
                          <p className="font-medium">{format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: getDateFnsLocale() })}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Montant total</p>
                          <p className="font-medium">{order.total_amount?.toFixed(2)} {order.currency || '€'}</p>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1">
                        {['pending', 'processing', 'shipped', 'delivered'].map((step, i) => {
                          const stepOrder = ['pending', 'processing', 'shipped', 'delivered'];
                          const currentIdx = stepOrder.indexOf(order.status);
                          const isActive = i <= currentIdx && order.status !== 'failed';
                          const isFailed = order.status === 'failed';
                          
                          return (
                            <div key={step} className="flex items-center gap-1.5">
                              {i > 0 && (
                                <div className={`w-6 h-0.5 rounded ${isActive ? 'bg-primary' : isFailed ? 'bg-destructive/30' : 'bg-border'}`} />
                              )}
                              <div className={`flex items-center gap-1 px-2 py-1 rounded-full whitespace-nowrap ${
                                isActive ? 'bg-primary/10 text-primary' : isFailed && i === currentIdx ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
                              }`}>
                                {(STATUS_CONFIG[step]?.icon) && (() => {
                                  const Icon = STATUS_CONFIG[step].icon;
                                  return <Icon className="h-3 w-3" />;
                                })()}
                                <span>{STATUS_CONFIG[step]?.label || step}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
