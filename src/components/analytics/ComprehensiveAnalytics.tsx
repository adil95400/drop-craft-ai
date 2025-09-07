import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Activity, 
  Target,
  Zap,
  Globe,
  Smartphone,
  Clock,
  Star,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface AnalyticsData {
  revenue: Array<{ date: string; amount: number; orders: number }>;
  products: Array<{ category: string; count: number; revenue: number }>;
  users: Array<{ date: string; new_users: number; active_users: number }>;
  performance: Array<{ metric: string; value: number; change: number }>;
  geographic: Array<{ country: string; users: number; revenue: number }>;
  realtime: {
    online_users: number;
    active_sessions: number;
    current_revenue: number;
    conversion_rate: number;
  };
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff0000'];

export function ComprehensiveAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadAnalytics, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeRange, autoRefresh]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      startDate.setDate(endDate.getDate() - days);

      // Load multiple analytics data in parallel
      const [
        revenueData,
        productsData,
        usersData,
        performanceData,
        geoData,
        realtimeData
      ] = await Promise.all([
        loadRevenueAnalytics(startDate, endDate),
        loadProductAnalytics(startDate, endDate),
        loadUserAnalytics(startDate, endDate),
        loadPerformanceAnalytics(),
        loadGeographicAnalytics(startDate, endDate),
        loadRealtimeAnalytics()
      ]);

      setAnalytics({
        revenue: revenueData,
        products: productsData,
        users: usersData,
        performance: performanceData,
        geographic: geoData,
        realtime: realtimeData
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRevenueAnalytics = async (startDate: Date, endDate: Date) => {
    // Mock revenue data for demo
    const mockData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      mockData.push({
        date: date.toISOString().split('T')[0],
        amount: Math.floor(Math.random() * 5000) + 1000,
        orders: Math.floor(Math.random() * 50) + 10
      });
    }
    
    const revenueByDate = new Map();
    mockData.forEach(item => {
      revenueByDate.set(item.date, { amount: item.amount, orders: item.orders });
    });

    return Array.from(revenueByDate.entries()).map(([date, data]) => ({
      date,
      amount: data.amount,
      orders: data.orders
    })).sort((a, b) => a.date.localeCompare(b.date));
  };

  const loadProductAnalytics = async (startDate: Date, endDate: Date) => {
    const { data: products } = await supabase
      .from('imported_products')
      .select('category, price')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Group by category
    const productsByCategory = new Map();
    products?.forEach(product => {
      const category = product.category || 'Non catégorisé';
      if (!productsByCategory.has(category)) {
        productsByCategory.set(category, { count: 0, revenue: 0 });
      }
      const current = productsByCategory.get(category);
      current.count += 1;
      current.revenue += parseFloat(product.price) || 0;
    });

    return Array.from(productsByCategory.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      revenue: data.revenue
    }));
  };

  const loadUserAnalytics = async (startDate: Date, endDate: Date) => {
    // Simulate user analytics - replace with real data
    const mockData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      mockData.push({
        date: date.toISOString().split('T')[0],
        new_users: Math.floor(Math.random() * 50) + 10,
        active_users: Math.floor(Math.random() * 200) + 100
      });
    }
    return mockData;
  };

  const loadPerformanceAnalytics = async () => {
    // Performance metrics
    return [
      { metric: 'Taux de conversion', value: 3.4, change: 0.2 },
      { metric: 'Panier moyen', value: 127.50, change: -2.1 },
      { metric: 'Pages vues/session', value: 4.2, change: 0.5 },
      { metric: 'Temps de session (min)', value: 8.3, change: 1.2 },
      { metric: 'Taux de rebond (%)', value: 32.1, change: -1.8 },
      { metric: 'Score satisfaction', value: 4.6, change: 0.1 }
    ];
  };

  const loadGeographicAnalytics = async (startDate: Date, endDate: Date) => {
    // Mock geographic data
    return [
      { country: 'France', users: 1250, revenue: 45600 },
      { country: 'Belgique', users: 340, revenue: 12800 },
      { country: 'Suisse', users: 180, revenue: 8900 },
      { country: 'Canada', users: 95, revenue: 4200 },
      { country: 'Allemagne', users: 75, revenue: 3100 }
    ];
  };

  const loadRealtimeAnalytics = async () => {
    // Real-time metrics
    return {
      online_users: Math.floor(Math.random() * 50) + 20,
      active_sessions: Math.floor(Math.random() * 100) + 50,
      current_revenue: Math.floor(Math.random() * 1000) + 500,
      conversion_rate: 3.2 + (Math.random() - 0.5)
    };
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

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics Avancées</h2>
          <p className="text-muted-foreground">Vue d'ensemble complète des performances</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            size="sm"
          >
            <Activity className="w-4 h-4 mr-2" />
            {autoRefresh ? 'Temps réel ON' : 'Temps réel OFF'}
          </Button>
          
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="24h">24 heures</option>
            <option value="7d">7 jours</option>
            <option value="30d">30 jours</option>
            <option value="90d">90 jours</option>
          </select>
        </div>
      </div>

      {/* Real-time metrics */}
      {analytics?.realtime && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Utilisateurs en ligne</p>
                  <p className="text-2xl font-bold text-green-500">
                    {analytics.realtime.online_users}
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sessions actives</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {analytics.realtime.active_sessions}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">CA temps réel</p>
                  <p className="text-2xl font-bold text-purple-500">
                    {formatCurrency(analytics.realtime.current_revenue)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taux conversion</p>
                  <p className="text-2xl font-bold text-orange-500">
                    {formatPercentage(analytics.realtime.conversion_rate)}
                  </p>
                </div>
                <Target className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main analytics tabs */}
      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="geographic">Géographie</TabsTrigger>
        </TabsList>

        {/* Revenue Analytics */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Évolution du Chiffre d'Affaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics?.revenue || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Commandes par jour</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analytics?.revenue || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Résumé Revenus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total période:</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(
                        analytics?.revenue?.reduce((sum, item) => sum + item.amount, 0) || 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Commandes totales:</span>
                    <span className="font-bold">
                      {analytics?.revenue?.reduce((sum, item) => sum + item.orders, 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Panier moyen:</span>
                    <span className="font-bold">
                      {formatCurrency(
                        (analytics?.revenue?.reduce((sum, item) => sum + item.amount, 0) || 0) /
                        (analytics?.revenue?.reduce((sum, item) => sum + item.orders, 0) || 1)
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Products Analytics */}
        <TabsContent value="products" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Produits par Catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics?.products || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, count }) => `${category}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {(analytics?.products || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenus par Catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics?.products || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="revenue" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Analytics */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Évolution des Utilisateurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.users || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="new_users" 
                    stroke="#8884d8" 
                    name="Nouveaux utilisateurs"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="active_users" 
                    stroke="#82ca9d" 
                    name="Utilisateurs actifs"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Analytics */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics?.performance?.map((metric, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{metric.metric}</p>
                      <p className="text-2xl font-bold">
                        {metric.metric.includes('€') || metric.metric.includes('Panier') 
                          ? formatCurrency(metric.value)
                          : metric.metric.includes('%') || metric.metric.includes('Taux')
                          ? formatPercentage(metric.value)
                          : metric.value
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {metric.change > 0 ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-sm font-medium ${
                        metric.change > 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {Math.abs(metric.change).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Geographic Analytics */}
        <TabsContent value="geographic" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Utilisateurs par Pays
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics?.geographic || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="country" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="users" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Pays par Revenus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.geographic?.map((country, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium">{country.country}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(country.revenue)}</div>
                        <div className="text-sm text-muted-foreground">{country.users} utilisateurs</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}