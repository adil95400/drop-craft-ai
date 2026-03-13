import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Zap, Package, Truck, RefreshCw, CheckCircle2, XCircle, Clock,
  AlertTriangle, Settings, Plus, Trash2, Shield, Play, Pause, Activity,
  Globe, MapPin, BarChart3, ArrowRight, Timer, Split, DollarSign,
  RotateCcw, Eye, Search, Filter, ExternalLink, TrendingUp
} from 'lucide-react';
import { useAutoFulfillment } from '@/hooks/useAutoFulfillment';
import { useAutoOrderComplete, useAutoOrderSettings, useAutoOrderRules } from '@/hooks/useAutoOrderComplete';
import { useAutoOrderQueue } from '@/hooks/useAutoOrderQueue';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// ─── Constants ───────────────────────────────────────────────────────

const SUPPLIERS = [
  { value: 'aliexpress', label: 'AliExpress', color: 'hsl(var(--destructive))' },
  { value: 'cj', label: 'CJ Dropshipping', color: 'hsl(var(--primary))' },
  { value: 'bigbuy', label: 'BigBuy', color: 'hsl(var(--warning, 40 96% 53%))' },
  { value: 'bts', label: 'BTS / Brandits', color: 'hsl(var(--accent))' },
  { value: 'generic', label: 'Autre', color: 'hsl(var(--muted-foreground))' },
];

