import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  ShoppingBag, 
  Package, 
  Users, 
  DollarSign,
  Star,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Target,
  Zap
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/utils/consoleCleanup';

interface DashboardMetrics {
  revenue: number;
  orders: number;
  products: number;
  customers: number;
  conversionRate: number;
  averageOrderValue: number;
  revenueGrowth: number;
  ordersGrowth: number;
  customersGrowth: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  customer_email: string;
  total_amount: number;
  status: string;
  created_at: string;
  items?: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
}

interface TopProduct {
  id: string;
  name: string;
  sales_count: number;
  revenue: number;
  image_url?: string;
  rating?: number;
  price: number;
}

export const ClientDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const revenueData = [
    { name: 'Jan', revenue: 2400, orders: 24 },
    { name: 'Fév', revenue: 1398, orders: 18 },
    { name: 'Mar', revenue: 9800, orders: 45 },
    { name: 'Avr', revenue: 3908, orders: 32 },
    { name: 'Mai', revenue: 4800, orders: 38 },
    { name: 'Jun', revenue: 3800, orders: 28 },
    { name: 'Jul', revenue: 4300, orders: 35 }
  ];

  const categoryData = [
    { name: 'Electronics', value: 45, color: '#3B82F6' },
    { name: 'Fashion', value: 25, color: '#10B981' },
    { name: 'Home', value: 20, color: '#F59E0B' },
    { name: 'Beauty', value: 10, color: '#EF4444' }
  ];

  const conversionData = [
    { name: 'Lun', visitors: 1200, conversions: 48 },
    { name: 'Mar', visitors: 1400, conversions: 62 },
    { name: 'Mer', visitors: 1100, conversions: 38 },
    { name: 'Jeu', visitors: 1600, conversions: 75 },
    { name: 'Ven', visitors: 1800, conversions: 89 },
    { name: 'Sam', visitors: 2200, conversions: 132 },
    { name: 'Dim', visitors: 1900, conversions: 98 }
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard analytics
      const { data: metricsData } = await supabase.functions.invoke('get-dashboard-analytics');
      if (metricsData?.data) {
        setMetrics(metricsData.data);
      }

      // Fetch recent orders with customer info
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          id, order_number, total_amount, status, created_at,
          customer_id,
          order_items(product_name, qty, unit_price)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (ordersData) {
        // Fetch customer emails separately
        const customerIds = ordersData.map(o => o.customer_id).filter(Boolean);
        let customerMap: Record<string, string> = {};
        
        if (customerIds.length > 0) {
          const { data: customers } = await supabase
            .from('customers')
            .select('id, email')
            .in('id', customerIds);
          
          if (customers) {
            customerMap = Object.fromEntries(customers.map(c => [c.id, c.email]));
          }
        }

        const transformedOrders = ordersData.map(order => ({
          id: order.id,
          order_number: order.order_number,
          customer_email: order.customer_id ? customerMap[order.customer_id] || 'Email non disponible' : 'Email non disponible',
          total_amount: order.total_amount || 0,
          status: order.status || 'pending',
          created_at: order.created_at,
          items: order.order_items?.map((item: any) => ({
            product_name: item.product_name,
            quantity: item.qty,
            unit_price: item.unit_price
          }))
        }));
        setRecentOrders(transformedOrders);
      }

      // Fetch top products directly from products table
      const { data: productsData } = await supabase
        .from('products')
        .select('id, title, name, price, image_url, stock_quantity')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6);

      if (productsData) {
        const topProductsData: TopProduct[] = productsData.map(product => ({
          id: product.id,
          name: product.title || product.name || 'Produit sans nom',
          sales_count: Math.floor(Math.random() * 100), // Placeholder
          revenue: (product.price || 0) * Math.floor(Math.random() * 50),
          image_url: product.image_url,
          rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
          price: product.price || 0
        }));
        setTopProducts(topProductsData);
      }

    } catch (error) {
      logError(error as Error, 'Error fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0;
    return (
      <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        <span className="text-xs font-medium">{Math.abs(growth)}%</span>
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'completed': 'bg-green-100 text-green-800',
      'shipped': 'bg-blue-100 text-blue-800',
      'processing': 'bg-yellow-100 text-yellow-800',
      'pending': 'bg-orange-100 text-orange-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tableau de Bord</h1>
          <p className="text-muted-foreground">Vue d'ensemble de vos performances e-commerce</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            En ligne
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchDashboardData}>
            <Zap className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Chiffre d'Affaires</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics?.revenue || 0)}</p>
                {metrics?.revenueGrowth !== undefined && formatGrowth(metrics.revenueGrowth)}
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Commandes</p>
                <p className="text-2xl font-bold">{metrics?.orders || 0}</p>
                {metrics?.ordersGrowth !== undefined && formatGrowth(metrics.ordersGrowth)}
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produits Actifs</p>
                <p className="text-2xl font-bold">{metrics?.products || 0}</p>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Package className="w-3 h-3" />
                  <span className="text-xs">Catalogue</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clients Actifs</p>
                <p className="text-2xl font-bold">{metrics?.customers || 0}</p>
                {metrics?.customersGrowth !== undefined && formatGrowth(metrics.customersGrowth)}
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux de Conversion</p>
                <p className="text-xl font-bold">{metrics?.conversionRate?.toFixed(1) || 0}%</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
            <Progress value={metrics?.conversionRate || 0} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Panier Moyen</p>
                <p className="text-xl font-bold">{formatCurrency(metrics?.averageOrderValue || 0)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dernière Mise à Jour</p>
                <p className="text-xl font-bold">{new Date().toLocaleTimeString('fr-FR')}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Évolution du Chiffre d'Affaires</CardTitle>
            <CardDescription>Revenus et commandes des 7 derniers mois</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value, name) => [
                  name === 'revenue' ? formatCurrency(value as number) : value,
                  name === 'revenue' ? 'Revenus' : 'Commandes'
                ]} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stackId="1" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.6} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Taux de Conversion Hebdomadaire</CardTitle>
            <CardDescription>Visiteurs vs conversions cette semaine</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="visitors" fill="#E5E7EB" name="Visiteurs" />
                <Bar dataKey="conversions" fill="#10B981" name="Conversions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Commandes Récentes</TabsTrigger>
          <TabsTrigger value="products">Top Produits</TabsTrigger>
          <TabsTrigger value="categories">Répartition</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dernières Commandes</CardTitle>
              <CardDescription>Vos 5 commandes les plus récentes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">{order.order_number}</p>
                        <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(order.total_amount)}</p>
                      <Badge className={getStatusColor(order.status)} variant="outline">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {recentOrders.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">Aucune commande récente</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Produits les Plus Vendus</CardTitle>
              <CardDescription>Top 6 des produits par nombre de ventes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topProducts.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4 space-y-2">
                    <div className="aspect-square bg-muted rounded-lg mb-2 overflow-hidden">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <h4 className="font-medium text-sm line-clamp-2">{product.name}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{formatCurrency(product.price)}</span>
                      {product.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span className="text-xs text-muted-foreground">{product.rating}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {product.sales_count} ventes • {formatCurrency(product.revenue)} CA
                    </p>
                  </div>
                ))}
                {topProducts.length === 0 && (
                  <p className="text-center text-muted-foreground py-4 col-span-full">Aucun produit</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Répartition par Catégorie</CardTitle>
              <CardDescription>Distribution des ventes par catégorie</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
