/**
 * Dashboard Analytics avec données réelles Supabase
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Package,
  RefreshCw, Download, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRealAnalytics } from '@/hooks/useRealAnalytics';
import { useQueryClient } from '@tanstack/react-query';

interface RealDataAnalyticsDashboardProps {
  className?: string;
}

interface RealDataAnalyticsDashboardProps {
  className?: string;
}

export function RealDataAnalyticsDashboard({ className }: RealDataAnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');
  const queryClient = useQueryClient();

  const { analytics, isLoading } = useRealAnalytics();

  // Map existing hook data to component needs
  const metrics = analytics ? {
    revenue: analytics.revenue,
    revenueChange: 0,
    orders: analytics.orders,
    ordersChange: 0,
    customers: analytics.customers,
    customersChange: 0,
    products: analytics.products,
    productsChange: 0,
  } : null;
  
  const metricsLoading = isLoading;
  const salesTrend = analytics?.salesByDay?.map(d => ({ name: d.date.slice(5), sales: d.revenue, orders: d.orders, customers: 0 })) || [];
  const salesTrendLoading = isLoading;
  const topProducts = analytics?.topProducts?.map((p, i) => ({ id: String(i), name: p.name, sales: p.sales, revenue: parseFloat(p.revenue.replace('€', '')) || 0 })) || [];
  const topProductsLoading = isLoading;
  const categories = [{ name: 'Produits', value: 100, color: '#8884d8' }];
  const categoriesLoading = false;

  const refetch = () => queryClient.invalidateQueries({ queryKey: ['real-analytics'] });

  const formatChange = (change: number) => {
    const isPositive = change > 0;
    return (
      <div className={cn(
        "flex items-center gap-1 text-sm",
        isPositive ? "text-green-600" : change < 0 ? "text-red-600" : "text-muted-foreground"
      )}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : change < 0 ? <TrendingDown className="h-3 w-3" /> : null}
        {change > 0 ? '+' : ''}{change}%
      </div>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const renderSalesChart = () => {
    if (salesTrend.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
          <AlertCircle className="h-8 w-8 mb-2" />
          <p>Aucune donnée pour cette période</p>
        </div>
      );
    }

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} name="Ventes (€)" />
              <Line type="monotone" dataKey="orders" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Commandes" />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip formatter={(value: number, name: string) => 
                name === 'sales' ? formatCurrency(value) : value
              } />
              <Legend />
              <Area type="monotone" dataKey="sales" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} name="Ventes (€)" />
              <Area type="monotone" dataKey="orders" stackId="2" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.6} name="Commandes" />
            </AreaChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip formatter={(value: number, name: string) => 
                name === 'sales' ? formatCurrency(value) : value
              } />
              <Legend />
              <Bar dataKey="sales" fill="hsl(var(--primary))" name="Ventes (€)" />
              <Bar dataKey="orders" fill="hsl(var(--chart-2))" name="Commandes" />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className={cn("space-y-4 sm:space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Analytics</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Données en temps réel de votre activité
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
            <SelectTrigger className="w-[110px] sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Exporter</span>
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {metricsLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-24 mb-1" />
                <Skeleton className="h-4 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 sm:space-y-2 min-w-0">
                    <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">Chiffre d'affaires</p>
                    <p className="text-base sm:text-lg lg:text-2xl font-bold truncate">
                      {formatCurrency(metrics?.revenue || 0)}
                    </p>
                    {formatChange(metrics?.revenueChange || 0)}
                  </div>
                  <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg flex-shrink-0">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 sm:space-y-2 min-w-0">
                    <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">Commandes</p>
                    <p className="text-base sm:text-lg lg:text-2xl font-bold truncate">
                      {metrics?.orders?.toLocaleString('fr-FR') || 0}
                    </p>
                    {formatChange(metrics?.ordersChange || 0)}
                  </div>
                  <div className="p-1.5 sm:p-2 bg-chart-2/10 rounded-lg flex-shrink-0">
                    <ShoppingCart className="h-4 w-4 text-chart-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 sm:space-y-2 min-w-0">
                    <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">Clients</p>
                    <p className="text-base sm:text-lg lg:text-2xl font-bold truncate">
                      {metrics?.customers?.toLocaleString('fr-FR') || 0}
                    </p>
                    {formatChange(metrics?.customersChange || 0)}
                  </div>
                  <div className="p-1.5 sm:p-2 bg-chart-3/10 rounded-lg flex-shrink-0">
                    <Users className="h-4 w-4 text-chart-3" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 sm:space-y-2 min-w-0">
                    <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">Produits</p>
                    <p className="text-base sm:text-lg lg:text-2xl font-bold truncate">
                      {metrics?.products?.toLocaleString('fr-FR') || 0}
                    </p>
                    <Badge variant="secondary" className="text-xs">Total catalogue</Badge>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-chart-4/10 rounded-lg flex-shrink-0">
                    <Package className="h-4 w-4 text-chart-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="products" className="text-xs sm:text-sm">Produits</TabsTrigger>
          <TabsTrigger value="categories" className="text-xs sm:text-sm">Catégories</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tendances des ventes</CardTitle>
                <Select value={chartType} onValueChange={(v: any) => setChartType(v)}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Barres</SelectItem>
                    <SelectItem value="line">Lignes</SelectItem>
                    <SelectItem value="area">Aires</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {salesTrendLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                renderSalesChart()
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Top produits vendus</CardTitle>
            </CardHeader>
            <CardContent>
              {topProductsLoading ? (
                <div className="space-y-3">
                  {Array(4).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : topProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune vente pour cette période</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">{product.sales} ventes</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(product.revenue)}</div>
                        <Badge variant="secondary">#{index + 1}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Répartition par catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : categories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune catégorie définie</p>
                </div>
              ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={categories}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {categories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="space-y-3">
                    {categories.map((category) => (
                      <div key={category.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm">{category.name}</span>
                        </div>
                        <Badge variant="outline">{category.value}%</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
