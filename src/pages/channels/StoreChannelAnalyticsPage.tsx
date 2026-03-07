/**
 * Store Channel Analytics - Statistiques spécifiques par boutique/canal
 * Vue consolidée des performances de chaque canal de vente
 */
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3, Store, ShoppingCart, TrendingUp, TrendingDown,
  Package, DollarSign, Users, RefreshCw, ArrowUpRight, ArrowDownRight,
  Globe, Percent
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const CHANNELS = [
  {
    id: 'shopify-main',
    name: 'Shopify Principal',
    platform: 'Shopify',
    status: 'active',
    revenue: 24580,
    revenueTrend: 12.4,
    orders: 342,
    ordersTrend: 8.2,
    products: 456,
    syncHealth: 98,
    conversionRate: 3.2,
    avgOrderValue: 71.87,
    lastSync: 'Il y a 5 min',
  },
  {
    id: 'woocommerce-fr',
    name: 'WooCommerce FR',
    platform: 'WooCommerce',
    status: 'active',
    revenue: 12340,
    revenueTrend: -2.1,
    orders: 189,
    ordersTrend: 1.5,
    products: 312,
    syncHealth: 94,
    conversionRate: 2.8,
    avgOrderValue: 65.29,
    lastSync: 'Il y a 12 min',
  },
  {
    id: 'amazon-eu',
    name: 'Amazon Europe',
    platform: 'Amazon',
    status: 'active',
    revenue: 8920,
    revenueTrend: 24.6,
    orders: 156,
    ordersTrend: 18.3,
    products: 89,
    syncHealth: 100,
    conversionRate: 5.1,
    avgOrderValue: 57.18,
    lastSync: 'Il y a 3 min',
  },
  {
    id: 'ebay-fr',
    name: 'eBay France',
    platform: 'eBay',
    status: 'warning',
    revenue: 3450,
    revenueTrend: -8.3,
    orders: 67,
    ordersTrend: -5.1,
    products: 124,
    syncHealth: 78,
    conversionRate: 1.9,
    avgOrderValue: 51.49,
    lastSync: 'Il y a 45 min',
  },
];

const REVENUE_CHART = [
  { name: 'Lun', shopify: 3200, woo: 1800, amazon: 1200, ebay: 450 },
  { name: 'Mar', shopify: 3800, woo: 1600, amazon: 1400, ebay: 520 },
  { name: 'Mer', shopify: 3100, woo: 1900, amazon: 1100, ebay: 380 },
  { name: 'Jeu', shopify: 4200, woo: 2100, amazon: 1600, ebay: 610 },
  { name: 'Ven', shopify: 4800, woo: 2400, amazon: 1800, ebay: 550 },
  { name: 'Sam', shopify: 3600, woo: 1700, amazon: 1300, ebay: 490 },
  { name: 'Dim', shopify: 2800, woo: 1400, amazon: 900, ebay: 350 },
];

const PLATFORM_COLORS: Record<string, string> = {
  Shopify: 'hsl(var(--primary))',
  WooCommerce: '#7c3aed',
  Amazon: '#f59e0b',
  eBay: '#ef4444',
};

const PIE_DATA = CHANNELS.map(c => ({ name: c.platform, value: c.revenue }));
const PIE_COLORS = CHANNELS.map(c => PLATFORM_COLORS[c.platform] || '#888');

