import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Package, Eye, Download, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsDashboardProps {
  className?: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
  onTimeRangeChange?: (range: string) => void;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  className,
  timeRange = '30d',
  onTimeRangeChange
}) => {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');

  const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
  const days = daysMap[timeRange] || 30;
  const since = new Date(Date.now() - days * 86400000).toISOString();

  // Real metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['analytics-metrics', timeRange],
    queryFn: async () => {
      const ordersRes = await supabase.from('orders').select('id, total_amount, created_at').gte('created_at', since);
      const customersRes = await supabase.from('customers').select('id', { count: 'exact' }).eq('status', 'active');
      const productsRes = await supabase.from('products').select('id', { count: 'exact' }).eq('status', 'active');
      const orders = ordersRes.data || [];
      const revenue = orders.reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
      return {
        revenue,
        orderCount: orders.length,
        activeCustomers: customersRes.count || 0,
        activeProducts: productsRes.count || 0,
      };
    },
  });

  // Sales by month
  const { data: salesData } = useQuery({
    queryKey: ['analytics-sales', timeRange],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('total_amount, created_at').gte('created_at', since).order('created_at');
      if (!data?.length) return [];
      const byMonth: Record<string, { sales: number; orders: number }> = {};
      for (const o of data) {
        const month = new Date(o.created_at).toLocaleDateString('fr-FR', { month: 'short' });
        if (!byMonth[month]) byMonth[month] = { sales: 0, orders: 0 };
        byMonth[month].sales += o.total_amount || 0;
        byMonth[month].orders += 1;
      }
      return Object.entries(byMonth).map(([name, v]) => ({ name, ...v }));
    },
  });

  // Products by category
  const { data: productData } = useQuery({
    queryKey: ['analytics-products-cat'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('category').eq('status', 'active');
      if (!data?.length) return [];
      const cats: Record<string, number> = {};
      for (const p of data) {
        const cat = p.category || 'Autres';
        cats[cat] = (cats[cat] || 0) + 1;
      }
      return Object.entries(cats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));
    },
  });

  // Top products
  const { data: topProducts } = useQuery({
    queryKey: ['analytics-top-products', timeRange],
    queryFn: async () => {
      const { data: items } = await supabase.from('order_items').select('product_id, qty, unit_price, product_name').limit(500);
      if (!items?.length) return [];
      const map: Record<string, { name: string; sales: number; revenue: number }> = {};
      for (const it of items) {
        const pid = it.product_id || it.product_name;
        if (!map[pid]) map[pid] = { name: it.product_name || pid, sales: 0, revenue: 0 };
        map[pid].sales += it.qty || 1;
        map[pid].revenue += (it.unit_price || 0) * (it.qty || 1);
      }
      return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 4);
    },
  });

  const formatChange = (change: number) => {
    const isPositive = change > 0;
    return (
      <div className={cn("flex items-center gap-1 text-sm", isPositive ? "text-green-600" : "text-red-600")}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {Math.abs(change)}%
      </div>
    );
  };

  const metricCards = [
    { title: "Chiffre d'affaires", value: `${(metrics?.revenue || 0).toLocaleString('fr-FR')} €`, icon: <DollarSign className="h-4 w-4" /> },
    { title: 'Commandes', value: (metrics?.orderCount || 0).toLocaleString(), icon: <ShoppingCart className="h-4 w-4" /> },
    { title: 'Clients actifs', value: (metrics?.activeCustomers || 0).toLocaleString(), icon: <Users className="h-4 w-4" /> },
    { title: 'Produits actifs', value: (metrics?.activeProducts || 0).toLocaleString(), icon: <Package className="h-4 w-4" /> },
  ];

  const renderChart = () => {
    const data = salesData || [];
    const ChartWrapper = chartType === 'line' ? LineChart : chartType === 'area' ? AreaChart : BarChart;
    return (
      <ResponsiveContainer width="100%" height={300}>
        <ChartWrapper data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {chartType === 'bar' && <><Bar dataKey="sales" fill="#8884d8" name="Ventes (€)" /><Bar dataKey="orders" fill="#82ca9d" name="Commandes" /></>}
          {chartType === 'line' && <><Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} name="Ventes (€)" /><Line type="monotone" dataKey="orders" stroke="#82ca9d" strokeWidth={2} name="Commandes" /></>}
          {chartType === 'area' && <><Area type="monotone" dataKey="sales" stackId="1" stroke="#8884d8" fill="#8884d8" name="Ventes (€)" /><Area type="monotone" dataKey="orders" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Commandes" /></>}
        </ChartWrapper>
      </ResponsiveContainer>
    );
  };

  if (metricsLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className={cn("space-y-4 sm:space-y-6", className)}>
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Analytics</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Suivez les performances de votre business</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className="w-[110px] sm:w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Exporter</span></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {metricCards.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 sm:space-y-2 min-w-0">
                  <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground truncate">{metric.title}</p>
                  <p className="text-base sm:text-lg lg:text-2xl font-bold truncate">{metric.value}</p>
                </div>
                <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg flex-shrink-0">{metric.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="sales" className="text-xs sm:text-sm">Ventes</TabsTrigger>
          <TabsTrigger value="products" className="text-xs sm:text-sm">Produits</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tendances des ventes</CardTitle>
                <Select value={chartType} onValueChange={(v: any) => setChartType(v)}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Barres</SelectItem>
                    <SelectItem value="line">Lignes</SelectItem>
                    <SelectItem value="area">Aires</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>{renderChart()}</CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader><CardTitle>Répartition par catégorie</CardTitle></CardHeader>
              <CardContent>
                {(productData?.length || 0) > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={productData} cx="50%" cy="50%" labelLine={false}
                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80} fill="#8884d8" dataKey="value">
                        {(productData || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Aucune donnée de catégorie</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardHeader><CardTitle>Détails des ventes</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={salesData || []}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend />
                  <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={3} name="Ventes (€)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader><CardTitle>Top produits</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(topProducts || []).length === 0 && <p className="text-center text-muted-foreground py-8">Aucune donnée de vente</p>}
                {(topProducts || []).map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-muted-foreground">{product.sales} ventes</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">€{product.revenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</div>
                      <Badge variant="secondary">{index + 1}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
