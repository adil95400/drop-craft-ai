/**
 * Price History Page — Visualize price evolution + competitor tracking
 * Uses real data from price_history and competitor_prices tables
 */
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  History, TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown,
  BarChart3, Calendar, Package, Loader2, Eye
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts';

export default function PriceHistoryPage() {
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [period, setPeriod] = useState<string>('30');

  // Products list
  const { data: products = [] } = useQuery({
    queryKey: ['products-for-history'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from('products')
        .select('id, title, price')
        .eq('user_id', user.id)
        .order('title')
        .limit(200);
      return data || [];
    },
  });

  // Price history from DB
  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ['price-history', selectedProduct, period],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('price_history')
        .select('*, products!price_history_product_id_fkey(title)')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - parseInt(period) * 86400000).toISOString())
        .order('created_at', { ascending: true });

      if (selectedProduct !== 'all') {
        query = query.eq('product_id', selectedProduct);
      }

      const { data, error } = await query.limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  // Competitor prices
  const { data: competitorPrices = [], isLoading: cpLoading } = useQuery({
    queryKey: ['competitor-prices-history', selectedProduct],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('competitor_prices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (selectedProduct !== 'all') {
        query = query.eq('product_id', selectedProduct);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Transform history for chart
  const chartData = history.map((h: any) => ({
    date: new Date(h.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    fullDate: h.created_at,
    ancien: h.old_price,
    nouveau: h.new_price,
    concurrent: h.competitor_price,
    marge: h.margin,
    produit: (h.products as any)?.title || 'Produit',
  }));

  // Compute stats
  const stats = (() => {
    if (!history.length) return { changes: 0, avgChange: 0, upCount: 0, downCount: 0 };
    const changes = history.length;
    const totalChange = history.reduce((sum: number, h: any) => sum + Math.abs(h.price_change || 0), 0);
    const upCount = history.filter((h: any) => (h.price_change || 0) > 0).length;
    const downCount = history.filter((h: any) => (h.price_change || 0) < 0).length;
    return { changes, avgChange: totalChange / changes, upCount, downCount };
  })();

  return (
    <>
      <Helmet>
        <title>Historique des Prix | Drop-Craft AI</title>
        <meta name="description" content="Suivez l'évolution de vos prix et ceux de vos concurrents." />
      </Helmet>

      <ChannablePageWrapper
        title={tPages('historiqueDesPrix.title')}
        description="Évolution des prix, comparaison concurrents et tendances"
        heroImage="analytics"
        badge={{ label: 'History', icon: History }}
      >
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Tous les produits" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les produits</SelectItem>
              {products.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 jours</SelectItem>
              <SelectItem value="30">30 jours</SelectItem>
              <SelectItem value="90">90 jours</SelectItem>
              <SelectItem value="365">1 an</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <BarChart3 className="h-4 w-4" /> Changements
            </div>
            <p className="text-2xl font-bold">{stats.changes}</p>
            <p className="text-xs text-muted-foreground">sur {period} jours</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingUp className="h-4 w-4" /> Hausses
            </div>
            <p className="text-2xl font-bold text-success">{stats.upCount}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingDown className="h-4 w-4" /> Baisses
            </div>
            <p className="text-2xl font-bold text-destructive">{stats.downCount}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Calendar className="h-4 w-4" /> Var. moyenne
            </div>
            <p className="text-2xl font-bold">{stats.avgChange.toFixed(2)}€</p>
          </Card>
        </div>

        {/* Price Evolution Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Évolution des prix
            </CardTitle>
            <CardDescription>
              {selectedProduct === 'all' ? 'Tous les produits' : products.find((p: any) => p.id === selectedProduct)?.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Aucun historique de prix</p>
                <p className="text-sm">Les changements de prix seront enregistrés automatiquement</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis unit="€" />
                  <Tooltip
                    content={({ payload, label }) => {
                      if (!payload?.length) return null;
                      return (
                        <div className="bg-popover border rounded-lg p-3 shadow-lg text-sm">
                          <p className="font-medium mb-1">{label}</p>
                          {payload.map((p: any) => (
                            <p key={p.dataKey} style={{ color: p.color }}>
                              {p.name}: {p.value?.toFixed(2)}€
                            </p>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone" dataKey="nouveau" name="Votre prix"
                    stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone" dataKey="concurrent" name="Prix concurrent"
                    stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.05}
                    strokeWidth={2} strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Changes Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Derniers changements de prix</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">Aucun changement enregistré</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Produit</th>
                      <th className="pb-2 font-medium text-right">Ancien prix</th>
                      <th className="pb-2 font-medium text-right">Nouveau prix</th>
                      <th className="pb-2 font-medium text-right">Variation</th>
                      <th className="pb-2 font-medium">Raison</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(-20).reverse().map((h: any) => {
                      const change = (h.price_change || 0);
                      const isUp = change > 0;
                      return (
                        <tr key={h.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-2 text-muted-foreground">
                            {new Date(h.created_at).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="py-2 font-medium">{(h.products as any)?.title || '—'}</td>
                          <td className="py-2 text-right font-mono">{h.old_price?.toFixed(2)}€</td>
                          <td className="py-2 text-right font-mono">{h.new_price?.toFixed(2)}€</td>
                          <td className="py-2 text-right">
                            <Badge variant={isUp ? 'default' : 'destructive'} className="text-xs">
                              {isUp ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                              {Math.abs(change).toFixed(2)}€
                            </Badge>
                          </td>
                          <td className="py-2">
                            <Badge variant="outline" className="text-xs">{h.change_reason || 'Manuel'}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Competitor Prices Section */}
        {competitorPrices.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-4 w-4" /> Prix concurrents actuels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Produit</th>
                      <th className="pb-2 font-medium text-right">Notre prix</th>
                      <th className="pb-2 font-medium text-right">Prix concurrent</th>
                      <th className="pb-2 font-medium text-right">Différence</th>
                      <th className="pb-2 font-medium text-center">Tendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitorPrices.slice(0, 15).map((cp: any) => (
                      <tr key={cp.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-2 font-medium">{cp.product_title}</td>
                        <td className="py-2 text-right font-mono">{cp.our_price?.toFixed(2)}€</td>
                        <td className="py-2 text-right font-mono">{cp.competitor_price?.toFixed(2)}€</td>
                        <td className="py-2 text-right">
                          <span className={cp.price_diff > 0 ? 'text-destructive' : 'text-success'}>
                            {cp.price_diff > 0 ? '+' : ''}{cp.price_diff?.toFixed(2)}€
                          </span>
                        </td>
                        <td className="py-2 text-center">
                          {cp.trend === 'up' && <ArrowUp className="h-4 w-4 text-success inline" />}
                          {cp.trend === 'down' && <ArrowDown className="h-4 w-4 text-destructive inline" />}
                          {(!cp.trend || cp.trend === 'stable') && <Minus className="h-4 w-4 text-muted-foreground inline" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </ChannablePageWrapper>
    </>
  );
}
