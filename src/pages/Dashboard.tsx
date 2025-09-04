import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Package, 
  DollarSign, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Target,
  Zap,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { usePlan } from '@/contexts/PlanContext';
import { CanvaIntegrationPanel } from '@/components/marketing/CanvaIntegrationPanel';

interface DashboardStats {
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

const Dashboard = () => {
  const { user } = useAuth();
  const { isUltraPro, isPro } = usePlan();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch dashboard analytics
      const { data: analyticsData } = await supabase
        .rpc('get_dashboard_analytics', { user_id_param: user.id });
      
      if (analyticsData && typeof analyticsData === 'object' && !Array.isArray(analyticsData)) {
        setStats(analyticsData as unknown as DashboardStats);
      }

      // Fetch recent orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          *,
          customers (name, email)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (ordersData) {
        setRecentOrders(ordersData);
      }

      // Fetch top products
      const { data: productsData } = await supabase
        .from('imported_products')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(5);

      if (productsData) {
        setTopProducts(productsData);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  const StatCard = ({ title, value, icon: Icon, change, trend }: any) => (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center text-xs text-muted-foreground">
            {trend === 'up' ? (
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
            ) : (
              <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
            )}
            <span className={trend === 'up' ? 'text-emerald-500' : 'text-red-500'}>
              {Math.abs(change)}%
            </span>
            <span className="ml-1">vs mois dernier</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Tableau de bord</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tableau de bord</h2>
          <p className="text-muted-foreground">
            Vue d'ensemble de votre activité e-commerce
          </p>
        </div>
        {isUltraPro && (
          <Button size="sm" className="gap-2">
            <Zap className="h-4 w-4" />
            Rapport AI
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Chiffre d'affaires"
          value={formatCurrency(stats?.revenue || 0)}
          icon={DollarSign}
          change={stats?.revenueGrowth}
          trend={stats?.revenueGrowth >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Commandes"
          value={stats?.orders || 0}
          icon={ShoppingCart}
          change={stats?.ordersGrowth}
          trend={stats?.ordersGrowth >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Produits"
          value={stats?.products || 0}
          icon={Package}
          change={undefined}
          trend={undefined}
        />
        <StatCard
          title="Clients"
          value={stats?.customers || 0}
          icon={Users}
          change={stats?.customersGrowth}
          trend={stats?.customersGrowth >= 0 ? 'up' : 'down'}
        />
      </div>

      {/* Additional Metrics for Pro+ */}
      {isPro && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.conversionRate?.toFixed(1) || 0}%</div>
              <Progress value={stats?.conversionRate || 0} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Panier moyen</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats?.averageOrderValue || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">Excellente</div>
              <p className="text-xs text-muted-foreground">
                Tous les indicateurs sont positifs
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="orders">Commandes récentes</TabsTrigger>
          <TabsTrigger value="products">Produits top</TabsTrigger>
          {isUltraPro && <TabsTrigger value="canva">Design Canva</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Activité récente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.slice(0, 3).map((order: any) => (
                    <div key={order.id} className="flex items-center gap-4">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          Commande #{order.order_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.customers?.name || 'Client'} - {formatCurrency(order.total_amount)}
                        </p>
                      </div>
                      <Badge variant={order.status === 'paid' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/import">
                    <Package className="mr-2 h-4 w-4" />
                    Importer des produits
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/orders">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Gérer les commandes
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/customers">
                    <Users className="mr-2 h-4 w-4" />
                    Voir les clients
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Commandes récentes</CardTitle>
              <CardDescription>
                Les dernières commandes de votre boutique
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Commande #{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.customers?.name || 'Client'} • {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(order.total_amount)}</p>
                      <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {recentOrders.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune commande récente
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Produits populaires</CardTitle>
              <CardDescription>
                Vos produits les plus performants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product: any) => (
                  <div key={product.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    {product.image_urls?.[0] && (
                      <img 
                        src={product.image_urls[0]} 
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.category} • {formatCurrency(product.price)}
                      </p>
                    </div>
                    <Badge variant={product.status === 'published' ? 'default' : 'secondary'}>
                      {product.status}
                    </Badge>
                  </div>
                ))}
                {topProducts.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun produit importé
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isUltraPro && (
          <TabsContent value="canva" className="space-y-4">
            <CanvaIntegrationPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Dashboard;