/**
 * SupplierControlTab — Ultra-Pro supplier monitoring inside Admin Control Center
 * Health, sourcing map, events, performance trends, cost analysis
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Globe, RefreshCw, CheckCircle, XCircle, AlertTriangle,
  Crown, Shield, Truck, TrendingUp, Package, Zap,
  Clock, ArrowUpDown, Star, Signal, BarChart3, Activity,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip,
} from 'recharts';
import {
  useSupplierDashboardStats,
  useSupplierHealth,
  useSmartEvents,
  useTriggerSupplierSync,
  useProductSourcingData,
} from '@/hooks/admin/useSmartDecisionEngine';

const CHART_COLORS = {
  primary: 'hsl(221, 83%, 53%)',
  success: 'hsl(142, 76%, 36%)',
  warning: 'hsl(38, 92%, 50%)',
  destructive: 'hsl(0, 84%, 60%)',
};

function StatCard({ title, value, subtitle, icon: Icon, accent = 'primary', loading }: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ElementType; accent?: string; loading?: boolean;
}) {
  const accentMap: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    destructive: 'bg-destructive/10 text-destructive',
  };

  if (loading) return <Card><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
          <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${accentMap[accent] || accentMap.primary}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="text-xl font-bold text-foreground">{value}</div>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function useSupplierSyncTrends() {
  return useQuery({
    queryKey: ['admin-supplier-sync-trends'],
    queryFn: async () => {
      const { data } = await supabase
        .from('channel_sync_logs')
        .select('status, duration_ms, items_succeeded, items_failed, started_at, channel_id')
        .gte('started_at', new Date(Date.now() - 30 * 86400000).toISOString())
        .order('started_at', { ascending: true })

      const byDay: Record<string, { day: string; success: number; failed: number; avgDuration: number; count: number }> = {}
      for (const r of data || []) {
        const day = new Date(r.started_at || '').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
        if (!byDay[day]) byDay[day] = { day, success: 0, failed: 0, avgDuration: 0, count: 0 }
        if (r.status === 'completed') byDay[day].success++
        if (r.status === 'failed') byDay[day].failed++
        byDay[day].avgDuration += r.duration_ms || 0
        byDay[day].count++
      }
      return Object.values(byDay).map(d => ({
        ...d,
        avgDuration: d.count > 0 ? Math.round(d.avgDuration / d.count / 1000) : 0,
      }))
    },
    staleTime: 5 * 60_000,
  })
}

export default function SupplierControlTab() {
  const [view, setView] = useState<'health' | 'sourcing' | 'events' | 'trends'>('health');
  const { data: stats, isLoading: statsLoading } = useSupplierDashboardStats();
  const { data: health = [], isLoading: healthLoading, refetch: refetchHealth } = useSupplierHealth();
  const { data: events = [] } = useSmartEvents();
  const { data: sourcing = [] } = useProductSourcingData();
  const { data: trends = [] } = useSupplierSyncTrends();
  const syncMutation = useTriggerSupplierSync();

  const criticalEvents = events.filter(e => e.severity === 'critical' && !e.resolved);

  // Reliability score from health data
  const avgUptime = health.length > 0 ? Math.round(health.reduce((s, h) => s + (h.uptime_percent || 0), 0) / health.length) : 100
  const avgErrorRate = health.length > 0 ? Math.round(health.reduce((s, h) => s + (h.error_rate || 0), 0) / health.length * 10) / 10 : 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Supplier Control Center</h2>
          <p className="text-xs text-muted-foreground">Monitoring, scoring, performance et fallback intelligent</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => refetchHealth()} disabled={healthLoading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${healthLoading ? 'animate-spin' : ''}`} />Actualiser
          </Button>
          <Button size="sm" className="h-8 text-xs" onClick={() => syncMutation.mutate({ syncType: 'full' })} disabled={syncMutation.isPending}>
            <Zap className="h-3.5 w-3.5 mr-1.5" />Sync globale
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
        <StatCard title="Fournisseurs" value={stats?.totalSuppliers || 0} subtitle="Total configurés" icon={Globe} loading={statsLoading} />
        <StatCard title="Connecteurs OK" value={stats?.activeConnectors || 0} subtitle="APIs actives" icon={Signal} loading={statsLoading} accent="success" />
        <StatCard title="Erreurs" value={stats?.errorConnectors || 0} subtitle="Connecteurs en panne" icon={XCircle} loading={statsLoading} accent="destructive" />
        <StatCard title="Uptime moyen" value={`${avgUptime}%`} subtitle="Performance globale" icon={CheckCircle} loading={statsLoading} accent={avgUptime >= 95 ? 'success' : 'warning'} />
        <StatCard title="Syncs 24h" value={stats?.syncedLast24h || 0} subtitle="Jobs complétés" icon={RefreshCw} loading={statsLoading} />
        <StatCard title="Taux erreur" value={`${avgErrorRate}%`} subtitle="Moyenne connecteurs" icon={AlertTriangle} loading={statsLoading} accent={avgErrorRate > 5 ? 'destructive' : 'success'} />
      </div>

      {/* Critical banner */}
      {criticalEvents.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-semibold text-destructive">
                {criticalEvents.length} événement(s) critique(s) — {criticalEvents[0]?.message}
              </span>
            </div>
            <Button variant="outline" size="sm" className="h-7 text-xs border-destructive/30 text-destructive" onClick={() => setView('events')}>
              Voir tout
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sub-navigation */}
      <div className="flex gap-1 bg-muted/50 p-0.5 rounded-lg w-fit">
        {[
          { key: 'health' as const, label: 'Santé connecteurs', icon: Signal },
          { key: 'trends' as const, label: 'Tendances', icon: TrendingUp },
          { key: 'sourcing' as const, label: 'Sourcing Map', icon: Package },
          { key: 'events' as const, label: 'Événements', icon: AlertTriangle, badge: criticalEvents.length },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setView(item.key)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${
              view === item.key ? 'bg-background shadow-sm font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
            {(item.badge || 0) > 0 && (
              <span className="h-4 min-w-4 bg-destructive text-destructive-foreground rounded-full text-[9px] font-bold flex items-center justify-center px-1">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Health */}
      {view === 'health' && <HealthView connectors={health} loading={healthLoading} onSync={(id) => syncMutation.mutate({ supplierId: id })} />}

      {/* Trends */}
      {view === 'trends' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />Syncs succès/échecs (30j)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={trends} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="success" name="Succès" fill={CHART_COLORS.success} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="failed" name="Échecs" fill={CHART_COLORS.destructive} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">Aucune donnée</div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />Durée moyenne sync (30j)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={trends} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="syncDurGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="avgDuration" name="Durée (s)" stroke={CHART_COLORS.primary} fill="url(#syncDurGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">Aucune donnée</div>
              )}
            </CardContent>
          </Card>

          {/* Connector reliability ranking */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />Classement fiabilité des connecteurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...health].sort((a, b) => (b.uptime_percent || 0) - (a.uptime_percent || 0)).map((conn, idx) => {
                  const score = conn.uptime_percent || 0
                  return (
                    <div key={conn.supplier_id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors">
                      <span className={`text-xs font-bold w-6 text-center ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                        #{idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">{conn.supplier_name}</span>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-muted-foreground">Erreur: <b className={conn.error_rate > 5 ? 'text-destructive' : 'text-foreground'}>{conn.error_rate}%</b></span>
                            <span className="text-muted-foreground">Latence: <b className="text-foreground font-mono">{conn.avg_latency_ms}ms</b></span>
                            <span className={`font-bold ${score >= 95 ? 'text-emerald-600 dark:text-emerald-400' : score >= 80 ? 'text-amber-600' : 'text-destructive'}`}>{score}%</span>
                          </div>
                        </div>
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${score >= 95 ? 'bg-emerald-500' : score >= 80 ? 'bg-amber-500' : 'bg-destructive'}`} style={{ width: `${score}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
                {health.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">Aucun connecteur</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sourcing */}
      {view === 'sourcing' && <SourcingView data={sourcing} />}
      {/* Events */}
      {view === 'events' && <EventsView events={events} />}
    </div>
  );
}

// ─── Health View ─────────────────────────────────────────────────
function HealthView({ connectors, loading, onSync }: {
  connectors: any[]; loading: boolean; onSync: (id: string) => void;
}) {
  const statusColors: Record<string, string> = {
    connected: 'bg-emerald-500', degraded: 'bg-amber-500', error: 'bg-red-500', offline: 'bg-muted-foreground/30',
  };
  const statusLabels: Record<string, string> = {
    connected: 'Connecté', degraded: 'Dégradé', error: 'Erreur', offline: 'Hors ligne',
  };

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  if (connectors.length === 0) return (
    <Card><CardContent className="py-12 text-center">
      <Globe className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-60" />
      <p className="text-sm font-medium text-foreground">Aucun connecteur configuré</p>
      <p className="text-xs text-muted-foreground mt-1">Ajoutez des fournisseurs pour activer le monitoring</p>
    </CardContent></Card>
  );

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {connectors.map(conn => (
        <Card key={conn.supplier_id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusColors[conn.status]}`} />
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${statusColors[conn.status]}`} />
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{conn.supplier_name}</h4>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{conn.api_type}</p>
                </div>
              </div>
              <Badge variant={conn.status === 'connected' ? 'default' : conn.status === 'error' ? 'destructive' : 'secondary'} className="text-[10px] h-5">
                {statusLabels[conn.status] || conn.status}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs mb-3">
              <div>
                <span className="text-muted-foreground">Uptime</span>
                <p className="font-semibold text-foreground">{conn.uptime_percent}%</p>
              </div>
              <div>
                <span className="text-muted-foreground">Taux erreur</span>
                <p className={`font-semibold ${conn.error_rate > 10 ? 'text-destructive' : 'text-foreground'}`}>{conn.error_rate}%</p>
              </div>
              <div>
                <span className="text-muted-foreground">Latence</span>
                <p className="font-semibold text-foreground font-mono">{conn.avg_latency_ms}ms</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                Dernière sync: {conn.last_sync_at ? new Date(conn.last_sync_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Jamais'}
              </span>
              <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => onSync(conn.supplier_id)}>
                <RefreshCw className="h-3 w-3 mr-1" />Sync
              </Button>
            </div>
            {conn.last_error && (
              <div className="mt-2 p-2 rounded-md bg-destructive/5 border border-destructive/20">
                <p className="text-[10px] text-destructive truncate">{conn.last_error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Sourcing Map View ───────────────────────────────────────────
function SourcingView({ data }: { data: any[] }) {
  if (data.length === 0) return (
    <Card><CardContent className="py-12 text-center">
      <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-60" />
      <p className="text-sm font-medium">Aucun mapping produit-fournisseur</p>
      <p className="text-xs text-muted-foreground mt-1">Configurez vos sources dans le module fournisseurs</p>
    </CardContent></Card>
  );

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-primary" />Multi-Source Map ({data.length} produits)
          </CardTitle>
          <Badge variant="outline" className="text-[10px]">{data.filter(d => d.has_fallback).length} avec fallback</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {data.slice(0, 20).map(item => (
            <div key={item.product_id} className="flex items-center gap-3 py-2.5 px-2 -mx-2 border-b border-border/40 last:border-0 hover:bg-muted/30 rounded-md transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">{item.product_title}</p>
                <p className="text-[10px] text-muted-foreground">€{item.product_price?.toFixed(2)} · Stock: {item.product_stock}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {item.suppliers.slice(0, 3).map((sup: any) => (
                  <div key={sup.id} className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] border ${
                    sup.is_primary ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-muted/50 border-border'
                  }`}>
                    {sup.is_primary && <Crown className="h-3 w-3" />}
                    <span className="font-medium truncate max-w-[80px]">{sup.supplier_name}</span>
                    <span className="font-mono text-muted-foreground">{sup.global_score}</span>
                  </div>
                ))}
                {item.suppliers.length > 3 && (
                  <Badge variant="outline" className="text-[9px] h-5">+{item.suppliers.length - 3}</Badge>
                )}
              </div>
              {item.has_fallback ? (
                <Shield className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Events View ─────────────────────────────────────────────────
function EventsView({ events }: { events: any[] }) {
  const severityConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    critical: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/30' },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/30' },
    info: { icon: CheckCircle, color: 'text-muted-foreground', bg: 'border-border' },
  };

  if (events.length === 0) return (
    <Card><CardContent className="py-12 text-center">
      <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-3 opacity-80" />
      <p className="text-sm font-medium">Aucun événement</p>
      <p className="text-xs text-muted-foreground mt-1">Le système fonctionne normalement</p>
    </CardContent></Card>
  );

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Événements système ({events.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {events.map(event => {
            const config = severityConfig[event.severity] || severityConfig.info;
            const IconComp = config.icon;
            return (
              <div key={event.id} className={`p-3 rounded-lg border ${config.bg} transition-colors`}>
                <div className="flex items-start gap-2.5">
                  <IconComp className={`h-4 w-4 ${config.color} mt-0.5 shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">{event.event_type}</span>
                      <Badge variant="outline" className="text-[9px] h-4">{event.severity}</Badge>
                      {event.resolved && <Badge className="text-[9px] h-4 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Résolu</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{event.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                      {new Date(event.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
