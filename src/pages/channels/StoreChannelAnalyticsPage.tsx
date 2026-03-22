/**
 * Store Channel Analytics - Données réelles depuis integrations + orders + products
 */
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  BarChart3, Store, ShoppingCart, TrendingUp,
  Package, DollarSign, RefreshCw, ArrowUpRight, ArrowDownRight,
  Percent, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ModuleInterconnectionBanner } from '@/components/cross-module/ModuleInterconnectionBanner';

const PLATFORM_COLORS: Record<string, string> = {
  shopify: 'hsl(var(--primary))',
  woocommerce: '#7c3aed',
  amazon: '#f59e0b',
  ebay: '#ef4444',
  etsy: '#f97316',
  tiktok: '#06b6d4',
  default: '#6b7280',
};

function getPlatformColor(platform: string) {
  return PLATFORM_COLORS[platform.toLowerCase()] || PLATFORM_COLORS.default;
}

export default function StoreChannelAnalyticsPage() {
  // Fetch active integrations
  const { data: integrations = [], isLoading: intLoading } = useQuery({
    queryKey: ['channel-analytics-integrations'],
    queryFn: async () => {
      const { data } = await supabase
        .from('integrations')
        .select('id, platform, platform_name, store_url, is_active, connection_status, last_sync_at, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  // Fetch orders grouped by platform (last 30 days)
  const { data: orderStats = [] } = useQuery({
    queryKey: ['channel-analytics-orders'],
    queryFn: async () => {
      const since = subDays(new Date(), 30).toISOString();
      const { data } = await supabase
        .from('orders')
        .select('id, total_amount, external_platform, created_at')
        .gte('created_at', since);
      return data || [];
    },
  });

  // Fetch product counts per integration
  const { data: productLinks = [] } = useQuery({
    queryKey: ['channel-analytics-product-links'],
    queryFn: async () => {
      const { data } = await supabase
        .from('product_store_links')
        .select('store_id, sync_status');
      return data || [];
    },
  });

  // Fetch last 7 days orders for chart
  const { data: dailyOrders = [] } = useQuery({
    queryKey: ['channel-analytics-daily'],
    queryFn: async () => {
      const since = subDays(new Date(), 7).toISOString();
      const { data } = await supabase
        .from('orders')
        .select('total_amount, external_platform, created_at')
        .gte('created_at', since);
      return data || [];
    },
  });

  // Build channel stats from real data
  const channels = integrations.map(int => {
    const platformOrders = orderStats.filter(o =>
      o.external_platform?.toLowerCase() === int.platform?.toLowerCase()
    );
    const revenue = platformOrders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
    const orders = platformOrders.length;
    const products = productLinks.filter(pl => pl.store_id === int.id).length;
    const syncedProducts = productLinks.filter(pl => pl.store_id === int.id && pl.sync_status === 'synced').length;
    const syncHealth = products > 0 ? Math.round((syncedProducts / products) * 100) : 100;
    const avgOrderValue = orders > 0 ? revenue / orders : 0;

    return {
      id: int.id,
      name: int.platform_name || int.platform,
      platform: int.platform || 'unknown',
      status: int.connection_status === 'error' ? 'warning' : 'active',
      revenue,
      orders,
      products,
      syncHealth,
      avgOrderValue,
      lastSync: int.last_sync_at
        ? format(new Date(int.last_sync_at), 'dd MMM HH:mm', { locale: fr })
        : 'Jamais',
    };
  });

  // Build chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayStr = format(date, 'EEE', { locale: fr });
    const dayStart = startOfDay(date).getTime();
    const dayEnd = startOfDay(subDays(date, -1)).getTime();

    const dayOrders = dailyOrders.filter(o => {
      const t = new Date(o.created_at).getTime();
      return t >= dayStart && t < dayEnd;
    });

    const entry: Record<string, any> = { name: dayStr };
    integrations.forEach(int => {
      const pOrders = dayOrders.filter(o =>
        o.external_platform?.toLowerCase() === int.platform?.toLowerCase()
      );
      entry[int.platform || 'other'] = pOrders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
    });
    return entry;
  });

  const totalRevenue = channels.reduce((s, c) => s + c.revenue, 0);
  const totalOrders = channels.reduce((s, c) => s + c.orders, 0);
  const totalProducts = channels.reduce((s, c) => s + c.products, 0);

  const pieData = channels.filter(c => c.revenue > 0).map(c => ({
    name: c.platform,
    value: c.revenue,
  }));
  const pieColors = pieData.map(d => getPlatformColor(d.name));

  if (intLoading) {
      const { t: tPages } = useTranslation('pages');

    return (
      <ChannablePageWrapper title={tPages('statistiquesDesCanaux.title')} description="Chargement..." heroImage="analytics" badge={{ label: 'Multi-canal', icon: Store }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-96" />
      </ChannablePageWrapper>
    );
  }

  if (channels.length === 0) {
    return (
      <>
        <Helmet><title>Statistiques Canaux | Drop Craft AI</title></Helmet>
        <ChannablePageWrapper title={tPages('statistiquesDesCanaux.title')} description="Connectez vos boutiques pour voir les statistiques" heroImage="analytics" badge={{ label: 'Multi-canal', icon: Store }}>
          <Card>
            <CardContent className="py-12 text-center">
              <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Aucune boutique connectée</h3>
              <p className="text-muted-foreground mb-4">Connectez vos boutiques Shopify, WooCommerce ou Amazon pour visualiser les performances.</p>
              <Button onClick={() => window.location.href = '/stores-channels/connect'}>
                Connecter une boutique
              </Button>
            </CardContent>
          </Card>
        </ChannablePageWrapper>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Statistiques Boutiques & Canaux | Drop Craft AI</title>
        <meta name="description" content="Performances détaillées de chaque canal de vente et boutique connectée" />
      </Helmet>

      <ChannablePageWrapper
        title={tPages('statistiquesDesCanaux.title')}
        description="Performances consolidées de toutes vos boutiques et canaux de vente"
        heroImage="analytics"
        badge={{ label: 'Multi-canal', icon: Store }}
      >
        <ModuleInterconnectionBanner currentModule="channels" />

        {/* KPIs globaux */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <DollarSign className="h-3.5 w-3.5" /> Revenus (30j)
              </div>
              <div className="text-xl font-bold text-foreground">{totalRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <ShoppingCart className="h-3.5 w-3.5" /> Commandes
              </div>
              <div className="text-xl font-bold text-foreground">{totalOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Package className="h-3.5 w-3.5" /> Produits publiés
              </div>
              <div className="text-xl font-bold text-foreground">{totalProducts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Percent className="h-3.5 w-3.5" /> Panier moyen
              </div>
              <div className="text-xl font-bold text-foreground">
                {totalOrders > 0
                  ? (totalRevenue / totalOrders).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
                  : '0 €'}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="h-4 w-4" /> Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="channels" className="gap-1.5"><Store className="h-4 w-4" /> Par canal</TabsTrigger>
            <TabsTrigger value="comparison" className="gap-1.5"><TrendingUp className="h-4 w-4" /> Comparaison</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="md:col-span-2">
                <CardHeader><CardTitle className="text-lg">Revenus par canal (7 jours)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={last7Days}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      {integrations.map(int => (
                        <Bar key={int.id} dataKey={int.platform || 'other'} name={int.platform_name || int.platform} fill={getPlatformColor(int.platform || '')} radius={[2, 2, 0, 0]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Répartition revenus</CardTitle></CardHeader>
                <CardContent>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                          label={({ name, percent }: any) => `${name} ${(Number(percent) * 100).toFixed(0)}%`}>
                          {pieData.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                      Aucun revenu sur la période
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="channels">
            <div className="space-y-4">
              {channels.map(channel => (
                <Card key={channel.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'p-2 rounded-lg',
                          channel.status === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                        )}>
                          <Store className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{channel.name}</h3>
                            <Badge variant="outline" className="text-xs capitalize">{channel.platform}</Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <RefreshCw className="h-3 w-3" /> Sync: {channel.lastSync}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-xs text-muted-foreground">Revenus</div>
                          <div className="font-semibold text-foreground">{channel.revenue.toLocaleString('fr-FR')}€</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Commandes</div>
                          <div className="font-semibold text-foreground">{channel.orders}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Produits</div>
                          <div className="font-semibold text-foreground">{channel.products}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Santé sync</div>
                          <Progress value={channel.syncHealth} className="h-1.5 mt-1" />
                          <div className="text-xs text-foreground mt-0.5">{channel.syncHealth}%</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="comparison">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comparaison des canaux</CardTitle>
                <CardDescription>Performances sur les 30 derniers jours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 text-muted-foreground font-medium">Canal</th>
                        <th className="text-right py-2 text-muted-foreground font-medium">Revenus</th>
                        <th className="text-right py-2 text-muted-foreground font-medium">Commandes</th>
                        <th className="text-right py-2 text-muted-foreground font-medium">Panier moyen</th>
                        <th className="text-right py-2 text-muted-foreground font-medium">Produits</th>
                        <th className="text-right py-2 text-muted-foreground font-medium">Sync</th>
                      </tr>
                    </thead>
                    <tbody>
                      {channels.map(ch => (
                        <tr key={ch.id} className="border-b border-border last:border-0">
                          <td className="py-3 font-medium text-foreground">{ch.name}</td>
                          <td className="py-3 text-right text-foreground">{ch.revenue.toLocaleString('fr-FR')}€</td>
                          <td className="py-3 text-right text-foreground">{ch.orders}</td>
                          <td className="py-3 text-right text-foreground">{ch.avgOrderValue.toFixed(2)}€</td>
                          <td className="py-3 text-right text-foreground">{ch.products}</td>
                          <td className="py-3 text-right">
                            <Badge variant={ch.syncHealth >= 90 ? 'default' : 'destructive'} className="text-xs">
                              {ch.syncHealth}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}