const CARRIERS = [
  { code: 'cainiao', name: 'Cainiao', trackUrl: 'https://global.cainiao.com/detail.htm?mailNoList=' },
  { code: 'yanwen', name: 'Yanwen', trackUrl: 'https://track.yanwen.com/en/track?nums=' },
  { code: '17track', name: '17Track', trackUrl: 'https://t.17track.net/en#nums=' },
  { code: 'dhl', name: 'DHL', trackUrl: 'https://www.dhl.com/en/express/tracking.html?AWB=' },
  { code: 'fedex', name: 'FedEx', trackUrl: 'https://www.fedex.com/fedextrack/?trknbr=' },
  { code: 'ups', name: 'UPS', trackUrl: 'https://www.ups.com/track?tracknum=' },
  { code: 'colissimo', name: 'Colissimo', trackUrl: 'https://www.laposte.fr/outils/suivre-vos-envois?code=' },
  { code: 'chronopost', name: 'Chronopost', trackUrl: 'https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT=' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'En attente', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: Clock },
  processing: { label: 'En cours', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: RefreshCw },
  completed: { label: 'Expédié', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle2 },
  failed: { label: 'Échoué', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
  retry: { label: 'Retry', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', icon: RotateCcw },
};

const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(142 76% 36%)', 'hsl(48 96% 53%)', 'hsl(var(--muted-foreground))'];

// ─── Pipeline Tab ────────────────────────────────────────────────────

function OrderPipelineTab() {
  const { user } = useUnifiedAuth();
  const { queueItems, stats, isLoading, refetch } = useAutoOrderQueue(user?.id);
  const { batchSyncTracking, isBatchSyncing } = useAutoOrderComplete();
  const {
    processOrder, isProcessingOrder,
    processPending, isProcessingPending,
    retryFailed, isRetrying,
  } = useAutoFulfillment();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');

  const filteredItems = useMemo(() => {
    return (queueItems || []).filter((item: any) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (supplierFilter !== 'all' && item.supplier_type !== supplierFilter) return false;
      return true;
    });
  }, [queueItems, statusFilter, supplierFilter]);

  const totalProcessed = (stats?.completed || 0) + (stats?.failed || 0);
  const successRate = totalProcessed > 0 ? Math.round(((stats?.completed || 0) / totalProcessed) * 100) : 100;

  if (isLoading) return <div className="space-y-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      {/* Pipeline KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'En attente', value: stats?.pending || 0, icon: Clock, color: 'text-yellow-600' },
          { label: 'En cours', value: stats?.processing || 0, icon: RefreshCw, color: 'text-blue-600' },
          { label: 'Expédiés', value: stats?.completed || 0, icon: CheckCircle2, color: 'text-green-600' },
          { label: 'Échoués', value: stats?.failed || 0, icon: XCircle, color: 'text-destructive' },
          { label: 'Retry', value: stats?.retry || 0, icon: RotateCcw, color: 'text-orange-600' },
          { label: 'Taux succès', value: `${successRate}%`, icon: TrendingUp, color: successRate >= 80 ? 'text-green-600' : 'text-destructive' },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="p-4 text-center">
                <Icon className={`h-5 w-5 mx-auto mb-1 ${kpi.color}`} />
                <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => processPending?.(undefined as any)} disabled={isProcessingPending || (stats?.pending || 0) === 0} size="sm">
          <Play className="h-4 w-4 mr-2" />
          Traiter en attente ({stats?.pending || 0})
        </Button>
        <Button variant="outline" onClick={() => retryFailed?.(undefined as any)} disabled={isRetrying || (stats?.failed || 0) === 0} size="sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          Retry échoués ({stats?.failed || 0})
        </Button>
        <Button variant="outline" onClick={() => batchSyncTracking()} disabled={isBatchSyncing} size="sm">
          <Truck className="h-4 w-4 mr-2" />
          Sync Trackings
        </Button>
        <Button variant="ghost" onClick={() => refetch()} size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={supplierFilter} onValueChange={setSupplierFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous fournisseurs</SelectItem>
              {SUPPLIERS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Queue list */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Aucune commande dans la file. Les commandes seront traitées automatiquement.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item: any) => {
            const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
            const Icon = sc.icon;
            return (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${sc.color}`}>
                        <Icon className="h-3 w-3" />
                        {sc.label}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          Commande #{item.order_id?.slice(0, 8)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {SUPPLIERS.find(s => s.value === item.supplier_type)?.label || item.supplier_type}
                          {item.payload?.items?.length ? ` · ${item.payload.items.length} article(s)` : ''}
                          {item.tracking_number ? ` · 📦 ${item.tracking_number}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.retry_count > 0 && (
                        <Badge variant="outline" className="text-xs">
                          Retry {item.retry_count}/{item.max_retries}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: fr })}
                      </span>
                      {item.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => processOrder?.(item.id)}
                          disabled={isProcessingOrder}
                          className="h-7 text-xs"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Traiter
                        </Button>
                      )}
                      {item.tracking_number && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => {
                            const carrier = CARRIERS.find(c => c.code === item.carrier) || CARRIERS[2]; // default 17track
                            window.open(carrier.trackUrl + item.tracking_number, '_blank');
                          }}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Suivre
                        </Button>
                      )}
                    </div>
                  </div>
                  {item.error_message && (
                    <p className="mt-2 text-xs text-destructive bg-destructive/5 rounded px-3 py-1.5">
                      ⚠ {item.error_message}
                    </p>
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

// ─── Tracking Tab ────────────────────────────────────────────────────

function MultiCarrierTrackingTab() {
  const { user } = useUnifiedAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: trackingData = [], isLoading } = useQuery({
    queryKey: ['multi-carrier-tracking', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase
        .from('auto_order_queue') as any)
        .select('id, order_id, tracking_number, carrier, status, supplier_type, updated_at, estimated_delivery, payload')
        .eq('user_id', user.id)
        .not('tracking_number', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const carrierStats = useMemo(() => {
    const byCarrier: Record<string, number> = {};
    trackingData.forEach((t: any) => {
      const c = t.carrier || 'unknown';
      byCarrier[c] = (byCarrier[c] || 0) + 1;
    });
    return Object.entries(byCarrier).map(([name, count]) => ({ name, count }));
  }, [trackingData]);

  const filtered = useMemo(() => {
    if (!searchQuery) return trackingData;
    const q = searchQuery.toLowerCase();
    return trackingData.filter((t: any) =>
      t.tracking_number?.toLowerCase().includes(q) ||
      t.order_id?.toLowerCase().includes(q) ||
      t.carrier?.toLowerCase().includes(q)
    );
  }, [trackingData, searchQuery]);

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      {/* Carrier overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Truck className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-xl font-bold">{trackingData.length}</p>
            <p className="text-xs text-muted-foreground">Colis suivis</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Globe className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <p className="text-xl font-bold">{carrierStats.length}</p>
            <p className="text-xs text-muted-foreground">Transporteurs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <p className="text-xl font-bold">{trackingData.filter((t: any) => t.status === 'completed').length}</p>
            <p className="text-xs text-muted-foreground">Livrés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Timer className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
            <p className="text-xl font-bold">{trackingData.filter((t: any) => t.status === 'processing').length}</p>
            <p className="text-xs text-muted-foreground">En transit</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par numéro de tracking, commande ou transporteur..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tracking list */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Aucun colis suivi. Les numéros de tracking sont ajoutés automatiquement après traitement.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((item: any) => {
            const carrier = CARRIERS.find(c => c.code === item.carrier);
            const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
            const Icon = sc.icon;
            return (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${sc.color}`}>
                        <Icon className="h-3 w-3" />
                        {sc.label}
                      </div>
                      <div>
                        <p className="font-mono text-sm font-medium">{item.tracking_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {carrier?.name || item.carrier || 'Inconnu'} · #{item.order_id?.slice(0, 8)}
                          {item.estimated_delivery && ` · Livraison ~${format(new Date(item.estimated_delivery), 'dd MMM', { locale: fr })}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true, locale: fr })}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => {
                          const url = (carrier?.trackUrl || CARRIERS[2].trackUrl) + item.tracking_number;
                          window.open(url, '_blank');
                        }}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Suivre
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Rules Tab ───────────────────────────────────────────────────────

function AutoOrderRulesTab() {
  const { rules, createRule, deleteRule, isCreating } = useAutoOrderRules();
  const [showNew, setShowNew] = useState(false);
  const [newRule, setNewRule] = useState({
    supplier_type: 'aliexpress',
    min_stock_trigger: 5,
    reorder_quantity: 10,
    max_price: 50,
    preferred_shipping: 'aliexpress_standard',
  });

  const handleCreate = () => {
    createRule(newRule as any);
    setShowNew(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Règles de réapprovisionnement automatique</h3>
          <p className="text-sm text-muted-foreground">Définissez quand et comment commander automatiquement auprès des fournisseurs</p>
        </div>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Nouvelle règle</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une règle Auto-Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Fournisseur</Label>
                <Select value={newRule.supplier_type} onValueChange={v => setNewRule(p => ({ ...p, supplier_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUPPLIERS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Stock minimum (seuil)</Label>
                  <Input type="number" value={newRule.min_stock_trigger} onChange={e => setNewRule(p => ({ ...p, min_stock_trigger: +e.target.value }))} />
                </div>
                <div>
                  <Label>Quantité à commander</Label>
                  <Input type="number" value={newRule.reorder_quantity} onChange={e => setNewRule(p => ({ ...p, reorder_quantity: +e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Prix max par unité (€)</Label>
                <Input type="number" value={newRule.max_price || ''} onChange={e => setNewRule(p => ({ ...p, max_price: +e.target.value }))} />
              </div>
              <div>
                <Label>Méthode d'expédition</Label>
                <Select value={newRule.preferred_shipping} onValueChange={v => setNewRule(p => ({ ...p, preferred_shipping: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aliexpress_standard">Standard (15-30j, gratuit)</SelectItem>
                    <SelectItem value="aliexpress_premium">Premium (10-20j, ~3-5€)</SelectItem>
                    <SelectItem value="epacket">ePacket (10-20j, ~2-4€)</SelectItem>
                    <SelectItem value="cainiao">Cainiao Economy (20-40j, gratuit)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={isCreating} className="w-full">
                {isCreating ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Créer la règle
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {(rules || []).length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Settings className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Aucune règle configurée. Créez des règles pour automatiser le réapprovisionnement.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {(rules || []).map((rule: any) => (
            <Card key={rule.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {SUPPLIERS.find(s => s.value === rule.supplier_type)?.label || rule.supplier_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Stock ≤ {rule.min_stock_trigger} → Commander {rule.reorder_quantity} unités
                        {rule.max_price ? ` (max ${rule.max_price}€)` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {rule.trigger_count > 0 && (
                      <span className="text-xs text-muted-foreground">{rule.trigger_count} déclenchement(s)</span>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-destructive hover:text-destructive"
                      onClick={() => deleteRule(rule.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Analytics Tab ───────────────────────────────────────────────────

function FulfillmentAnalyticsTab() {
  const { user } = useUnifiedAuth();

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['fulfillment-analytics', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: queue } = await (supabase.from('auto_order_queue') as any)
        .select('status, supplier_type, created_at, processed_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500);

      const items = queue || [];

      // Status distribution
      const statusDist: Record<string, number> = {};
      items.forEach((i: any) => { statusDist[i.status] = (statusDist[i.status] || 0) + 1; });

      // Supplier distribution
      const supplierDist: Record<string, number> = {};
      items.forEach((i: any) => { supplierDist[i.supplier_type] = (supplierDist[i.supplier_type] || 0) + 1; });

      // Daily volume (last 14 days)
      const dailyMap: Record<string, { total: number; completed: number; failed: number }> = {};
      items.forEach((i: any) => {
        const day = format(new Date(i.created_at), 'dd/MM');
        if (!dailyMap[day]) dailyMap[day] = { total: 0, completed: 0, failed: 0 };
        dailyMap[day].total++;
        if (i.status === 'completed') dailyMap[day].completed++;
        if (i.status === 'failed') dailyMap[day].failed++;
      });
      const dailyVolume = Object.entries(dailyMap).slice(-14).map(([day, v]) => ({ day, ...v }));

      // Processing time (avg)
      const withProcessing = items.filter((i: any) => i.processed_at && i.created_at);
      const avgTime = withProcessing.length > 0
        ? Math.round(withProcessing.reduce((acc: number, i: any) => {
            const procTime = new Date(i.processed_at).getTime();
            const createTime = new Date(i.created_at).getTime();
            return acc + (procTime - createTime) / 60000;
          }, 0) / withProcessing.length)
        : 0;

      return {
        total: items.length,
        statusDist: Object.entries(statusDist).map(([name, value]) => ({ name: STATUS_CONFIG[name]?.label || name, value })),
        supplierDist: Object.entries(supplierDist).map(([name, value]) => ({ name: SUPPLIERS.find(s => s.value === name)?.label || name, value })),
        dailyVolume,
        avgProcessingTimeMin: avgTime,
        completedCount: statusDist.completed || 0,
        failedCount: statusDist.failed || 0,
      };
    },
    enabled: !!user,
  });

  if (isLoading || !analyticsData) return <div className="space-y-4">{[1,2].map(i => <Skeleton key={i} className="h-64 w-full" />)}</div>;

  const successRate = analyticsData.total > 0
    ? Math.round((analyticsData.completedCount / analyticsData.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total commandes', value: analyticsData.total, icon: Package },
          { label: 'Taux de succès', value: `${successRate}%`, icon: TrendingUp },
          { label: 'Temps moyen', value: `${analyticsData.avgProcessingTimeMin} min`, icon: Timer },
          { label: 'Fournisseurs actifs', value: analyticsData.supplierDist.length, icon: Globe },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily Volume */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Volume quotidien</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.dailyVolume.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={analyticsData.dailyVolume}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Area type="monotone" dataKey="completed" stackId="1" stroke="hsl(142 76% 36%)" fill="hsl(142 76% 36% / 0.3)" name="Complétés" />
                  <Area type="monotone" dataKey="failed" stackId="1" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive) / 0.3)" name="Échoués" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Pas encore de données</p>
            )}
          </CardContent>
        </Card>

        {/* Supplier distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition fournisseurs</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.supplierDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={analyticsData.supplierDist} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {analyticsData.supplierDist.map((_: any, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Pas encore de données</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────

export default function AutoOrderFulfillmentCenter() {
  return (
    <>
      <Helmet>
        <title>Auto-Order & Fulfillment — Centre de commande automatique</title>
        <meta name="description" content="Centre de fulfillment automatique : commandes fournisseurs, tracking multi-transporteurs, split orders et analytics." />
      </Helmet>

      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Auto-Order & Fulfillment</h1>
            <p className="text-muted-foreground text-sm">
              Commandes automatiques • Tracking multi-transporteurs • Règles de réapprovisionnement
            </p>
          </div>
        </div>

        <Tabs defaultValue="pipeline" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pipeline" className="gap-2"><Package className="h-4 w-4" />Pipeline</TabsTrigger>
            <TabsTrigger value="tracking" className="gap-2"><Truck className="h-4 w-4" />Tracking</TabsTrigger>
            <TabsTrigger value="rules" className="gap-2"><Settings className="h-4 w-4" />Règles</TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2"><BarChart3 className="h-4 w-4" />Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline"><OrderPipelineTab /></TabsContent>
          <TabsContent value="tracking"><MultiCarrierTrackingTab /></TabsContent>
          <TabsContent value="rules"><AutoOrderRulesTab /></TabsContent>
          <TabsContent value="analytics"><FulfillmentAnalyticsTab /></TabsContent>
        </Tabs>
      </div>
    </>
  );
}
