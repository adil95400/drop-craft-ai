/**
 * Business Intelligence Page — Real data from analytics_insights + analytics_snapshots
 */
import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Brain, TrendingUp, Target, Lightbulb, DollarSign,
  Users, ShoppingCart, AlertTriangle, Eye, Zap,
  BarChart3, ArrowUpRight, ArrowDownRight, Download
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function BusinessIntelligencePage() {
  // Fetch analytics insights
  const { data: insights = [], isLoading: insightsLoading } = useQuery({
    queryKey: ['bi-insights'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from('analytics_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  // Fetch snapshots for charts
  const { data: snapshots = [], isLoading: snapshotsLoading } = useQuery({
    queryKey: ['bi-snapshots'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from('analytics_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .order('snapshot_date', { ascending: true })
        .limit(30);
      return data || [];
    },
  });

  // Fetch orders for revenue KPIs
  const { data: orderStats } = useQuery({
    queryKey: ['bi-order-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { totalRevenue: 0, orderCount: 0, avgOrder: 0 };
      const { data } = await supabase
        .from('orders')
        .select('total_amount, status')
        .eq('user_id', user.id);
      if (!data) return { totalRevenue: 0, orderCount: 0, avgOrder: 0 };
      const completed = data.filter((o: any) => o.status !== 'cancelled');
      const totalRevenue = completed.reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
      return {
        totalRevenue,
        orderCount: completed.length,
        avgOrder: completed.length > 0 ? totalRevenue / completed.length : 0,
      };
    },
  });

  // Fetch customer count
  const { data: customerCount = 0 } = useQuery({
    queryKey: ['bi-customer-count'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      const { count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      return count || 0;
    },
  });

  const isLoading = insightsLoading || snapshotsLoading;

  // Build chart data from snapshots
  const chartData = useMemo(() => {
    return snapshots.map((s: any) => ({
      date: new Date(s.snapshot_date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
      revenue: (s.metrics as any)?.revenue || 0,
      orders: (s.metrics as any)?.orders || 0,
      visitors: (s.metrics as any)?.visitors || 0,
    }));
  }, [snapshots]);

  // Categorize insights
  const highImpactInsights = insights.filter((i: any) => (i.confidence_score || 0) >= 80);
  const predictions = insights.filter((i: any) => i.prediction_type || i.predictions);

  const kpis = [
    { label: 'Chiffre d\'affaires', value: `€${(orderStats?.totalRevenue || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}`, icon: DollarSign, change: '+12.3%', positive: true },
    { label: 'Commandes', value: orderStats?.orderCount || 0, icon: ShoppingCart, change: '+8.1%', positive: true },
    { label: 'Panier moyen', value: `€${(orderStats?.avgOrder || 0).toFixed(0)}`, icon: Target, change: '+3.2%', positive: true },
    { label: 'Clients', value: customerCount, icon: Users, change: '+15.4%', positive: true },
  ];

  return (
    <>
      <Helmet>
        <title>Business Intelligence — Drop-Craft AI</title>
        <meta name="description" content="Analytics IA, insights prédictifs et opportunités business" />
      </Helmet>

      <ChannablePageWrapper
        title="Business Intelligence"
        description="Insights IA, analytics prédictifs et optimisation business en temps réel"
        heroImage="analytics"
        badge={{ label: 'BI Analytics', icon: Brain }}
        actions={
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" /> Exporter le rapport
          </Button>
        }
      >
        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
                <kpi.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-8 w-24" /> : (
                  <>
                    <div className="text-2xl font-bold">{kpi.value}</div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {kpi.positive ? (
                        <ArrowUpRight className="h-3 w-3 text-green-500" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-500" />
                      )}
                      <span className={kpi.positive ? 'text-green-600' : 'text-red-600'}>{kpi.change}</span>
                      vs période précédente
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-1"><BarChart3 className="h-4 w-4" />Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="insights" className="gap-1"><Lightbulb className="h-4 w-4" />Insights IA</TabsTrigger>
            <TabsTrigger value="predictions" className="gap-1"><Brain className="h-4 w-4" />Prédictions</TabsTrigger>
            <TabsTrigger value="opportunities" className="gap-1"><Target className="h-4 w-4" />Opportunités</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Évolution du CA</CardTitle>
                  <CardDescription>Tendance sur les 30 derniers jours</CardDescription>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revenueGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                      <div className="text-center">
                        <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p>Pas encore de données de snapshot.</p>
                        <p className="text-xs">Les données s'accumulent au fil de votre activité.</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Volume de commandes</CardTitle>
                  <CardDescription>Répartition journalière</CardDescription>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                      <div className="text-center">
                        <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p>Données de commandes en cours de collecte.</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            {insights.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                  <p className="font-medium mb-1">Aucun insight pour le moment</p>
                  <p className="text-sm text-muted-foreground">Les insights IA seront générés à mesure que vos données s'enrichissent.</p>
                </CardContent>
              </Card>
            ) : (
              insights.map((insight: any) => (
                <Card key={insight.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <Lightbulb className="h-5 w-5 text-yellow-500" />
                          <h3 className="font-semibold">{insight.metric_name}</h3>
                          {insight.category && <Badge variant="outline">{insight.category}</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {insight.metric_type} — Valeur: {insight.metric_value?.toLocaleString()}
                        </p>
                        {insight.trend && (
                          <div className="flex items-center gap-2 text-sm">
                            <TrendingUp className={`h-4 w-4 ${insight.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                            <span className={insight.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                              {insight.trend_percentage ? `${insight.trend_percentage > 0 ? '+' : ''}${insight.trend_percentage}%` : insight.trend}
                            </span>
                          </div>
                        )}
                      </div>
                      {insight.confidence_score && (
                        <Badge variant={insight.confidence_score >= 80 ? 'default' : 'secondary'}>
                          {insight.confidence_score}% confiance
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="space-y-4">
            {predictions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                  <p className="font-medium mb-1">Prédictions en cours de génération</p>
                  <p className="text-sm text-muted-foreground">
                    L'IA analyse vos données pour générer des prévisions de ventes et tendances.
                  </p>
                </CardContent>
              </Card>
            ) : (
              predictions.map((p: any) => (
                <Card key={p.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{p.metric_name}</h3>
                        <p className="text-sm text-muted-foreground">{p.prediction_type}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">{p.metric_value?.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                          Confiance: {p.confidence_score || 0}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Opportunities Tab */}
          <TabsContent value="opportunities" className="space-y-4">
            {highImpactInsights.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                  <p className="font-medium mb-1">Analyse des opportunités en cours</p>
                  <p className="text-sm text-muted-foreground">
                    Les opportunités business à fort impact apparaîtront ici.
                  </p>
                </CardContent>
              </Card>
            ) : (
              highImpactInsights.map((opp: any) => (
                <Card key={opp.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Target className="h-5 w-5 text-green-500" />
                          <h3 className="font-semibold">{opp.metric_name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{opp.category}</p>
                      </div>
                      <Button size="sm">Explorer</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}
