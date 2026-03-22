import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Zap, Clock, TrendingUp, DollarSign, Users, Plus, ShoppingBag,
  Loader2, BarChart3, Timer, Package, Percent, ArrowUpRight
} from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useTranslation } from 'react-i18next';
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';
import { useFlashSales } from '@/hooks/useFlashSales';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function CountdownTimer({ endDate }: { endDate: string }) {
  const { t: tPages } = useTranslation('pages');
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Terminé'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  return <span className="font-mono font-bold text-destructive">{timeLeft}</span>;
}

const FlashSalesPage: React.FC = () => {
  const { stats, isLoading, products, orders } = useFlashSales();

  // Generate chart data from real orders
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayStr = date.toISOString().slice(0, 10);
    const dayOrders = orders.filter((o: any) => o.created_at.startsWith(dayStr));
    return {
      day: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
      revenue: dayOrders.reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0),
      orders: dayOrders.length,
    };
  });

  // Product distribution for bar chart
  const priceRanges = [
    { range: '0-10€', count: products.filter((p: any) => p.price <= 10).length },
    { range: '10-25€', count: products.filter((p: any) => p.price > 10 && p.price <= 25).length },
    { range: '25-50€', count: products.filter((p: any) => p.price > 25 && p.price <= 50).length },
    { range: '50-100€', count: products.filter((p: any) => p.price > 50 && p.price <= 100).length },
    { range: '100€+', count: products.filter((p: any) => p.price > 100).length },
  ];

  // Template flash sales
  const templates = [
    { name: 'Weekend Deal', discount: 30, duration: '48h', icon: '🔥', description: 'Idéal pour booster les ventes le weekend' },
    { name: 'Flash 24h', discount: 50, duration: '24h', icon: '⚡', description: 'Urgence maximale, conversions élevées' },
    { name: 'Happy Hour', discount: 20, duration: '2h', icon: '🎉', description: 'Micro-promotions à fort impact' },
    { name: 'Black Friday', discount: 70, duration: '72h', icon: '🏷️', description: 'Événement annuel majeur' },
  ];

  return (
    <>
      <Helmet>
        <title>Ventes Flash — Drop-Craft AI</title>
        <meta name="description" content="Créez des ventes flash avec des réductions limitées dans le temps pour booster vos conversions." />
      </Helmet>

      <ChannablePageWrapper
        title={tPages('ventesFlash.title')}
        subtitle={tPages('marketing.title')}
        description="Créez des promotions limitées dans le temps pour booster vos conversions"
        heroImage="marketing"
        badge={{ label: "Flash Sales", icon: Zap }}
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle vente flash
          </Button>
        }
      >
        <AdvancedFeatureGuide {...ADVANCED_GUIDES.flashSales} />

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          {[
            { label: 'Produits', value: stats.totalProducts, icon: Package, color: 'text-primary' },
            { label: 'Stock total', value: stats.totalStock.toLocaleString('fr-FR'), icon: ShoppingBag, color: 'text-chart-2' },
            { label: 'Commandes (30j)', value: stats.completedSales, icon: TrendingUp, color: 'text-success' },
            { label: 'Revenu (30j)', value: `${stats.totalRevenue.toLocaleString('fr-FR')}€`, icon: DollarSign, color: 'text-warning' },
            { label: 'Taux conv.', value: `${stats.conversionRate.toFixed(1)}%`, icon: Percent, color: 'text-info' },
            { label: 'Produits vendus', value: stats.totalProductsSold, icon: BarChart3, color: 'text-chart-4' },
          ].map(kpi => (
            <Card key={kpi.label} className="p-4">
              <div className="flex items-center gap-3">
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mt-1" />
                  ) : (
                    <p className="text-xl font-bold">{kpi.value}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Revenue Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tendance Revenu (7j)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={last7Days}>
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="day" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        formatter={(v: number) => `${v.toLocaleString('fr-FR')}€`}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revenueGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Products by Price Range */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Distribution par prix</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={priceRanges}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="range" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Produits" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Quick stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Produits à fort potentiel</CardTitle>
                <CardDescription>Produits avec le meilleur stock pour des ventes flash</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {products
                      .filter((p: any) => p.stock_quantity > 10)
                      .sort((a: any, b: any) => b.stock_quantity - a.stock_quantity)
                      .slice(0, 5)
                      .map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium truncate max-w-[200px]">{p.id.substring(0, 8)}...</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant="outline">{Number(p.price).toLocaleString('fr-FR')}€</Badge>
                            <div className="flex items-center gap-2 min-w-[120px]">
                              <Progress value={Math.min((p.stock_quantity / 100) * 100, 100)} className="h-2 flex-1" />
                              <span className="text-xs text-muted-foreground w-10 text-right">{p.stock_quantity}</span>
                            </div>
                            <Button size="sm" variant="outline" className="gap-1">
                              <Zap className="h-3 w-3" />
                              Flash
                            </Button>
                          </div>
                        </div>
                      ))}
                    {products.filter((p: any) => p.stock_quantity > 10).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="h-10 w-10 mx-auto mb-3 opacity-50" />
                        <p>Aucun produit avec stock suffisant pour une vente flash</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates */}
          <TabsContent value="templates" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {templates.map((template) => (
                <Card key={template.name} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <div className="text-4xl mb-3">{template.icon}</div>
                      <div className="text-3xl font-bold text-primary mb-1">-{template.discount}%</div>
                      <h4 className="font-semibold text-lg">{template.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">Durée: {template.duration}</p>
                    </div>
                    <p className="text-sm text-muted-foreground text-center mb-4">{template.description}</p>
                    <Button className="w-full" size="sm">
                      <Zap className="h-4 w-4 mr-2" />
                      Utiliser
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="p-6 text-center">
                <p className="text-4xl font-bold text-primary">{stats.completedSales}</p>
                <p className="text-sm text-muted-foreground mt-1">Commandes (30 jours)</p>
              </Card>
              <Card className="p-6 text-center">
                <p className="text-4xl font-bold text-success">{stats.totalRevenue.toLocaleString('fr-FR')}€</p>
                <p className="text-sm text-muted-foreground mt-1">Revenu total</p>
              </Card>
              <Card className="p-6 text-center">
                <p className="text-4xl font-bold text-warning">{stats.conversionRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground mt-1">Taux de conversion</p>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Commandes par jour (7j)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={last7Days}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Commandes" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
};

export default FlashSalesPage;