export default function StoreChannelAnalyticsPage() {
  const totalRevenue = CHANNELS.reduce((s, c) => s + c.revenue, 0);
  const totalOrders = CHANNELS.reduce((s, c) => s + c.orders, 0);
  const totalProducts = CHANNELS.reduce((s, c) => s + c.products, 0);
  const avgConversion = CHANNELS.reduce((s, c) => s + c.conversionRate, 0) / CHANNELS.length;

  return (
    <>
      <Helmet>
        <title>Statistiques Boutiques & Canaux | Drop Craft AI</title>
        <meta name="description" content="Performances détaillées de chaque canal de vente et boutique connectée" />
      </Helmet>

      <ChannablePageWrapper
        title="Statistiques des Canaux"
        description="Performances consolidées de toutes vos boutiques et canaux de vente"
        heroImage="analytics"
        badge={{ label: 'Multi-canal', icon: Store }}
      >
        {/* KPIs globaux */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <DollarSign className="h-3.5 w-3.5" /> Revenus totaux
              </div>
              <div className="text-xl font-bold text-foreground">{totalRevenue.toLocaleString()}€</div>
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
                <Percent className="h-3.5 w-3.5" /> Taux conversion moy.
              </div>
              <div className="text-xl font-bold text-foreground">{avgConversion.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview" className="gap-1.5">
              <BarChart3 className="h-4 w-4" /> Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="channels" className="gap-1.5">
              <Store className="h-4 w-4" /> Par canal
            </TabsTrigger>
            <TabsTrigger value="comparison" className="gap-1.5">
              <TrendingUp className="h-4 w-4" /> Comparaison
            </TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Revenus par canal (7 jours)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={REVENUE_CHART}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="shopify" name="Shopify" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="woo" name="WooCommerce" fill="#7c3aed" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="amazon" name="Amazon" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="ebay" name="eBay" fill="#ef4444" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Répartition revenus</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={PIE_DATA} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }: any) => `${name} ${(Number(percent) * 100).toFixed(0)}%`}>
                        {PIE_DATA.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Par canal */}
          <TabsContent value="channels">
            <div className="space-y-4">
              {CHANNELS.map(channel => (
                <Card key={channel.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'p-2 rounded-lg',
                          channel.status === 'active' ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'
                        )}>
                          <Store className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{channel.name}</h3>
                            <Badge variant="outline" className="text-xs">{channel.platform}</Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <RefreshCw className="h-3 w-3" /> Sync: {channel.lastSync}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
                        <div>
                          <div className="text-xs text-muted-foreground">Revenus</div>
                          <div className="font-semibold text-foreground">{channel.revenue.toLocaleString()}€</div>
                          <div className={cn('text-xs flex items-center justify-center gap-0.5', channel.revenueTrend >= 0 ? 'text-green-600' : 'text-destructive')}>
                            {channel.revenueTrend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {Math.abs(channel.revenueTrend)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Commandes</div>
                          <div className="font-semibold text-foreground">{channel.orders}</div>
                          <div className={cn('text-xs flex items-center justify-center gap-0.5', channel.ordersTrend >= 0 ? 'text-green-600' : 'text-destructive')}>
                            {channel.ordersTrend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {Math.abs(channel.ordersTrend)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Produits</div>
                          <div className="font-semibold text-foreground">{channel.products}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Conversion</div>
                          <div className="font-semibold text-foreground">{channel.conversionRate}%</div>
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

          {/* Comparaison */}
          <TabsContent value="comparison">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comparaison des canaux</CardTitle>
                <CardDescription>Analyse comparative des performances sur 30 jours</CardDescription>
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
                        <th className="text-right py-2 text-muted-foreground font-medium">Conversion</th>
                        <th className="text-right py-2 text-muted-foreground font-medium">Tendance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CHANNELS.map(ch => (
                        <tr key={ch.id} className="border-b border-border last:border-0">
                          <td className="py-3 font-medium text-foreground">{ch.name}</td>
                          <td className="py-3 text-right text-foreground">{ch.revenue.toLocaleString()}€</td>
                          <td className="py-3 text-right text-foreground">{ch.orders}</td>
                          <td className="py-3 text-right text-foreground">{ch.avgOrderValue.toFixed(2)}€</td>
                          <td className="py-3 text-right text-foreground">{ch.conversionRate}%</td>
                          <td className="py-3 text-right">
                            <Badge variant={ch.revenueTrend >= 0 ? 'default' : 'destructive'} className="text-xs">
                              {ch.revenueTrend >= 0 ? '+' : ''}{ch.revenueTrend}%
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
