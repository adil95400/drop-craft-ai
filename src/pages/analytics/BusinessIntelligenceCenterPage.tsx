import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useBusinessMetrics, useProductAnalytics, useCustomerAnalytics } from '@/hooks/useBIMetrics';
import { useFinancialManagement } from '@/hooks/useFinancialManagement';
import { useRealPredictiveAI } from '@/hooks/useRealPredictiveAI';
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Package, ShoppingCart,
  ArrowUpRight, ArrowDownRight, Brain, Target, Zap, PieChart, Activity,
  AlertTriangle, CheckCircle2, Crown, Repeat, Eye, Clock
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RPieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--destructive))',
  'hsl(var(--warning, 45 93% 47%))',
  'hsl(var(--accent))',
  'hsl(var(--muted-foreground))',
];

// ─── Executive Dashboard ────────────────────────────────────────────

function ExecutiveDashboard({ period }: { period: '7d' | '30d' | '90d' }) {
  const { data: metrics, isLoading } = useBusinessMetrics(period);
  const { pnl, monthlyBreakdown } = useFinancialManagement();

  if (isLoading || !metrics) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full" />)}</div>;

  const kpis = [
    { label: 'Chiffre d\'affaires', value: fmt(metrics.revenue.current), change: metrics.revenue.change, icon: DollarSign, color: 'text-primary' },
    { label: 'Commandes', value: metrics.orders.current.toString(), change: metrics.orders.change, icon: ShoppingCart, color: 'text-primary' },
    { label: 'Panier moyen', value: fmt(metrics.avgOrderValue), icon: Target, color: 'text-primary' },
    { label: 'Nouveaux clients', value: metrics.customers.new.toString(), change: metrics.customers.change, icon: Users, color: 'text-primary' },
    { label: 'Bénéfice net', value: fmt(pnl.netProfit), icon: TrendingUp, color: pnl.netProfit >= 0 ? 'text-primary' : 'text-destructive' },
    { label: 'Marge', value: `${pnl.margin.toFixed(1)}%`, icon: PieChart, color: pnl.margin >= 20 ? 'text-primary' : 'text-destructive' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => (
          <Card key={i} className="group hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg bg-muted ${kpi.color}`}>
                  <kpi.icon className="h-4 w-4" />
                </div>
                <span className="text-xs text-muted-foreground truncate">{kpi.label}</span>
              </div>
              <p className="text-xl font-bold">{kpi.value}</p>
              {kpi.change !== undefined && (
                <div className={`flex items-center gap-1 text-xs mt-1 ${kpi.change >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {kpi.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {fmtPct(kpi.change)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue & P&L Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Évolution du CA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={metrics.revenueByDay}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))"
                  tickFormatter={v => format(new Date(v), 'dd/MM')} />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))"
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} labelFormatter={v => format(new Date(v), 'dd MMM yyyy', { locale: fr })} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revenueGrad)" strokeWidth={2} name="CA" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* P&L Monthly */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              P&L Mensuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="revenue" name="CA" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Dépenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Profit" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      {metrics.topProducts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              Top 5 Produits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.topProducts.map((p, i) => {
                const maxRevenue = metrics.topProducts[0]?.revenue || 1;
                return (
                  <div key={p.id} className="flex items-center gap-4">
                    <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={(p.revenue / maxRevenue) * 100} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{p.sales} ventes</span>
                      </div>
                    </div>
                    <span className="font-mono font-medium text-sm">{fmt(p.revenue)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Customer Intelligence Tab ──────────────────────────────────────

function CustomerIntelligenceTab() {
  const { data: analytics, isLoading } = useCustomerAnalytics();

  if (isLoading || !analytics) return <div className="space-y-4">{[1,2].map(i => <Skeleton key={i} className="h-40 w-full" />)}</div>;

  const segmentData = [
    { name: 'VIP', value: analytics.segments.vip, color: COLORS[0] },
    { name: 'Régulier', value: analytics.segments.regular, color: COLORS[1] },
    { name: 'Occasionnel', value: analytics.segments.occasional, color: COLORS[2] },
    { name: 'Inactif', value: analytics.segments.inactive, color: COLORS[4] },
  ].filter(s => s.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total clients', value: analytics.totalCustomers, icon: Users },
          { label: 'Avec commandes', value: analytics.withOrders, icon: ShoppingCart },
          { label: 'Taux de rétention', value: `${analytics.repeatRate.toFixed(1)}%`, icon: Repeat },
          { label: 'Dépense moyenne', value: fmt(analytics.avgSpent), icon: DollarSign },
        ].map((kpi, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted text-primary"><kpi.icon className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-xl font-bold">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Segment Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Segmentation clients</CardTitle>
          </CardHeader>
          <CardContent>
            {segmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <RPieChart>
                  <Pie data={segmentData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {segmentData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[240px] text-muted-foreground">Pas assez de données</div>
            )}
          </CardContent>
        </Card>

        {/* Customer health */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Santé de la base client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Clients VIP (500€+)', value: analytics.segments.vip, total: analytics.totalCustomers, icon: Crown, color: 'text-primary' },
              { label: 'Clients fidèles (>1 commande)', value: analytics.repeatCustomers, total: analytics.totalCustomers, icon: Repeat, color: 'text-primary' },
              { label: 'Clients actifs', value: analytics.withOrders, total: analytics.totalCustomers, icon: CheckCircle2, color: 'text-primary' },
              { label: 'Clients inactifs', value: analytics.segments.inactive, total: analytics.totalCustomers, icon: Clock, color: 'text-muted-foreground' },
            ].map((item, i) => {
              const pct = analytics.totalCustomers > 0 ? (item.value / analytics.totalCustomers * 100) : 0;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <item.icon className={`h-4 w-4 ${item.color}`} />
                      <span>{item.label}</span>
                    </div>
                    <span className="font-mono text-muted-foreground">{item.value} ({pct.toFixed(0)}%)</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              );
            })}
            <div className="pt-3 border-t">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Revenu total clients</span>
                <span className="font-mono font-bold text-primary">{fmt(analytics.totalRevenue)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Product Performance Tab ────────────────────────────────────────

function ProductPerformanceTab() {
  const { data: analytics, isLoading } = useProductAnalytics();
  const { data: metrics } = useBusinessMetrics('30d');

  if (isLoading || !analytics) return <div className="space-y-4">{[1,2].map(i => <Skeleton key={i} className="h-40 w-full" />)}</div>;

  const avgMarginNum = typeof analytics.avgMargin === 'number' ? analytics.avgMargin : 0;
  const healthScore = Math.round(
    (analytics.activeProducts / Math.max(analytics.totalProducts, 1)) * 40 +
    (avgMarginNum > 0 ? Math.min(avgMarginNum / 50 * 30, 30) : 0) +
    (analytics.outOfStock === 0 ? 30 : Math.max(0, 30 - analytics.outOfStock * 5))
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total produits', value: analytics.totalProducts, icon: Package },
          { label: 'Actifs', value: analytics.activeProducts, icon: CheckCircle2 },
          { label: 'Stock bas', value: analytics.lowStock, icon: AlertTriangle, alert: analytics.lowStock > 0 },
          { label: 'Ruptures', value: analytics.outOfStock, icon: AlertTriangle, alert: analytics.outOfStock > 0 },
          { label: 'Marge moyenne', value: `${analytics.avgMargin.toFixed(1)}%`, icon: TrendingUp },
        ].map((kpi, i) => (
          <Card key={i} className={kpi.alert ? 'border-destructive/50' : ''}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.alert ? 'bg-destructive/10 text-destructive' : 'bg-muted text-primary'}`}>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Score */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Score de santé catalogue</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-6">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray={`${healthScore}, 100`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{healthScore}</span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </div>
            <Badge className="mt-4" variant={healthScore >= 70 ? 'default' : healthScore >= 40 ? 'secondary' : 'destructive'}>
              {healthScore >= 70 ? 'Excellent' : healthScore >= 40 ? 'À améliorer' : 'Critique'}
            </Badge>
          </CardContent>
        </Card>

        {/* Top products */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Meilleures ventes</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics?.topProducts && metrics.topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={metrics.topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="CA" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">Pas assez de données de vente</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── AI Predictions Tab ─────────────────────────────────────────────

function AIPredictionsTab() {
  const { insights, salesData, generateInsights, isGenerating, isLoading } = useRealPredictiveAI();

  const revenueForecasts = useMemo(() => {
    if (!salesData || salesData.length === 0) return [];
    // Simple 30d forecast from sales trend
    const recent = salesData.slice(-14);
    const avgDaily = recent.reduce((s, d) => s + d.revenue, 0) / recent.length;
    const trend = recent.length > 1 ? (recent[recent.length - 1].revenue - recent[0].revenue) / recent.length : 0;

    return Array.from({ length: 30 }, (_, i) => ({
      day: `J+${i + 1}`,
      forecast: Math.max(0, Math.round(avgDaily + trend * (i + 1))),
      optimistic: Math.max(0, Math.round((avgDaily + trend * (i + 1)) * 1.15)),
      pessimistic: Math.max(0, Math.round((avgDaily + trend * (i + 1)) * 0.85)),
    }));
  }, [salesData]);

  const totalForecast30d = revenueForecasts.reduce((s, d) => s + d.forecast, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Prédictions IA
          </h3>
          <p className="text-sm text-muted-foreground">Analyses prédictives basées sur vos données réelles</p>
        </div>
        <Button onClick={() => generateInsights()} disabled={isGenerating} size="sm">
          <Zap className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-pulse' : ''}`} />
          {isGenerating ? 'Analyse...' : 'Générer des insights'}
        </Button>
      </div>

      {/* Forecast KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Prévision CA 30j</p>
            <p className="text-2xl font-bold text-primary">{fmt(totalForecast30d)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Scénario optimiste</p>
            <p className="text-2xl font-bold">{fmt(Math.round(totalForecast30d * 1.15))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Scénario pessimiste</p>
            <p className="text-2xl font-bold text-muted-foreground">{fmt(Math.round(totalForecast30d * 0.85))}</p>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Chart */}
      {revenueForecasts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Projection des revenus (30 jours)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueForecasts}>
                <defs>
                  <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval={4} />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Area type="monotone" dataKey="optimistic" stroke="hsl(var(--primary) / 0.3)" fill="none" strokeDasharray="4 4" name="Optimiste" />
                <Area type="monotone" dataKey="forecast" stroke="hsl(var(--primary))" fill="url(#forecastGrad)" strokeWidth={2} name="Prévision" />
                <Area type="monotone" dataKey="pessimistic" stroke="hsl(var(--destructive) / 0.3)" fill="none" strokeDasharray="4 4" name="Pessimiste" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      {insights && insights.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Insights IA récents</h3>
          {insights.slice(0, 6).map((insight: any, i: number) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${
                  insight.type === 'positive' ? 'bg-primary/10 text-primary' :
                  insight.type === 'negative' ? 'bg-destructive/10 text-destructive' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {insight.type === 'positive' ? <TrendingUp className="h-4 w-4" /> :
                   insight.type === 'negative' ? <TrendingDown className="h-4 w-4" /> :
                   <Eye className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm">{insight.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                  {insight.recommendation && (
                    <p className="text-xs text-primary mt-2 flex items-center gap-1">
                      <Zap className="h-3 w-3" /> {insight.recommendation}
                    </p>
                  )}
                </div>
                {insight.confidence && (
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {Math.round(insight.confidence * 100)}%
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────

export default function BusinessIntelligenceCenterPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  return (
    <ChannablePageWrapper
      title="Business Intelligence"
      description="Vue 360° : P&L, KPIs, intelligence client et prédictions IA"
      heroImage="analytics"
      badge={{ label: 'BI Command Center', icon: BarChart3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div />
        <Select value={period} onValueChange={v => setPeriod(v as any)}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 derniers jours</SelectItem>
            <SelectItem value="30d">Ce mois</SelectItem>
            <SelectItem value="90d">3 derniers mois</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="executive" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="executive" className="gap-2"><BarChart3 className="h-4 w-4" />Dashboard</TabsTrigger>
          <TabsTrigger value="customers" className="gap-2"><Users className="h-4 w-4" />Clients</TabsTrigger>
          <TabsTrigger value="products" className="gap-2"><Package className="h-4 w-4" />Produits</TabsTrigger>
          <TabsTrigger value="predictions" className="gap-2"><Brain className="h-4 w-4" />Prédictions IA</TabsTrigger>
        </TabsList>

        <TabsContent value="executive"><ExecutiveDashboard period={period} /></TabsContent>
        <TabsContent value="customers"><CustomerIntelligenceTab /></TabsContent>
        <TabsContent value="products"><ProductPerformanceTab /></TabsContent>
        <TabsContent value="predictions"><AIPredictionsTab /></TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
