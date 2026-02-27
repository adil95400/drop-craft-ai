import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp, TrendingDown, Package, DollarSign, Eye, ShoppingCart,
  Target, Search, Sparkles, BarChart3
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

function useUnifiedAnalytics() {
  return useQuery({
    queryKey: ['unified-performance-overview'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const [
        { data: products },
        { data: orders },
        { data: recommendations },
        { data: aiContent },
        { data: customers },
      ] = await Promise.all([
        supabase.from('products').select('id, name, category, price, stock_quantity, profit_margin, created_at').eq('user_id', user.id),
        supabase.from('orders').select('id, total_amount, status, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(500),
        supabase.from('ai_recommendations').select('id, recommendation_type, confidence_score, impact_value, status, created_at').eq('user_id', user.id),
        supabase.from('ai_generated_content').select('id, content_type, quality_score, status, created_at').eq('user_id', user.id),
        supabase.from('customers').select('id, total_spent, orders_count, created_at').eq('user_id', user.id),
      ]);

      const allProducts = products || [];
      const allOrders = orders || [];
      const allRecs = recommendations || [];
      const allAI = aiContent || [];
      const allCustomers = customers || [];

      // Product performance
      const totalRevenue = allOrders
        .filter(o => ['delivered', 'completed'].includes(o.status || ''))
        .reduce((s, o) => s + (o.total_amount || 0), 0);

      const avgMargin = allProducts.length > 0
        ? allProducts.reduce((s, p) => s + (p.profit_margin || 0), 0) / allProducts.length
        : 0;

      const lowStockCount = allProducts.filter(p => (p.stock_quantity || 0) < 10 && (p.stock_quantity || 0) > 0).length;
      const outOfStockCount = allProducts.filter(p => (p.stock_quantity || 0) === 0).length;

      // Category distribution
      const catMap: Record<string, { count: number; revenue: number }> = {};
      allProducts.forEach(p => {
        const cat = p.category || 'Sans catégorie';
        if (!catMap[cat]) catMap[cat] = { count: 0, revenue: 0 };
        catMap[cat].count++;
      });
      const categoryData = Object.entries(catMap)
        .map(([name, d]) => ({ name, value: d.count }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

      // Revenue trend (last 7 days)
      const revenueTrend: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        revenueTrend[d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' })] = 0;
      }
      allOrders.forEach(o => {
        const d = new Date(o.created_at);
        const key = d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' });
        if (key in revenueTrend) {
          revenueTrend[key] += o.total_amount || 0;
        }
      });
      const trendData = Object.entries(revenueTrend).map(([day, revenue]) => ({ day, revenue: Math.round(revenue) }));

      // Recommendations stats
      const recsApplied = allRecs.filter(r => r.status === 'applied').length;
      const recsPending = allRecs.filter(r => r.status === 'pending').length;
      const avgConfidence = allRecs.length > 0
        ? allRecs.reduce((s, r) => s + (r.confidence_score || 0), 0) / allRecs.length
        : 0;
      const totalImpact = allRecs.filter(r => r.status === 'applied').reduce((s, r) => s + (r.impact_value || 0), 0);

      // AI content stats
      const contentGenerated = allAI.length;
      const contentApplied = allAI.filter(c => c.status === 'applied').length;
      const avgQuality = allAI.length > 0
        ? allAI.reduce((s, c) => s + (c.quality_score || 0), 0) / allAI.length
        : 0;

      // SEO health
      const productsWithDesc = allProducts.filter(p => true).length; // All have names
      const catalogCompleteness = allProducts.length > 0
        ? (allProducts.filter(p => p.category && p.price > 0).length / allProducts.length) * 100
        : 0;

      return {
        products: {
          total: allProducts.length,
          lowStock: lowStockCount,
          outOfStock: outOfStockCount,
          avgMargin: Math.round(avgMargin * 10) / 10,
        },
        revenue: {
          total: Math.round(totalRevenue),
          orders: allOrders.length,
          avgBasket: allOrders.length > 0 ? Math.round(totalRevenue / allOrders.length) : 0,
          customers: allCustomers.length,
        },
        recommendations: {
          total: allRecs.length,
          applied: recsApplied,
          pending: recsPending,
          avgConfidence: Math.round(avgConfidence * 100),
          totalImpact: Math.round(totalImpact),
        },
        content: {
          generated: contentGenerated,
          applied: contentApplied,
          avgQuality: Math.round(avgQuality * 100),
        },
        seo: {
          catalogCompleteness: Math.round(catalogCompleteness),
        },
        charts: {
          categories: categoryData,
          revenueTrend: trendData,
        },
      };
    },
    staleTime: 60_000,
  });
}

function StatCard({ title, value, subtitle, icon: Icon, trend }: {
  title: string; value: string | number; subtitle: string; icon: any; trend?: number;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-1 mt-1">
          {trend !== undefined && (
            trend >= 0
              ? <TrendingUp className="h-3 w-3 text-emerald-500" />
              : <TrendingDown className="h-3 w-3 text-destructive" />
          )}
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function UnifiedPerformanceOverview() {
  const { data, isLoading } = useUnifiedAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* KPIs principaux */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Chiffre d'affaires"
          value={`${data.revenue.total.toLocaleString()}€`}
          subtitle={`${data.revenue.orders} commandes • Panier moyen ${data.revenue.avgBasket}€`}
          icon={DollarSign}
        />
        <StatCard
          title="Catalogue"
          value={data.products.total}
          subtitle={`${data.products.lowStock} stock bas • ${data.products.outOfStock} rupture`}
          icon={Package}
        />
        <StatCard
          title="Recommandations IA"
          value={data.recommendations.total}
          subtitle={`${data.recommendations.applied} appliquées • +${data.recommendations.totalImpact}€ impact`}
          icon={Sparkles}
        />
        <StatCard
          title="Contenus IA"
          value={data.content.generated}
          subtitle={`${data.content.applied} appliqués • ${data.content.avgQuality}% qualité`}
          icon={BarChart3}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tendance des revenus (7j)</CardTitle>
            <CardDescription>Évolution quotidienne du chiffre d'affaires</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.charts.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(v: number) => [`${v}€`, 'Revenus']}
                />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition par catégorie</CardTitle>
            <CardDescription>{data.charts.categories.length} catégories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data.charts.categories}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {data.charts.categories.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Recommendation performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Moteur de recommandation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Confiance moyenne</span>
                <span className="font-medium">{data.recommendations.avgConfidence}%</span>
              </div>
              <Progress value={data.recommendations.avgConfidence} className="h-2" />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">En attente</span>
              <Badge variant="secondary">{data.recommendations.pending}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Impact estimé</span>
              <span className="font-semibold text-primary">+{data.recommendations.totalImpact}€</span>
            </div>
          </CardContent>
        </Card>

        {/* Content generation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Génération de contenu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Qualité moyenne</span>
                <span className="font-medium">{data.content.avgQuality}%</span>
              </div>
              <Progress value={data.content.avgQuality} className="h-2" />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Contenus générés</span>
              <Badge variant="secondary">{data.content.generated}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taux d'application</span>
              <span className="font-medium">
                {data.content.generated > 0 ? Math.round((data.content.applied / data.content.generated) * 100) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* SEO Health */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              Santé SEO
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Complétude catalogue</span>
                <span className="font-medium">{data.seo.catalogCompleteness}%</span>
              </div>
              <Progress value={data.seo.catalogCompleteness} className="h-2" />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Marge moyenne</span>
              <span className="font-medium">{data.products.avgMargin}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Clients</span>
              <Badge variant="secondary">{data.revenue.customers}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
