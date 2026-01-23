import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBusinessMetrics, useProductAnalytics, useCustomerAnalytics } from '@/hooks/useBIMetrics';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Download,
  Package,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const BusinessIntelligencePage: React.FC = () => {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const { data: metrics, isLoading: metricsLoading } = useBusinessMetrics(period);
  const { data: productAnalytics, isLoading: productsLoading } = useProductAnalytics();
  const { data: customerAnalytics, isLoading: customersLoading } = useCustomerAnalytics();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    return (
      <span className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {isPositive ? '+' : ''}{change.toFixed(1)}%
      </span>
    );
  };

  const getPeriodLabel = () => {
    switch (period) {
      case '7d': return '7 derniers jours';
      case '30d': return '30 derniers jours';
      case '90d': return '90 derniers jours';
    }
  };

  const handleExport = () => {
    if (!metrics) return;
    
    const data = {
      period: getPeriodLabel(),
      exportDate: new Date().toISOString(),
      revenue: metrics.revenue,
      orders: metrics.orders,
      avgOrderValue: metrics.avgOrderValue,
      customers: metrics.customers,
      topProducts: metrics.topProducts,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-intelligence-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  return (
    <>
      <Helmet>
        <title>Business Intelligence | ShopOpti</title>
        <meta name="description" content="Analyses avancées et insights pour votre business" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Business Intelligence</h1>
            <p className="text-muted-foreground">
              Analyses avancées et insights pour votre business
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 derniers jours</SelectItem>
                <SelectItem value="30d">30 derniers jours</SelectItem>
                <SelectItem value="90d">90 derniers jours</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport} disabled={!metrics}>
              <Download className="mr-2 h-4 w-4" />
              Exporter
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        {metricsLoading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardContent className="pt-6 flex items-center justify-center h-24">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics?.revenue.current || 0)}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  {formatChange(metrics?.revenue.change || 0)}
                  <span>vs période précédente</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commandes</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.orders.current || 0}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  {formatChange(metrics?.orders.change || 0)}
                  <span>vs période précédente</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Panier moyen</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics?.avgOrderValue || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.orders.current || 0} commandes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Nouveaux clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.customers.new || 0}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  {formatChange(metrics?.customers.change || 0)}
                  <span>• {metrics?.customers.total || 0} total</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="performance" className="space-y-4">
          <TabsList>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="customers">Clients</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Évolution du CA</CardTitle>
                  <CardDescription>Chiffre d'affaires par jour</CardDescription>
                </CardHeader>
                <CardContent>
                  {metricsLoading ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : metrics?.revenueByDay && metrics.revenueByDay.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={metrics.revenueByDay}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: fr })}
                        />
                        <YAxis tickFormatter={(value) => `€${value}`} />
                        <Tooltip 
                          formatter={(value: number) => [formatCurrency(value), 'CA']}
                          labelFormatter={(label) => format(new Date(label), 'PPP', { locale: fr })}
                        />
                        <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
                      <p className="text-muted-foreground">Aucune donnée pour cette période</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top produits</CardTitle>
                  <CardDescription>Meilleures ventes de la période</CardDescription>
                </CardHeader>
                <CardContent>
                  {metricsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                      ))}
                    </div>
                  ) : metrics?.topProducts && metrics.topProducts.length > 0 ? (
                    <div className="space-y-4">
                      {metrics.topProducts.map((product, i) => (
                        <div key={product.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{i + 1}</Badge>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {product.sales} ventes
                              </p>
                            </div>
                          </div>
                          <span className="font-semibold">{formatCurrency(product.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      Aucune vente pour cette période
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{productAnalytics?.totalProducts || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {productAnalytics?.activeProducts || 0} actifs
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Marge Moyenne</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(productAnalytics?.avgMargin || 0).toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">sur produits avec coût</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    Stock Faible
                    {(productAnalytics?.lowStock || 0) > 0 && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{productAnalytics?.lowStock || 0}</div>
                  <p className="text-xs text-muted-foreground">produits à réapprovisionner</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    Rupture
                    {(productAnalytics?.outOfStock || 0) > 0 && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{productAnalytics?.outOfStock || 0}</div>
                  <p className="text-xs text-muted-foreground">produits en rupture</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="customers">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{customerAnalytics?.totalCustomers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {customerAnalytics?.withOrders || 0} avec commandes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Taux de Récurrence</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(customerAnalytics?.repeatRate || 0).toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    {customerAnalytics?.repeatCustomers || 0} clients récurrents
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Panier Moyen Client</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(customerAnalytics?.avgSpent || 0)}</div>
                  <p className="text-xs text-muted-foreground">par client</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">CA Total Clients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(customerAnalytics?.totalRevenue || 0)}</div>
                  <p className="text-xs text-muted-foreground">cumulé</p>
                </CardContent>
              </Card>
            </div>

            {customerAnalytics?.segments && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Segmentation Clients</CardTitle>
                  <CardDescription>Répartition par valeur</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-lg bg-yellow-500/10">
                      <div className="text-2xl font-bold text-yellow-600">{customerAnalytics.segments.vip}</div>
                      <p className="text-sm">VIP (&gt;500€)</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-green-500/10">
                      <div className="text-2xl font-bold text-green-600">{customerAnalytics.segments.regular}</div>
                      <p className="text-sm">Réguliers (100-500€)</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-blue-500/10">
                      <div className="text-2xl font-bold text-blue-600">{customerAnalytics.segments.occasional}</div>
                      <p className="text-sm">Occasionnels (&lt;100€)</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted">
                      <div className="text-2xl font-bold text-muted-foreground">{customerAnalytics.segments.inactive}</div>
                      <p className="text-sm">Inactifs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default BusinessIntelligencePage;
