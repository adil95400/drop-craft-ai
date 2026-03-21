import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useInventoryManagement } from '@/hooks/useInventoryManagement';
import { useStockSync } from '@/hooks/useStockSync';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import {
  Boxes, Warehouse, AlertTriangle, ArrowDownUp, Package, Plus, TrendingDown, TrendingUp,
  MapPin, Search, CheckCircle2, RefreshCw, Activity, Zap, Clock, BarChart3, Brain,
  ShieldAlert, Bell, Timer, Globe, Eye, ShoppingCart as ShoppingCartIcon
} from 'lucide-react';
import { AutoReorderPanel } from '@/components/inventory/AutoReorderPanel';
import { format, formatDistanceToNow, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

// ─── Stock Levels Tab (enhanced from original) ──────────────────────

function StockLevelsTab() {
  const { stockLevels, stats } = useInventoryManagement();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredLevels = useMemo(() => {
    return (stockLevels.data || []).filter((sl: any) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match = (sl.products as any)?.title?.toLowerCase().includes(q) ||
          (sl.products as any)?.sku?.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (statusFilter !== 'all') {
        const qty = sl.quantity ?? 0;
        const min = sl.min_stock_level ?? 0;
        if (statusFilter === 'out' && qty > 0) return false;
        if (statusFilter === 'low' && (qty === 0 || qty > min)) return false;
        if (statusFilter === 'ok' && (qty === 0 || (min > 0 && qty <= min))) return false;
      }
      return true;
    });
  }, [stockLevels.data, searchQuery, statusFilter]);

  const getStockBadge = (quantity: number | null, minLevel: number | null) => {
    const qty = quantity ?? 0;
    if (qty === 0) return <Badge variant="destructive">Rupture</Badge>;
    if (minLevel && qty <= minLevel) return <Badge className="bg-warning text-warning-foreground">Faible</Badge>;
    return <Badge className="bg-primary/10 text-primary border-primary/20">En stock</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher par produit ou SKU..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="ok">En stock</SelectItem>
            <SelectItem value="low">Stock faible</SelectItem>
            <SelectItem value="out">Rupture</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Produit</th>
                  <th className="text-left p-3 font-medium">Entrepôt</th>
                  <th className="text-right p-3 font-medium">Quantité</th>
                  <th className="text-right p-3 font-medium">Réservé</th>
                  <th className="text-right p-3 font-medium">Disponible</th>
                  <th className="text-right p-3 font-medium">Seuil min</th>
                  <th className="text-center p-3 font-medium">Statut</th>
                  <th className="text-left p-3 font-medium">Emplacement</th>
                </tr>
              </thead>
              <tbody>
                {filteredLevels.length === 0 && (
                  <tr><td colSpan={8} className="text-center p-8 text-muted-foreground">Aucun niveau de stock enregistré</td></tr>
                )}
                {filteredLevels.map((sl: any) => (
                  <tr key={sl.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {(sl.products as any)?.image_url && (
                          <img src={(sl.products as any).image_url} className="w-8 h-8 rounded object-cover" alt="" />
                        )}
                        <div>
                          <p className="font-medium truncate max-w-[200px]">{(sl.products as any)?.title ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">{(sl.products as any)?.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{(sl.warehouses as any)?.name ?? '—'}</td>
                    <td className="p-3 text-right font-mono font-medium">{sl.quantity ?? 0}</td>
                    <td className="p-3 text-right font-mono text-muted-foreground">{sl.reserved_quantity ?? 0}</td>
                    <td className="p-3 text-right font-mono font-medium">{sl.available_quantity ?? (sl.quantity ?? 0) - (sl.reserved_quantity ?? 0)}</td>
                    <td className="p-3 text-right font-mono text-muted-foreground">{sl.min_stock_level ?? '—'}</td>
                    <td className="p-3 text-center">{getStockBadge(sl.quantity, sl.min_stock_level)}</td>
                    <td className="p-3 text-muted-foreground text-xs">{sl.location_in_warehouse ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Real-Time Sync Tab ─────────────────────────────────────────────

function RealTimeSyncTab() {
  const { user } = useUnifiedAuth();
  const {
    configs,
    stockHistory: history,
    alerts,
    syncAll,
    syncSupplier,
    upsertConfig,
    isLoading: configsLoading,
    isSyncingAll
  } = useStockSync();

  // Simulated sync pulse
  const [lastPulse, setLastPulse] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setLastPulse(new Date()), 5000);
    return () => clearInterval(interval);
  }, []);

  const syncHealth = useMemo(() => {
    if (!configs || configs.length === 0) return { healthy: 0, failing: 0, total: 0, rate: 100 };
    const healthy = configs.filter((c: any) => c.sync_enabled && (!c.last_error || c.failed_syncs === 0)).length;
    const failing = configs.filter((c: any) => c.last_error || (c.failed_syncs && c.failed_syncs > 0)).length;
    return { healthy, failing, total: configs.length, rate: configs.length > 0 ? Math.round((healthy / configs.length) * 100) : 100 };
  }, [configs]);

  // Build history chart data
  const historyChart = useMemo(() => {
    if (!history || history.length === 0) return [];
    const byDay: Record<string, { day: string; changes: number; increases: number; decreases: number }> = {};
    history.forEach((h: any) => {
      const day = format(new Date(h.created_at), 'dd/MM');
      if (!byDay[day]) byDay[day] = { day, changes: 0, increases: 0, decreases: 0 };
      byDay[day].changes++;
      if (h.change_amount > 0) byDay[day].increases++;
      else byDay[day].decreases++;
    });
    return Object.values(byDay).slice(-14);
  }, [history]);

  if (configsLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      {/* Sync Health */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Activity className="h-5 w-5 text-primary" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-ping" />
              </div>
              <div>
                <p className="text-xl font-bold">{syncHealth.rate}%</p>
                <p className="text-xs text-muted-foreground">Santé sync</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xl font-bold">{syncHealth.healthy}</p>
                <p className="text-xs text-muted-foreground">Sources actives</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-xl font-bold">{syncHealth.failing}</p>
                <p className="text-xs text-muted-foreground">En erreur</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Timer className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xl font-bold">{history?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Changements récents</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button onClick={() => syncAll()} disabled={isSyncingAll} size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncingAll ? 'animate-spin' : ''}`} />
          Synchroniser tout
        </Button>
        <span className="text-xs text-muted-foreground">
          Dernière vérification: {formatDistanceToNow(lastPulse, { addSuffix: true, locale: fr })}
        </span>
      </div>

      {/* Sync configs */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Sources de synchronisation</h3>
        {(!configs || configs.length === 0) ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Globe className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Aucune source configurée. Connectez vos fournisseurs pour activer la sync temps réel.</p>
            </CardContent>
          </Card>
        ) : (
          configs.map((config: any) => (
            <Card key={config.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${config.sync_enabled && !config.last_error ? 'bg-primary' : config.last_error ? 'bg-destructive' : 'bg-muted-foreground'}`} />
                    <div>
                      <p className="font-medium text-sm">{config.supplier_name || 'Fournisseur'}</p>
                      <p className="text-xs text-muted-foreground">
                        Toutes les {config.sync_frequency_minutes} min
                        {config.last_sync_at && ` · Dernier: ${formatDistanceToNow(new Date(config.last_sync_at), { addSuffix: true, locale: fr })}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {config.last_error && (
                      <Badge variant="destructive" className="text-xs">{config.failed_syncs} erreurs</Badge>
                    )}
                    <Badge variant={config.out_of_stock_action === 'pause' ? 'default' : 'secondary'} className="text-xs">
                      {config.out_of_stock_action === 'pause' ? '⏸ Auto-pause' : config.out_of_stock_action === 'hide' ? '👁 Auto-masquer' : '🔔 Notifier'}
                    </Badge>
                    <Switch
                      checked={config.sync_enabled}
                      onCheckedChange={(v) => upsertConfig({ supplier_id: config.supplier_id, sync_enabled: v } as any)}
                    />
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => syncSupplier(config.supplier_id)}>
                      <RefreshCw className="h-3 w-3 mr-1" />Sync
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* History chart */}
      {historyChart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Changements de stock (14 derniers jours)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={historyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="increases" stackId="a" fill="hsl(var(--primary))" name="Entrées" radius={[2, 2, 0, 0]} />
                <Bar dataKey="decreases" stackId="a" fill="hsl(var(--destructive))" name="Sorties" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── AI Forecasting Tab ─────────────────────────────────────────────

function AIForecastingTab() {
  const { user } = useUnifiedAuth();

  const { data: forecastData, isLoading } = useQuery({
    queryKey: ['stock-forecast', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get products with stock data
      const { data: products } = await supabase
        .from('products')
        .select('id, title, sku, stock_quantity, price')
        .eq('user_id', user.id)
        .not('stock_quantity', 'is', null)
        .order('stock_quantity', { ascending: true })
        .limit(50);

      if (!products) return { predictions: [], atRisk: [], totalValue: 0 };

      // Get recent orders for velocity calculation
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('id, total_amount, created_at')
        .eq('user_id', user.id)
        .gte('created_at', subDays(new Date(), 30).toISOString())
        .order('created_at', { ascending: false });

      const orderCount30d = recentOrders?.length || 0;
      const avgDailyOrders = orderCount30d / 30;

      // Calculate predictions per product
      const predictions = products.map(p => {
        const stock = p.stock_quantity || 0;
        const dailyVelocity = Math.max(avgDailyOrders * 0.3, 0.1); // estimate
        const daysUntilEmpty = stock > 0 ? Math.round(stock / dailyVelocity) : 0;
        const reorderPoint = Math.ceil(dailyVelocity * 14); // 14 days safety
        const suggestedReorder = Math.ceil(dailyVelocity * 45); // 45 days stock
        const trend = stock > reorderPoint ? 'safe' : stock > 0 ? 'warning' : 'critical';

        return {
          id: p.id,
          title: p.title,
          sku: p.sku,
          currentStock: stock,
          dailyVelocity: Math.round(dailyVelocity * 10) / 10,
          daysUntilEmpty,
          reorderPoint,
          suggestedReorder,
          trend,
          value: stock * (p.price || 0),
        };
      });

      const atRisk = predictions.filter(p => p.trend !== 'safe');
      const totalValue = predictions.reduce((acc, p) => acc + p.value, 0);

      // Build forecast chart (next 30 days projection)
      const forecastChart = Array.from({ length: 30 }, (_, i) => {
        const day = i + 1;
        const totalStock = predictions.reduce((acc, p) => {
          const projected = Math.max(0, p.currentStock - (p.dailyVelocity * day));
          return acc + projected;
        }, 0);
        return { day: `J+${day}`, stock: Math.round(totalStock) };
      });

      return { predictions, atRisk, totalValue, forecastChart, avgDailyOrders };
    },
    enabled: !!user,
  });

  if (isLoading || !forecastData) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xl font-bold">{forecastData.predictions.length}</p>
                <p className="text-xs text-muted-foreground">Produits analysés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-xl font-bold">{forecastData.atRisk.length}</p>
                <p className="text-xs text-muted-foreground">À risque</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xl font-bold">{(forecastData.avgDailyOrders || 0).toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Commandes/jour</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xl font-bold">{forecastData.totalValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</p>
                <p className="text-xs text-muted-foreground">Valeur stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forecast chart */}
      {forecastData.forecastChart && forecastData.forecastChart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              Projection stock 30 jours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={forecastData.forecastChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval={4} />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Area type="monotone" dataKey="stock" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" name="Stock projeté" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* At-risk products */}
      <div>
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          Produits à risque de rupture
        </h3>
        {forecastData.atRisk.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-primary opacity-50" />
              <p>Aucun produit à risque. Stocks suffisants pour les prochaines semaines.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {forecastData.atRisk.map(p => (
              <Card key={p.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={p.trend === 'critical' ? 'destructive' : 'secondary'}>
                        {p.trend === 'critical' ? 'Rupture' : 'Faible'}
                      </Badge>
                      <div>
                        <p className="font-medium text-sm truncate max-w-[250px]">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{p.sku}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-bold">{p.currentStock}</p>
                        <p className="text-xs text-muted-foreground">Stock</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-destructive">{p.daysUntilEmpty}j</p>
                        <p className="text-xs text-muted-foreground">Avant rupture</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-primary">{p.suggestedReorder}</p>
                        <p className="text-xs text-muted-foreground">À commander</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Alerts & Rules Tab ─────────────────────────────────────────────

function AlertsRulesTab() {
  const { stockAlerts, resolveAlert, stats } = useInventoryManagement();
  const { alerts: syncAlerts } = useStockSync();

  const allAlerts = useMemo(() => {
    const inv = (stockAlerts.data || []).map((a: any) => ({
      ...a,
      source: 'inventory',
    }));
    const sync = (syncAlerts || []).map((a: any) => ({
      ...a,
      source: 'sync',
      title: a.message,
      severity: a.severity || 'medium',
    }));
    return [...inv, ...sync].sort((a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [stockAlerts.data, syncAlerts]);

  return (
    <div className="space-y-6">
      {/* Alert summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <ShieldAlert className="h-5 w-5 mx-auto mb-1 text-destructive" />
            <p className="text-xl font-bold">{allAlerts.filter((a: any) => a.severity === 'critical').length}</p>
            <p className="text-xs text-muted-foreground">Critiques</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-warning" />
            <p className="text-xl font-bold">{allAlerts.filter((a: any) => a.severity === 'high' || a.severity === 'medium').length}</p>
            <p className="text-xs text-muted-foreground">Avertissements</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Bell className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xl font-bold">{allAlerts.length}</p>
            <p className="text-xs text-muted-foreground">Total alertes</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert list */}
      {allAlerts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-primary opacity-50" />
            <p>Aucune alerte active. Vos stocks sont en bonne santé.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {allAlerts.map((alert: any) => (
            <Card key={alert.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    alert.severity === 'critical' ? 'bg-destructive/10 text-destructive' :
                    alert.severity === 'high' ? 'bg-warning/10 text-warning' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{alert.title || alert.message}</p>
                    {alert.message && alert.title && <p className="text-xs text-muted-foreground">{alert.message}</p>}
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      {(alert.products as any)?.title && <span>{(alert.products as any).title}</span>}
                      {alert.current_stock != null && <span>· Stock: {alert.current_stock}</span>}
                      <span>· {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: fr })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">
                    {alert.severity}
                  </Badge>
                  {alert.source === 'inventory' && (
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => resolveAlert.mutate(alert.id)}>
                      Résoudre
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Warehouses Tab (from original) ─────────────────────────────────

function WarehousesTab() {
  const { warehouses, addWarehouse } = useInventoryManagement();
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [newWarehouse, setNewWarehouse] = useState({ name: '', code: '', city: '', country: 'France', warehouse_type: 'owned' });

  const handleAddWarehouse = () => {
    if (!newWarehouse.name) return;
    addWarehouse.mutate(newWarehouse, {
      onSuccess: () => {
        setWarehouseDialogOpen(false);
        setNewWarehouse({ name: '', code: '', city: '', country: 'France', warehouse_type: 'owned' });
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={warehouseDialogOpen} onOpenChange={setWarehouseDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Ajouter un entrepôt</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouvel entrepôt</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-4">
              <Input placeholder="Nom *" value={newWarehouse.name} onChange={e => setNewWarehouse(p => ({ ...p, name: e.target.value }))} />
              <Input placeholder="Code (ex: WH-PAR)" value={newWarehouse.code} onChange={e => setNewWarehouse(p => ({ ...p, code: e.target.value }))} />
              <Input placeholder="Ville" value={newWarehouse.city} onChange={e => setNewWarehouse(p => ({ ...p, city: e.target.value }))} />
              <Input placeholder="Pays" value={newWarehouse.country} onChange={e => setNewWarehouse(p => ({ ...p, country: e.target.value }))} />
              <Select value={newWarehouse.warehouse_type} onValueChange={v => setNewWarehouse(p => ({ ...p, warehouse_type: v }))}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="owned">Propre</SelectItem>
                  <SelectItem value="3pl">3PL</SelectItem>
                  <SelectItem value="dropship">Dropship</SelectItem>
                  <SelectItem value="virtual">Virtuel</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddWarehouse} disabled={addWarehouse.isPending} className="w-full">
                {addWarehouse.isPending ? 'Ajout...' : 'Ajouter'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {warehouses.data?.map((wh: any) => (
          <Card key={wh.id}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{wh.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" />
                    {[wh.city, wh.country].filter(Boolean).join(', ') || 'Non spécifié'}
                  </div>
                </div>
                <Badge variant={wh.is_active !== false ? 'default' : 'secondary'}>
                  {wh.is_active !== false ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded bg-muted">
                  <p className="text-xs text-muted-foreground">Code</p>
                  <p className="font-mono text-sm font-medium">{wh.code ?? '—'}</p>
                </div>
                <div className="p-2 rounded bg-muted">
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-sm font-medium capitalize">{wh.warehouse_type ?? '—'}</p>
                </div>
                <div className="p-2 rounded bg-muted">
                  <p className="text-xs text-muted-foreground">Capacité</p>
                  <p className="text-sm font-medium">{wh.capacity ? `${wh.current_occupancy ?? 0}/${wh.capacity}` : '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!warehouses.data || warehouses.data.length === 0) && (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Warehouse className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Aucun entrepôt configuré</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────

export default function InventoryHubPage() {
  const { stats } = useInventoryManagement();

  return (
    <ChannablePageWrapper
      title="Gestion des Stocks Temps Réel"
      description="Synchronisation temps réel, prévisions IA, alertes automatiques et multi-entrepôts"
      heroImage="stock"
      badge={{ label: 'Stock Intelligence', icon: Boxes }}
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Entrepôts', value: stats.totalWarehouses, icon: Warehouse, color: 'text-primary' },
          { label: 'Références', value: stats.totalProducts, icon: Package, color: 'text-primary' },
          { label: 'Stock faible', value: stats.lowStockCount, icon: TrendingDown, color: 'text-warning' },
          { label: 'Ruptures', value: stats.outOfStockCount, icon: AlertTriangle, color: 'text-destructive' },
          { label: 'Alertes actives', value: stats.activeAlerts, icon: Bell, color: 'text-destructive' },
        ].map((kpi, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-xl font-bold">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="levels" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="levels" className="gap-2"><Package className="h-4 w-4" />Niveaux</TabsTrigger>
          <TabsTrigger value="sync" className="gap-2"><Activity className="h-4 w-4" />Sync Temps Réel</TabsTrigger>
          <TabsTrigger value="forecast" className="gap-2"><Brain className="h-4 w-4" />Prévisions IA</TabsTrigger>
          <TabsTrigger value="reorder" className="gap-2"><ShoppingCartIcon className="h-4 w-4" />Auto-Réappro</TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2"><Bell className="h-4 w-4" />Alertes ({stats.activeAlerts})</TabsTrigger>
          <TabsTrigger value="warehouses" className="gap-2"><Warehouse className="h-4 w-4" />Entrepôts</TabsTrigger>
        </TabsList>

        <TabsContent value="levels"><StockLevelsTab /></TabsContent>
        <TabsContent value="sync"><RealTimeSyncTab /></TabsContent>
        <TabsContent value="forecast"><AIForecastingTab /></TabsContent>
        <TabsContent value="reorder"><AutoReorderPanel /></TabsContent>
        <TabsContent value="alerts"><AlertsRulesTab /></TabsContent>
        <TabsContent value="warehouses"><WarehousesTab /></TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
