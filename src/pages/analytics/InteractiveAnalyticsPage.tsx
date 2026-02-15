/**
 * Sprint 10: Interactive Analytics Dashboard
 * Real data with period comparison, time series charts, drill-down, and export
 */
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAdvancedAnalytics, type AnalyticsPeriod } from '@/hooks/useAdvancedAnalyticsDashboard';
import { exportTimeSeriesCSV, exportAnalyticsPDF } from '@/utils/analyticsExport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, ShoppingCart,
  Package, Download, FileText, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const PERIOD_OPTIONS: { value: AnalyticsPeriod; label: string }[] = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
];

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--destructive))',
  'hsl(var(--secondary))',
  'hsl(var(--muted))',
];

function DeltaBadge({ current, previous, suffix = '' }: { current: number; previous: number; suffix?: string }) {
  if (previous === 0) return null;
  const delta = ((current - previous) / previous) * 100;
  const isPositive = delta >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-primary' : 'text-destructive'}`}>
      {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(delta).toFixed(1)}%{suffix}
    </span>
  );
}

export default function InteractiveAnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const { data, isLoading } = useAdvancedAnalytics(period);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const { overview, timeSeries, byPlatform, byCategory, topProducts } = data;

  return (
    <>
      <Helmet>
        <title>Analytics Avancé | ShopOpti</title>
        <meta name="description" content="Tableaux de bord interactifs avec drill-down et comparaisons" />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Analytics Avancé
            </h1>
            <p className="text-muted-foreground">
              Vue complète de vos performances avec comparaisons périodiques
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Period selector */}
            {PERIOD_OPTIONS.map(p => (
              <Button
                key={p.value}
                variant={period === p.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(p.value)}
              >
                {p.label}
              </Button>
            ))}
            {/* Export */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportTimeSeriesCSV(timeSeries)}
            >
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportAnalyticsPDF(overview, timeSeries, period)}
            >
              <FileText className="h-4 w-4 mr-1" />
              PDF
            </Button>
          </div>
        </div>

        {/* KPI Cards with comparison */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Revenus</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{overview.revenue.toFixed(0)}€</span>
                <DeltaBadge current={overview.revenue} previous={overview.revenue_prev} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Commandes</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{overview.orders}</span>
                <DeltaBadge current={overview.orders} previous={overview.orders_prev} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Panier moyen</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{overview.avg_order_value.toFixed(0)}€</span>
                <DeltaBadge current={overview.avg_order_value} previous={overview.avg_order_value_prev} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Produits actifs</span>
              </div>
              <span className="text-2xl font-bold">{overview.products_active}</span>
              <span className="text-xs text-muted-foreground ml-1">/ {overview.products_total}</span>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="revenue">
          <TabsList>
            <TabsTrigger value="revenue">Revenus</TabsTrigger>
            <TabsTrigger value="orders">Commandes</TabsTrigger>
            <TabsTrigger value="platforms">Plateformes</TabsTrigger>
            <TabsTrigger value="categories">Catégories</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Évolution des revenus</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={timeSeries}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}€`} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      formatter={(value: number) => [`${value.toFixed(2)}€`, 'Revenus']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      fill="url(#colorRevenue)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Commandes par jour</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={timeSeries}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Commandes" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="platforms" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Répartition par plateforme</CardTitle>
              </CardHeader>
              <CardContent>
                {byPlatform.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Aucune donnée de plateforme disponible
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={byPlatform as any[]}
                          dataKey="revenue"
                          nameKey="platform"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ platform, percent }: any) => `${platform} (${(Number(percent) * 100).toFixed(0)}%)`}
                        >
                          {byPlatform.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${value.toFixed(2)}€`} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-3">
                      {byPlatform.map((p, i) => (
                        <div key={p.platform} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                            <span className="font-medium text-sm">{p.platform}</span>
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-medium">{p.revenue.toFixed(0)}€</div>
                            <div className="text-xs text-muted-foreground">{p.orders} cmd</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Produits par catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                {byCategory.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Aucune catégorie disponible
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={byCategory} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="category" type="category" width={120} tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Bar dataKey="products" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Produits" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Top products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Produits</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Aucun produit actif</div>
            ) : (
              <div className="space-y-2">
                {topProducts.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-muted-foreground w-6">#{i + 1}</span>
                      <span className="text-sm font-medium">{p.title}</span>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium">{p.revenue.toFixed(0)}€</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
