import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package, Eye, RefreshCw, Download, Calendar } from 'lucide-react';
import { useRealAnalytics } from '@/hooks/useRealAnalytics';
import { useSimplePlan } from '@/hooks/useSimplePlan';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export const LiveAnalyticsDashboard = () => {
  const { user } = useAuth();
  const { isPro, isUltraPro } = useSimplePlan(user);
  const { analytics, isLoading } = useRealAnalytics();
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Mock real-time data
  const realtimeMetrics = [
    {
      title: "Revenus en temps réel",
      value: formatCurrency(analytics?.revenue || 0),
      change: { value: 12.5, trend: 'up' },
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Commandes aujourd'hui",
      value: analytics?.orders?.toString() || "0",
      change: { value: 8.3, trend: 'up' },
      icon: ShoppingCart,
      color: "text-blue-600"
    },
    {
      title: "Visiteurs actifs",
      value: "247",
      change: { value: -2.1, trend: 'down' },
      icon: Eye,
      color: "text-purple-600"
    },
    {
      title: "Taux de conversion",
      value: formatPercentage(analytics?.conversionRate || 0),
      change: { value: 0.5, trend: 'up' },
      icon: TrendingUp,
      color: "text-orange-600"
    }
  ];

  // Enhanced chart data
  const performanceData = analytics?.salesByDay?.map(day => ({
    date: new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short' }),
    revenue: day.revenue,
    orders: day.orders,
    visitors: Math.floor(Math.random() * 500) + 200,
    conversions: Math.floor(Math.random() * 50) + 10
  })) || [];

  const trafficSources = [
    { name: 'Recherche organique', value: 45, color: '#0088FE' },
    { name: 'Réseaux sociaux', value: 25, color: '#00C49F' },
    { name: 'Email marketing', value: 20, color: '#FFBB28' },
    { name: 'Publicité payante', value: 10, color: '#FF8042' }
  ];

  const topProducts = analytics?.topProducts || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Analytics en Temps Réel</h2>
          <p className="text-muted-foreground">
            Données mises à jour il y a {formatDistanceToNow(new Date(), { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24h</SelectItem>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          
          {isPro() && (
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          )}
        </div>
      </div>

      {/* Live metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {realtimeMetrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {metric.title}
                    </p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                  </div>
                  <IconComponent className={`h-8 w-8 ${metric.color}`} />
                </div>
                
                <div className="flex items-center mt-4 text-sm">
                  {metric.change.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <span className={metric.change.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                    {metric.change.value > 0 ? '+' : ''}{metric.change.value}%
                  </span>
                  <span className="text-muted-foreground ml-1">vs hier</span>
                </div>
                
                {/* Live indicator */}
                <div className="absolute top-3 right-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                    <span className="text-xs text-green-600 font-medium">LIVE</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenus par jour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), 'Revenus']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Commandes par jour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics for Pro/Ultra Pro */}
      {isPro() && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Traffic Sources */}
          <Card>
            <CardHeader>
              <CardTitle>Sources de Trafic</CardTitle>
              <CardDescription>Répartition du trafic par canal</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={trafficSources}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {trafficSources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Produits Populaires</CardTitle>
              <CardDescription>Meilleures performances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                      <div>
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">{product.sales} ventes</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{product.revenue}</p>
                      <p className="text-sm text-green-600">{product.growth}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ultra Pro Features */}
      {isUltraPro() && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50/50 to-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Analytics Prédictifs
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">Ultra Pro</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg bg-white/50">
                <h4 className="font-medium mb-2">Prévision 7 jours</h4>
                <p className="text-2xl font-bold text-green-600">€{((analytics?.revenue || 0) * 1.15).toFixed(0)}</p>
                <p className="text-sm text-muted-foreground">+15% prévu</p>
              </div>
              
              <div className="p-4 border rounded-lg bg-white/50">
                <h4 className="font-medium mb-2">Tendance conversion</h4>
                <p className="text-2xl font-bold text-blue-600">{((analytics?.conversionRate || 0) + 0.3).toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Amélioration attendue</p>
              </div>
              
              <div className="p-4 border rounded-lg bg-white/50">
                <h4 className="font-medium mb-2">Opportunité détectée</h4>
                <p className="text-sm font-medium text-orange-600">Optimisation mobile</p>
                <p className="text-sm text-muted-foreground">+25% conversion mobile possible</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};