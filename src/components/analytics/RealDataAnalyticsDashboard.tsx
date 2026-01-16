/**
 * Dashboard Analytics avec données réelles Supabase - Version améliorée
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
  RefreshCw, Download, AlertCircle, Eye, Target, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnalyticsRealData } from '@/hooks/useAnalyticsRealData';

interface RealDataAnalyticsDashboardProps {
  className?: string;
}

export function RealDataAnalyticsDashboard({ className }: RealDataAnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('area');

  const { data: analytics, isLoading, refetch, isRefetching } = useAnalyticsRealData(timeRange);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatChange = (change: number) => {
    const isPositive = change > 0;
    return (
      <div className={cn(
        "flex items-center gap-1 text-sm font-medium",
        isPositive ? "text-emerald-600" : change < 0 ? "text-red-500" : "text-muted-foreground"
      )}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : change < 0 ? <TrendingDown className="h-3 w-3" /> : null}
        {change > 0 ? '+' : ''}{change.toFixed(1)}%
      </div>
    );
  };

  const renderSalesChart = () => {
    if (!analytics?.revenueByDay || analytics.revenueByDay.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
          <AlertCircle className="h-8 w-8 mb-2" />
          <p>Aucune donnée pour cette période</p>
        </div>
      );
    }

    const chartProps = {
      data: analytics.revenueByDay,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'revenue' ? formatCurrency(value) : value,
                  name === 'revenue' ? 'Ventes' : 'Commandes'
                ]}
                contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
              />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} name="Ventes (€)" />
              <Line type="monotone" dataKey="orders" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} name="Commandes" />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'revenue' ? formatCurrency(value) : value,
                  name === 'revenue' ? 'Ventes' : 'Commandes'
                ]}
                contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
              />
              <Legend />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Ventes (€)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="orders" fill="hsl(var(--chart-2))" name="Commandes" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart {...chartProps}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'revenue' ? formatCurrency(value) : value,
                  name === 'revenue' ? 'Ventes' : 'Commandes'
                ]}
                contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
              />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Ventes (€)" />
              <Area type="monotone" dataKey="orders" stroke="hsl(var(--chart-2))" strokeWidth={2} fillOpacity={1} fill="url(#colorOrders)" name="Commandes" />
            </AreaChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className={cn("space-y-4 sm:space-y-6", className)}>
      {/* Demo badge */}
      {analytics?.isDemo && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span className="text-sm text-amber-600">Données de démonstration - Ajoutez des commandes pour voir vos vraies statistiques</span>
        </div>
      )}

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
          
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={cn("h-4 w-4 sm:mr-2", isRefetching && "animate-spin")} />
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
        {isLoading ? (
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
            <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 sm:space-y-2 min-w-0">
                    <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">Chiffre d'affaires</p>
                    <p className="text-base sm:text-lg lg:text-2xl font-bold truncate">
                      {formatCurrency(analytics?.revenue || 0)}
                    </p>
                    {formatChange(analytics?.revenueChange || 0)}
                  </div>
                  <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:border-chart-2/50">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 sm:space-y-2 min-w-0">
                    <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">Commandes</p>
                    <p className="text-base sm:text-lg lg:text-2xl font-bold truncate">
                      {analytics?.orders?.toLocaleString('fr-FR') || 0}
                    </p>
                    {formatChange(analytics?.ordersChange || 0)}
                  </div>
                  <div className="p-1.5 sm:p-2 bg-chart-2/10 rounded-lg flex-shrink-0 group-hover:bg-chart-2/20 transition-colors">
                    <ShoppingCart className="h-4 w-4 text-chart-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:border-chart-3/50">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 sm:space-y-2 min-w-0">
                    <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">Visiteurs</p>
                    <p className="text-base sm:text-lg lg:text-2xl font-bold truncate">
                      {analytics?.visitors?.toLocaleString('fr-FR') || 0}
                    </p>
                    {formatChange(analytics?.visitorsChange || 0)}
                  </div>
                  <div className="p-1.5 sm:p-2 bg-chart-3/10 rounded-lg flex-shrink-0 group-hover:bg-chart-3/20 transition-colors">
                    <Eye className="h-4 w-4 text-chart-3" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:border-chart-4/50">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 sm:space-y-2 min-w-0">
                    <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">Conversion</p>
                    <p className="text-base sm:text-lg lg:text-2xl font-bold truncate">
                      {analytics?.conversionRate?.toFixed(1) || 0}%
                    </p>
                    {formatChange(analytics?.conversionChange || 0)}
                  </div>
                  <div className="p-1.5 sm:p-2 bg-chart-4/10 rounded-lg flex-shrink-0 group-hover:bg-chart-4/20 transition-colors">
                    <Target className="h-4 w-4 text-chart-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Panier moyen</p>
              <p className="text-lg font-bold">{formatCurrency(analytics?.avgOrderValue || 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className="p-2 bg-chart-2/10 rounded-lg">
              <Package className="h-5 w-5 text-chart-2" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Produits vendus</p>
              <p className="text-lg font-bold">{analytics?.productsSold?.toLocaleString('fr-FR') || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="products" className="text-xs sm:text-sm">Top Produits</TabsTrigger>
          <TabsTrigger value="channels" className="text-xs sm:text-sm">Canaux</TabsTrigger>
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
                    <SelectItem value="area">Aires</SelectItem>
                    <SelectItem value="bar">Barres</SelectItem>
                    <SelectItem value="line">Lignes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
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
              {isLoading ? (
                <div className="space-y-3">
                  {Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !analytics?.topProducts || analytics.topProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune vente pour cette période</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {analytics.topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                          index === 0 ? "bg-yellow-100 text-yellow-700" :
                          index === 1 ? "bg-gray-100 text-gray-700" :
                          index === 2 ? "bg-orange-100 text-orange-700" :
                          "bg-muted text-muted-foreground"
                        )}>
                          #{index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-muted-foreground">{product.sales} ventes</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div className="font-bold">{formatCurrency(product.revenue)}</div>
                        {product.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                        ) : product.trend === 'down' ? (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle>Répartition par canal</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : !analytics?.channelDistribution ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Données non disponibles</p>
                </div>
              ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={analytics.channelDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        innerRadius={40}
                        dataKey="value"
                      >
                        {analytics.channelDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="space-y-3 flex flex-col justify-center">
                    {analytics.channelDistribution.map((channel) => (
                      <div key={channel.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: channel.color }}
                          />
                          <span className="font-medium">{channel.name}</span>
                        </div>
                        <Badge variant="secondary">{channel.value}%</Badge>
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
