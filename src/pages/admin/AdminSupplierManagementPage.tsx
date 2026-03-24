/**
 * Admin Supplier Management Center
 * DSers/AutoDS-level supplier management with 4 views
 */

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Package, Truck, BarChart3, RefreshCcw, Search, Crown, Shield,
  AlertTriangle, CheckCircle2, XCircle, Clock, Zap, ArrowUpDown,
  Star, Globe, TrendingUp, TrendingDown, Activity, Settings2,
  ChevronRight, PlugZap, Signal, Layers
} from 'lucide-react';
import {
  useSupplierOverview,
  useProductSourcingMap,
  useSupplierSyncJobs,
  useSupplierAnalyticsKPIs,
  type SupplierOverview,
  type SyncJobEntry,
} from '@/hooks/admin/useSupplierManagement';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// ─── KPI Card ───
function KpiCard({ label, value, icon: Icon, trend, color = 'primary' }: {
  label: string; value: string | number; icon: any; trend?: string; color?: string;
}) {
  const colorMap: Record<string, string> = {
    primary: 'text-primary bg-primary/10',
    success: 'text-emerald-600 bg-emerald-500/10',
    warning: 'text-amber-600 bg-amber-500/10',
    error: 'text-red-600 bg-red-500/10',
    info: 'text-blue-600 bg-blue-500/10',
  };
  return (
    <Card className="border-border/50">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
          </div>
          <div className={`p-3 rounded-xl ${colorMap[color] || colorMap.primary}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Status Badge ───
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any; label: string }> = {
    active: { variant: 'default', icon: CheckCircle2, label: 'Actif' },
    connected: { variant: 'default', icon: CheckCircle2, label: 'Connecté' },
    completed: { variant: 'default', icon: CheckCircle2, label: 'Terminé' },
    pending: { variant: 'secondary', icon: Clock, label: 'En attente' },
    running: { variant: 'outline', icon: RefreshCcw, label: 'En cours' },
    processing: { variant: 'outline', icon: RefreshCcw, label: 'En cours' },
    error: { variant: 'destructive', icon: XCircle, label: 'Erreur' },
    failed: { variant: 'destructive', icon: XCircle, label: 'Échoué' },
    inactive: { variant: 'secondary', icon: Clock, label: 'Inactif' },
    disconnected: { variant: 'secondary', icon: XCircle, label: 'Déconnecté' },
  };
  const c = config[status] || config.inactive;
  const Icon = c.icon;
  return (
    <Badge variant={c.variant} className="gap-1 text-xs">
      <Icon className="h-3 w-3" />
      {c.label}
    </Badge>
  );
}

// ─── Tier Badge ───
function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    platinum: 'bg-violet-500/10 text-violet-700 border-violet-300',
    gold: 'bg-amber-500/10 text-amber-700 border-amber-300',
    silver: 'bg-slate-400/10 text-slate-600 border-slate-300',
    standard: 'bg-muted text-muted-foreground border-border',
  };
  return (
    <Badge variant="outline" className={`text-[10px] uppercase ${colors[tier] || colors.standard}`}>
      {tier}
    </Badge>
  );
}

// ─── Score Bar ───
function ScoreBar({ label, value, max = 5 }: { label: string; value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 text-muted-foreground shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right font-medium">{value.toFixed(1)}</span>
    </div>
  );
}

// ═══════════════════════════════════════════
// VIEW 1: Suppliers List
// ═══════════════════════════════════════════
function SuppliersListView({ suppliers }: { suppliers: SupplierOverview[] }) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => 
    suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase())),
    [suppliers, search]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un fournisseur..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10" />
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowUpDown className="h-4 w-4" /> Trier
        </Button>
      </div>
      
      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Aucun fournisseur trouvé</p>
            <p className="text-xs text-muted-foreground mt-1">Connectez vos premiers fournisseurs depuis le catalogue</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map(s => (
            <Card key={s.id} className="border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  {/* Logo */}
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    {s.logo_url ? (
                      <img src={s.logo_url} alt={s.name} className="w-8 h-8 rounded object-contain" />
                    ) : (
                      <Package className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm truncate">{s.name}</h3>
                      <TierBadge tier={s.tier} />
                      <StatusBadge status={s.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {s.country && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{s.country}</span>}
                      <span className="flex items-center gap-1"><Package className="h-3 w-3" />{s.products_count} produits</span>
                      <span className="flex items-center gap-1"><Truck className="h-3 w-3" />{s.total_orders} commandes</span>
                      {s.avg_delivery_days && (
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.avg_delivery_days}j</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Score */}
                  <div className="hidden lg:block w-48">
                    {s.score ? (
                      <div className="space-y-1">
                        <ScoreBar label="Prix" value={s.score.price_score} />
                        <ScoreBar label="Livraison" value={s.score.delivery_score} />
                        <ScoreBar label="Fiabilité" value={s.score.reliability_score} />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Pas de score</span>
                    )}
                  </div>
                  
                  {/* Global Score */}
                  <div className="text-center px-3">
                    <div className={`text-xl font-bold ${
                      (s.score?.overall_score || 0) >= 4 ? 'text-emerald-600' :
                      (s.score?.overall_score || 0) >= 3 ? 'text-amber-600' : 'text-muted-foreground'
                    }`}>
                      {s.score ? s.score.overall_score.toFixed(1) : '—'}
                    </div>
                    <p className="text-[10px] text-muted-foreground">/5.0</p>
                  </div>
                  
                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 px-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < Math.round(s.rating) ? 'text-amber-400 fill-amber-400' : 'text-muted'}`} />
                    ))}
                  </div>
                  
                  {/* Connection indicator */}
                  <div className="shrink-0">
                    {s.connection ? (
                      <div className="flex items-center gap-1 text-xs text-emerald-600">
                        <Signal className="h-3 w-3" />
                        <span>API</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <PlugZap className="h-3 w-3" />
                        <span>Manuel</span>
                      </div>
                    )}
                  </div>
                  
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// VIEW 2: Product Sourcing Map
// ═══════════════════════════════════════════
function ProductSourcingView() {
  const { data: sourcingMap = [], isLoading } = useProductSourcingMap();
  const [search, setSearch] = useState('');
  
  const filtered = useMemo(() =>
    sourcingMap.filter(p => p.product_title.toLowerCase().includes(search.toLowerCase())),
    [sourcingMap, search]
  );

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un produit..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10" />
        </div>
        <Badge variant="outline" className="text-xs">{filtered.length} produits multi-source</Badge>
      </div>
      
      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Aucun produit avec multi-fournisseurs</p>
            <p className="text-xs text-muted-foreground mt-1">Mappez plusieurs fournisseurs à vos produits pour activer le fallback automatique</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(product => (
            <Card key={product.product_id} className="border-border/50">
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-sm">{product.product_title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>Prix: <span className="font-semibold text-foreground">{product.product_price.toFixed(2)}€</span></span>
                      <span>Stock: <span className="font-semibold text-foreground">{product.product_stock}</span></span>
                      <span>{product.suppliers.length} fournisseur{product.suppliers.length > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {product.suppliers.map((sup, i) => (
                    <div key={sup.mapping_id}
                      className={`flex items-center gap-3 p-2.5 rounded-lg text-xs ${
                        sup.is_primary ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50'
                      }`}>
                      {/* Priority indicator */}
                      <div className="w-6 text-center">
                        {sup.is_primary ? (
                          <Crown className="h-4 w-4 text-amber-500 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground font-mono">#{i + 1}</span>
                        )}
                      </div>
                      
                      <span className="font-medium w-32 truncate">{sup.supplier_name}</span>
                      
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-muted-foreground">
                          Prix: <span className="font-semibold text-foreground">{sup.supplier_price.toFixed(2)}€</span>
                        </span>
                        <span className="text-muted-foreground">
                          Stock: <span className={`font-semibold ${sup.supplier_stock > 10 ? 'text-emerald-600' : sup.supplier_stock > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                            {sup.supplier_stock}
                          </span>
                        </span>
                        {sup.lead_time_days && (
                          <span className="text-muted-foreground">
                            Délai: <span className="font-semibold text-foreground">{sup.lead_time_days}j</span>
                          </span>
                        )}
                        <span className={`font-semibold ${sup.margin > 30 ? 'text-emerald-600' : sup.margin > 15 ? 'text-amber-600' : 'text-red-600'}`}>
                          Marge: {sup.margin}%
                        </span>
                      </div>
                      
                      {sup.auto_switch_enabled && (
                        <Badge variant="outline" className="text-[10px] gap-1 shrink-0">
                          <Zap className="h-2.5 w-2.5" /> Auto-switch
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// VIEW 3: Sync Monitor
// ═══════════════════════════════════════════
function SyncMonitorView() {
  const { data: jobs = [], isLoading } = useSupplierSyncJobs();
  
  const running = jobs.filter(j => j.status === 'running' || j.status === 'processing');
  const failed = jobs.filter(j => j.status === 'failed');
  const completed = jobs.filter(j => j.status === 'completed');
  
  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Total jobs" value={jobs.length} icon={Activity} color="info" />
        <KpiCard label="En cours" value={running.length} icon={RefreshCcw} color="primary" />
        <KpiCard label="Réussis" value={completed.length} icon={CheckCircle2} color="success" />
        <KpiCard label="Échoués" value={failed.length} icon={XCircle} color="error" />
      </div>
      
      {/* Running jobs */}
      {running.length > 0 && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <RefreshCcw className="h-4 w-4 animate-spin text-primary" />
              Jobs en cours ({running.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {running.map(job => (
              <div key={job.id} className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{job.supplier_name}</span>
                    <Badge variant="outline" className="text-[10px]">{job.job_type}</Badge>
                  </div>
                  <Progress value={job.products_processed > 0 ? 50 : 10} className="h-1 mt-2" />
                </div>
                <span className="text-xs text-muted-foreground">{job.products_processed} traités</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* All jobs list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Historique des synchronisations</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {jobs.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">Aucun job de synchronisation</p>
              ) : (
                jobs.map(job => (
                  <SyncJobRow key={job.id} job={job} />
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function SyncJobRow({ job }: { job: SyncJobEntry }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <StatusBadge status={job.status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{job.supplier_name}</span>
          <Badge variant="outline" className="text-[10px]">{job.job_type}</Badge>
        </div>
        {job.error_message && (
          <p className="text-xs text-red-500 mt-0.5 truncate">{job.error_message}</p>
        )}
      </div>
      <div className="text-right text-xs text-muted-foreground shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-emerald-600">{job.products_created}+</span>
          <span className="text-blue-600">{job.products_updated}↻</span>
          {job.products_failed > 0 && <span className="text-red-600">{job.products_failed}✗</span>}
        </div>
        {job.started_at && (
          <span>{formatDistanceToNow(new Date(job.started_at), { addSuffix: true, locale: fr })}</span>
        )}
        {job.duration_seconds != null && <span> · {job.duration_seconds}s</span>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// VIEW 4: Supplier Analytics
// ═══════════════════════════════════════════
function SupplierAnalyticsView({ suppliers }: { suppliers: SupplierOverview[] }) {
  const ranked = useMemo(() => 
    [...suppliers]
      .filter(s => s.score)
      .sort((a, b) => (b.score?.overall_score || 0) - (a.score?.overall_score || 0)),
    [suppliers]
  );
  
  return (
    <div className="space-y-6">
      {/* Top performers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            Classement fournisseurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ranked.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">
              Aucun fournisseur noté. Les scores sont calculés automatiquement après les premières commandes.
            </p>
          ) : (
            <div className="space-y-3">
              {ranked.map((s, i) => (
                <div key={s.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                    i === 0 ? 'bg-amber-500/20 text-amber-600' :
                    i === 1 ? 'bg-slate-400/20 text-slate-600' :
                    i === 2 ? 'bg-orange-400/20 text-orange-600' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{s.name}</span>
                      <TierBadge tier={s.tier} />
                      {s.score?.recommendation === 'preferred' && (
                        <Badge className="text-[10px] bg-emerald-500/10 text-emerald-700 border-emerald-300" variant="outline">
                          ⭐ Préféré
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      <ScoreBar label="Prix" value={s.score!.price_score} />
                      <ScoreBar label="Livraison" value={s.score!.delivery_score} />
                      <ScoreBar label="Fiabilité" value={s.score!.reliability_score} />
                      <ScoreBar label="Qualité" value={s.score!.quality_score} />
                    </div>
                  </div>
                  <div className="text-center px-4">
                    <div className={`text-2xl font-bold ${
                      s.score!.overall_score >= 4 ? 'text-emerald-600' :
                      s.score!.overall_score >= 3 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {s.score!.overall_score.toFixed(1)}
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase">Score global</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Performance metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Délais de livraison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suppliers.filter(s => s.avg_delivery_days).slice(0, 8).map(s => (
                <div key={s.id} className="flex items-center justify-between text-xs">
                  <span className="truncate">{s.name}</span>
                  <span className={`font-semibold ${
                    (s.avg_delivery_days || 99) <= 7 ? 'text-emerald-600' :
                    (s.avg_delivery_days || 99) <= 14 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {s.avg_delivery_days}j
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Taux de retour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suppliers.filter(s => s.return_rate > 0).slice(0, 8).map(s => (
                <div key={s.id} className="flex items-center justify-between text-xs">
                  <span className="truncate">{s.name}</span>
                  <span className={`font-semibold ${
                    s.return_rate <= 2 ? 'text-emerald-600' :
                    s.return_rate <= 5 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {s.return_rate}%
                  </span>
                </div>
              ))}
              {suppliers.filter(s => s.return_rate > 0).length === 0 && (
                <p className="text-center py-4 text-muted-foreground text-xs">Aucune donnée de retour</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN: Supplier Management Center
// ═══════════════════════════════════════════
export default function AdminSupplierManagementPage() {
  const { data: suppliers = [], isLoading: loadingSuppliers } = useSupplierOverview();
  const { data: kpis } = useSupplierAnalyticsKPIs();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Supplier Management Center</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestion centralisée, scoring, multi-fournisseurs et monitoring temps réel
        </p>
      </div>
      
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <KpiCard label="Fournisseurs" value={kpis?.totalSuppliers || 0} icon={Package} color="primary" />
        <KpiCard label="Mappings produits" value={kpis?.totalMappings || 0} icon={Layers} color="info" />
        <KpiCard label="Connecteurs actifs" value={kpis?.activeConnections || 0} icon={PlugZap} color="success" />
        <KpiCard label="Taux sync" value={`${kpis?.syncSuccessRate || 100}%`} icon={RefreshCcw} color={kpis?.syncSuccessRate && kpis.syncSuccessRate < 90 ? 'warning' : 'success'} />
        <KpiCard label="Syncs 24h" value={kpis?.syncsLast24h || 0} icon={Activity} color="info" />
        <KpiCard label="Score moyen" value={kpis?.avgSupplierScore?.toFixed(1) || '—'} icon={Star} color="primary" />
      </div>
      
      {/* Alert bar for errors */}
      {(kpis?.errorConnections || 0) > 0 && (
        <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
          <span className="text-sm text-red-700">
            {kpis!.errorConnections} connecteur{kpis!.errorConnections > 1 ? 's' : ''} en erreur — intervention requise
          </span>
          <Button size="sm" variant="destructive" className="ml-auto text-xs">
            Voir les erreurs
          </Button>
        </div>
      )}
      
      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="gap-2 text-xs">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Fournisseurs</span>
          </TabsTrigger>
          <TabsTrigger value="sourcing" className="gap-2 text-xs">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Sourcing Map</span>
          </TabsTrigger>
          <TabsTrigger value="sync" className="gap-2 text-xs">
            <RefreshCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Sync Monitor</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2 text-xs">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <SuppliersListView suppliers={suppliers} />
        </TabsContent>
        
        <TabsContent value="sourcing" className="mt-6">
          <ProductSourcingView />
        </TabsContent>
        
        <TabsContent value="sync" className="mt-6">
          <SyncMonitorView />
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-6">
          <SupplierAnalyticsView suppliers={suppliers} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
