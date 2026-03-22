/**
 * Price Competition Page — Comparaison directe des prix concurrents
 */
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Target, TrendingUp, TrendingDown, ArrowRight, Eye,
  DollarSign, BarChart3, AlertTriangle, CheckCircle, Minus,
  RefreshCw, Loader2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { ModuleInterconnectionBanner } from '@/components/cross-module/ModuleInterconnectionBanner';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function PriceCompetitionPage() {
  const { t: tPages } = useTranslation('pages');
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['competition-products'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from('products')
        .select('id, title, price, compare_at_price, cost_price, category, status, stock_quantity')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('price', { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const { data: priceChanges = [] } = useQuery({
    queryKey: ['competition-price-changes'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from('price_change_history')
        .select('*')
        .eq('user_id', user.id)
        .order('changed_at', { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  // Compute competition metrics
  const totalProducts = products.length;
  const withComparePrice = products.filter((p: any) => p.compare_at_price && p.compare_at_price > 0);
  const cheaperThanMarket = withComparePrice.filter((p: any) => p.price < p.compare_at_price);
  const moreExpensive = withComparePrice.filter((p: any) => p.price > p.compare_at_price);
  const atParity = withComparePrice.filter((p: any) => p.price === p.compare_at_price);

  const avgDiscount = withComparePrice.length > 0
    ? withComparePrice.reduce((sum: number, p: any) => sum + ((p.compare_at_price - p.price) / p.compare_at_price * 100), 0) / withComparePrice.length
    : 0;

  // Price distribution chart
  const priceRanges = [
    { range: '0-10€', count: products.filter((p: any) => p.price < 10).length },
    { range: '10-25€', count: products.filter((p: any) => p.price >= 10 && p.price < 25).length },
    { range: '25-50€', count: products.filter((p: any) => p.price >= 25 && p.price < 50).length },
    { range: '50-100€', count: products.filter((p: any) => p.price >= 50 && p.price < 100).length },
    { range: '100€+', count: products.filter((p: any) => p.price >= 100).length },
  ];

  // Margin scatter data
  const marginData = products
    .filter((p: any) => p.cost_price && p.cost_price > 0)
    .map((p: any) => ({
      name: (p.title || '').substring(0, 20),
      price: p.price,
      margin: ((p.price - p.cost_price) / p.price * 100),
      stock: p.stock_quantity || 0,
    }));

  const getPositionBadge = (price: number, compareAt: number | null) => {
    if (!compareAt || compareAt <= 0) return <Badge variant="outline"><Minus className="h-3 w-3 mr-1" />N/A</Badge>;
    const diff = ((price - compareAt) / compareAt * 100);
    if (diff < -5) return <Badge className="bg-success hover:bg-success"><TrendingDown className="h-3 w-3 mr-1" />{diff.toFixed(1)}%</Badge>;
    if (diff > 5) return <Badge variant="destructive"><TrendingUp className="h-3 w-3 mr-1" />+{diff.toFixed(1)}%</Badge>;
    return <Badge variant="secondary"><Minus className="h-3 w-3 mr-1" />Parité</Badge>;
  };

  return (
    <>
      <Helmet>
        <title>Concurrence & Benchmarks Prix | ShopOpti</title>
        <meta name="description" content="Comparez vos prix avec la concurrence et identifiez les opportunités de positionnement." />
      </Helmet>

      <ChannablePageWrapper
        title={tPages('concurrenceBenchmarks.title')}
        description="Analysez votre positionnement prix par rapport au marché"
        heroImage="analytics"
        badge={{ label: 'Concurrence', icon: Target }}
      >
        <ModuleInterconnectionBanner currentModule="pricing" />

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Moins cher', value: cheaperThanMarket.length, total: withComparePrice.length, icon: TrendingDown, color: 'text-success' },
            { label: 'Plus cher', value: moreExpensive.length, total: withComparePrice.length, icon: TrendingUp, color: 'text-destructive' },
            { label: 'À parité', value: atParity.length, total: withComparePrice.length, icon: CheckCircle, color: 'text-info' },
            { label: 'Remise moy.', value: `${avgDiscount.toFixed(1)}%`, total: null, icon: DollarSign, color: 'text-primary' },
          ].map((kpi) => (
            <Card key={kpi.label} className="p-4">
              {isLoading ? <Skeleton className="h-16" /> : (
                <div className="flex items-center gap-3">
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  <div>
                    <p className="text-sm text-muted-foreground">{kpi.label}</p>
                    <p className="text-2xl font-bold">
                      {kpi.value}{kpi.total !== null && <span className="text-sm text-muted-foreground font-normal">/{kpi.total}</span>}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="margins">Marges</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Price distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Distribution des prix</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={priceRanges}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" name="Produits" radius={[4, 4, 0, 0]}>
                        {priceRanges.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Competitive position */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Position concurrentielle</CardTitle>
                  <CardDescription>Basée sur les compare_at_price</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Moins cher que le marché</span>
                      <span className="text-sm font-medium text-success">{cheaperThanMarket.length}</span>
                    </div>
                    <Progress value={withComparePrice.length ? (cheaperThanMarket.length / withComparePrice.length * 100) : 0} className="h-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Plus cher que le marché</span>
                      <span className="text-sm font-medium text-destructive">{moreExpensive.length}</span>
                    </div>
                    <Progress value={withComparePrice.length ? (moreExpensive.length / withComparePrice.length * 100) : 0} className="h-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">À parité</span>
                      <span className="text-sm font-medium text-info">{atParity.length}</span>
                    </div>
                    <Progress value={withComparePrice.length ? (atParity.length / withComparePrice.length * 100) : 0} className="h-2" />
                  </div>
                  {withComparePrice.length === 0 && (
                    <div className="text-center py-4">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-warning" />
                      <p className="text-sm text-muted-foreground">Aucun prix de comparaison configuré</p>
                      <p className="text-xs text-muted-foreground mt-1">Renseignez les <code>compare_at_price</code> pour activer le benchmark</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
            ) : (
              products.slice(0, 20).map((p: any) => (
                <Card key={p.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{p.title || 'Sans titre'}</p>
                      <p className="text-xs text-muted-foreground">{p.category || '—'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(p.price)}</p>
                        {p.compare_at_price > 0 && (
                          <p className="text-xs text-muted-foreground line-through">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(p.compare_at_price)}
                          </p>
                        )}
                      </div>
                      {getPositionBadge(p.price, p.compare_at_price)}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="margins" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Carte des marges</CardTitle>
                <CardDescription>Prix vs Marge (%) — taille = stock</CardDescription>
              </CardHeader>
              <CardContent>
                {marginData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="price" name="Prix" unit="€" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="margin" name="Marge" unit="%" tick={{ fontSize: 12 }} />
                      <ZAxis dataKey="stock" range={[40, 400]} name="Stock" />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter data={marginData} fill="hsl(var(--primary))" />
                    </ScatterChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Renseignez les coûts d'achat pour visualiser les marges</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}
