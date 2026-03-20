/**
 * Predictive Demand Forecasting — Prédictions par produit/catégorie
 * Recommandations de réapprovisionnement basées sur les tendances
 */
import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell
} from 'recharts';
import {
  Brain, Package, TrendingUp, TrendingDown, AlertTriangle,
  ShoppingCart, Loader2, ArrowUpRight, ArrowDownRight, Truck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ProductDemand {
  id: string;
  title: string;
  category: string;
  current_stock: number;
  avg_daily_sales: number;
  days_of_stock: number;
  trend: 'up' | 'down' | 'stable';
  restock_urgency: 'critical' | 'high' | 'medium' | 'low';
  predicted_demand_30d: number;
  recommended_order: number;
}

const URGENCY_CONFIG = {
  critical: { color: 'bg-destructive/10 text-destructive border-red-500/20', label: 'Critique', barColor: '#ef4444' },
  high: { color: 'bg-warning/10 text-warning border-orange-500/20', label: 'Élevé', barColor: '#f97316' },
  medium: { color: 'bg-warning/10 text-warning border-amber-500/20', label: 'Moyen', barColor: '#eab308' },
  low: { color: 'bg-success/10 text-success border-emerald-500/20', label: 'Faible', barColor: '#22c55e' },
};

export default function PredictiveDemandPage() {
  // Fetch products with stock + orders for demand calculation
  const { data, isLoading } = useQuery({
    queryKey: ['predictive-demand'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { products: [], orders: [] };

      const [productsRes, ordersRes] = await Promise.all([
        supabase.from('products')
          .select('id, title, category, stock_quantity, price, status')
          .eq('user_id', user.id)
          .eq('status', 'active'),
        supabase.from('order_items')
          .select('product_id, quantity, created_at')
          .order('created_at', { ascending: false })
          .limit(1000),
      ]);

      return {
        products: productsRes.data || [],
        orders: ordersRes.data || [],
      };
    },
  });

  const demandAnalysis = useMemo((): ProductDemand[] => {
    if (!data?.products?.length) return [];

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 86400000;
    const sixtyDaysAgo = now - 60 * 86400000;

    // Sales per product in last 30d vs previous 30d
    const salesMap30d: Record<string, number> = {};
    const salesMapPrev: Record<string, number> = {};

    (data.orders || []).forEach((oi: any) => {
      if (!oi.product_id) return;
      const t = new Date(oi.created_at).getTime();
      const qty = oi.quantity || 1;
      if (t > thirtyDaysAgo) {
        salesMap30d[oi.product_id] = (salesMap30d[oi.product_id] || 0) + qty;
      } else if (t > sixtyDaysAgo) {
        salesMapPrev[oi.product_id] = (salesMapPrev[oi.product_id] || 0) + qty;
      }
    });

    return data.products.map((p: any) => {
      const sales30d = salesMap30d[p.id] || 0;
      const salesPrev = salesMapPrev[p.id] || 0;
      const avgDaily = sales30d / 30;
      const stock = p.stock_quantity ?? 0;
      const daysOfStock = avgDaily > 0 ? Math.round(stock / avgDaily) : stock > 0 ? 999 : 0;

      // Trend
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (salesPrev > 0) {
        const growth = (sales30d - salesPrev) / salesPrev;
        if (growth > 0.1) trend = 'up';
        else if (growth < -0.1) trend = 'down';
      } else if (sales30d > 0) {
        trend = 'up';
      }

      // Predicted demand (trend-adjusted)
      const trendMultiplier = trend === 'up' ? 1.15 : trend === 'down' ? 0.85 : 1;
      const predicted30d = Math.round(sales30d * trendMultiplier);

      // Urgency
      let urgency: 'critical' | 'high' | 'medium' | 'low' = 'low';
      if (daysOfStock <= 3) urgency = 'critical';
      else if (daysOfStock <= 7) urgency = 'high';
      else if (daysOfStock <= 14) urgency = 'medium';

      // Recommended restock: 45 days of predicted demand minus current stock
      const recommended = Math.max(0, Math.round((predicted30d * 1.5) - stock));

      return {
        id: p.id,
        title: p.title || 'Sans titre',
        category: p.category || 'Non catégorisé',
        current_stock: stock,
        avg_daily_sales: Math.round(avgDaily * 10) / 10,
        days_of_stock: Math.min(daysOfStock, 999),
        trend,
        restock_urgency: urgency,
        predicted_demand_30d: predicted30d,
        recommended_order: recommended,
      };
    })
    .filter((p: ProductDemand) => p.avg_daily_sales > 0 || p.current_stock > 0)
    .sort((a: ProductDemand, b: ProductDemand) => a.days_of_stock - b.days_of_stock);
  }, [data]);

  // Aggregated stats
  const stats = useMemo(() => {
    const critical = demandAnalysis.filter(p => p.restock_urgency === 'critical').length;
    const high = demandAnalysis.filter(p => p.restock_urgency === 'high').length;
    const totalPredictedDemand = demandAnalysis.reduce((s, p) => s + p.predicted_demand_30d, 0);
    const totalRecommendedOrder = demandAnalysis.reduce((s, p) => s + p.recommended_order, 0);
    return { critical, high, totalPredictedDemand, totalRecommendedOrder, total: demandAnalysis.length };
  }, [demandAnalysis]);

  // Category aggregation for chart
  const categoryChart = useMemo(() => {
    const cats: Record<string, { demand: number; stock: number }> = {};
    demandAnalysis.forEach(p => {
      if (!cats[p.category]) cats[p.category] = { demand: 0, stock: 0 };
      cats[p.category].demand += p.predicted_demand_30d;
      cats[p.category].stock += p.current_stock;
    });
    return Object.entries(cats)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.demand - a.demand)
      .slice(0, 8);
  }, [demandAnalysis]);

  // Stock runway chart (top 10 most urgent)
  const runwayChart = demandAnalysis.slice(0, 10).map(p => ({
    name: p.title.length > 20 ? p.title.slice(0, 20) + '…' : p.title,
    days: Math.min(p.days_of_stock, 90),
    urgency: p.restock_urgency,
  }));

  if (isLoading) {
    return (
      <ChannablePageWrapper title="Prédictions de Demande" description="" heroImage="analytics" badge={{ label: 'Prédictif', icon: Brain }}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ChannablePageWrapper>
    );
  }

  return (
    <>
      <Helmet>
        <title>Prédictions de Demande | ShopOpti</title>
        <meta name="description" content="Prévision de la demande par produit et recommandations de réapprovisionnement" />
      </Helmet>

      <ChannablePageWrapper
        title="Prédictions de Demande"
        description="Analyse prédictive par produit avec alertes de stock et recommandations de réapprovisionnement"
        heroImage="analytics"
        badge={{ label: 'IA Prédictive', icon: Brain }}
      >
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <AlertTriangle className="h-4 w-4 text-destructive" /> Rupture imminente
              </div>
              <div className="text-2xl font-bold text-destructive">{stats.critical}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats.high} en stock bas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <ShoppingCart className="h-4 w-4" /> Demande prédite (30j)
              </div>
              <div className="text-2xl font-bold">{stats.totalPredictedDemand}</div>
              <p className="text-xs text-muted-foreground mt-1">unités estimées</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Truck className="h-4 w-4" /> Réappro recommandé
              </div>
              <div className="text-2xl font-bold text-primary">{stats.totalRecommendedOrder}</div>
              <p className="text-xs text-muted-foreground mt-1">unités à commander</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Package className="h-4 w-4" /> Produits suivis
              </div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">avec données de vente</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products"><Package className="mr-2 h-4 w-4" />Par produit</TabsTrigger>
            <TabsTrigger value="categories"><TrendingUp className="mr-2 h-4 w-4" />Par catégorie</TabsTrigger>
            <TabsTrigger value="runway"><AlertTriangle className="mr-2 h-4 w-4" />Runway stock</TabsTrigger>
          </TabsList>

          {/* Products Table */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Analyse par Produit</CardTitle>
                <CardDescription>Prédictions de demande et recommandations de réapprovisionnement</CardDescription>
              </CardHeader>
              <CardContent>
                {demandAnalysis.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">Pas assez de données de vente pour les prédictions</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 font-medium">Produit</th>
                          <th className="text-center py-2 px-3 font-medium">Stock</th>
                          <th className="text-center py-2 px-3 font-medium">Ventes/j</th>
                          <th className="text-center py-2 px-3 font-medium">Jours restants</th>
                          <th className="text-center py-2 px-3 font-medium">Tendance</th>
                          <th className="text-center py-2 px-3 font-medium">Demande 30j</th>
                          <th className="text-center py-2 px-3 font-medium">Réappro</th>
                          <th className="text-center py-2 px-3 font-medium">Urgence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {demandAnalysis.slice(0, 20).map((p, i) => {
                          const urg = URGENCY_CONFIG[p.restock_urgency];
                          return (
                            <motion.tr
                              key={p.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.03 }}
                              className="border-b hover:bg-muted/50"
                            >
                              <td className="py-2 px-3 max-w-[200px] truncate font-medium">{p.title}</td>
                              <td className="text-center py-2 px-3">{p.current_stock}</td>
                              <td className="text-center py-2 px-3">{p.avg_daily_sales}</td>
                              <td className="text-center py-2 px-3">
                                <span className={cn(
                                  "font-semibold",
                                  p.days_of_stock <= 7 ? 'text-destructive' : p.days_of_stock <= 14 ? 'text-warning' : ''
                                )}>
                                  {p.days_of_stock >= 999 ? '∞' : `${p.days_of_stock}j`}
                                </span>
                              </td>
                              <td className="text-center py-2 px-3">
                                {p.trend === 'up' ? <ArrowUpRight className="h-4 w-4 text-success mx-auto" /> :
                                 p.trend === 'down' ? <ArrowDownRight className="h-4 w-4 text-destructive mx-auto" /> :
                                 <span className="text-muted-foreground">—</span>}
                              </td>
                              <td className="text-center py-2 px-3 font-medium">{p.predicted_demand_30d}</td>
                              <td className="text-center py-2 px-3 font-bold text-primary">{p.recommended_order > 0 ? p.recommended_order : '—'}</td>
                              <td className="text-center py-2 px-3">
                                <Badge variant="outline" className={cn("text-[10px]", urg.color)}>{urg.label}</Badge>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Category Chart */}
          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>Demande vs Stock par Catégorie</CardTitle>
                <CardDescription>Comparaison demande prédite (30j) et stock actuel</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={categoryChart}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="demand" name="Demande prédite (30j)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="stock" name="Stock actuel" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-12">Pas assez de données</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Runway Chart */}
          <TabsContent value="runway">
            <Card>
              <CardHeader>
                <CardTitle>Runway de Stock — Top 10 Urgents</CardTitle>
                <CardDescription>Nombre de jours de stock restant avant rupture</CardDescription>
              </CardHeader>
              <CardContent>
                {runwayChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={runwayChart} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" unit="j" />
                      <YAxis dataKey="name" type="category" width={160} className="text-xs" />
                      <Tooltip formatter={(v: number) => [`${v} jours`, 'Runway']} />
                      <Bar dataKey="days" name="Jours de stock">
                        {runwayChart.map((entry, i) => (
                          <Cell key={i} fill={URGENCY_CONFIG[entry.urgency as keyof typeof URGENCY_CONFIG]?.barColor || '#22c55e'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-12">Pas assez de données</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}
