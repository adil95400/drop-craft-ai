import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Target, DollarSign, ShoppingCart, Calendar } from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function AnalyticsPredictivePage() {
  // Revenue trend data
  const { data: orders = [] } = useQuery({
    queryKey: ['predictive-orders'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from('orders')
        .select('total_amount, created_at, status')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });
      return data || [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ['predictive-products'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from('products')
        .select('price, status, category, stock_quantity')
        .eq('user_id', user.id)
        .eq('status', 'active');
      return data || [];
    },
  });

  // Build weekly revenue chart
  const weeklyRevenue = (() => {
    const weeks: Record<string, number> = {};
    orders.forEach((o: any) => {
      const d = new Date(o.created_at);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      weeks[key] = (weeks[key] || 0) + (o.total_amount || 0);
    });
    const sorted = Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12);
    
    // Calculate trend-based forecast (linear regression on recent weeks)
    const values = sorted.map(([, v]) => v);
    const n = values.length;
    const avgGrowth = n > 1 
      ? values.slice(1).reduce((sum, v, i) => sum + (v - values[i]) / Math.max(values[i], 1), 0) / (n - 1)
      : 0.05;
    const growthRate = Math.max(-0.2, Math.min(0.3, avgGrowth)); // clamp between -20% and +30%

    return sorted.map(([week, revenue], idx) => ({
      week: new Date(week).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      revenue: Math.round(revenue),
      forecast: Math.round(revenue * (1 + growthRate * ((idx + 1) / n))),
    }));
  })();

  // Category distribution
  const categoryData = (() => {
    const cats: Record<string, number> = {};
    products.forEach((p: any) => {
      const cat = p.category || 'Non catégorisé';
      cats[cat] = (cats[cat] || 0) + 1;
    });
    return Object.entries(cats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  })();

  // Stock health
  const stockHealth = (() => {
    let healthy = 0, low = 0, out = 0;
    products.forEach((p: any) => {
      const qty = p.stock_quantity ?? 0;
      if (qty === 0) out++;
      else if (qty < 10) low++;
      else healthy++;
    });
    return [
      { name: 'Stock OK', value: healthy },
      { name: 'Stock Bas', value: low },
      { name: 'Rupture', value: out },
    ].filter(d => d.value > 0);
  })();

  const totalRevenue = orders.reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
  const avgOrderValue = orders.length ? totalRevenue / orders.length : 0;

  return (
    <>
      <Helmet>
        <title>Analytics Prédictifs — Drop-Craft AI</title>
        <meta name="description" content="Visualisez les tendances et prédictions de votre activité e-commerce." />
      </Helmet>

      <ChannablePageWrapper
        title="Analytics Prédictifs"
        description="Tendances, prévisions de revenus et santé du catalogue"
        heroImage="analytics"
        badge={{ label: 'Prédictif', icon: TrendingUp }}
      >
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Revenu (90j)', value: `${totalRevenue.toFixed(0)}€`, icon: DollarSign },
            { label: 'Commandes', value: orders.length, icon: ShoppingCart },
            { label: 'Panier Moyen', value: `${avgOrderValue.toFixed(2)}€`, icon: Target },
            { label: 'Produits Actifs', value: products.length, icon: Calendar },
          ].map((kpi) => (
            <Card key={kpi.label} className="p-4">
              <div className="flex items-center gap-3">
                <kpi.icon className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList>
            <TabsTrigger value="revenue">Revenus & Prévisions</TabsTrigger>
            <TabsTrigger value="catalog">Santé Catalogue</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Revenus Hebdomadaires vs Prévisions</h3>
              {weeklyRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={weeklyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="week" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" name="Réel" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="forecast" name="Prévision" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.15} strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">Pas assez de données pour les prévisions</p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="catalog">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Répartition par Catégorie</h3>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="value" name="Produits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-12">Aucune donnée</p>
                )}
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Santé du Stock</h3>
                {stockHealth.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={stockHealth} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                        {stockHealth.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-12">Aucune donnée</p>
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}
