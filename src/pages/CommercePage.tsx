import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, Package, TrendingUp, DollarSign, 
  Users, Truck, BarChart3, AlertCircle, CheckCircle,
  Clock, RefreshCw, Store, Boxes, Loader2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useRealAnalytics } from '@/hooks/useRealAnalytics';
import { useCustomersUnified } from '@/hooks/unified';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function CommercePage() {
  const { analytics, isLoading: analyticsLoading } = useRealAnalytics();
  const { stats: customerStats } = useCustomersUnified();
  
  const { data: orders = [], isLoading: ordersLoading, refetch } = useQuery({
    queryKey: ['commerce-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['commerce-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(10);
      
      if (error) throw error;
      return data || [];
    }
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const isLoading = analyticsLoading || ordersLoading || productsLoading;

  const stats = [
    { 
      label: 'Ventes du jour', 
      value: `€${(analytics?.revenue || 0).toLocaleString('fr-FR')}`, 
      change: '+12.5%',
      icon: DollarSign, 
      color: 'text-green-500' 
    },
    { 
      label: 'Commandes actives', 
      value: (analytics?.orders || 0).toString(), 
      change: `+${Math.floor((analytics?.orders || 0) * 0.08)}`,
      icon: ShoppingCart, 
      color: 'text-blue-500' 
    },
    { 
      label: 'Produits en stock', 
      value: (analytics?.products || 0).toString(), 
      change: '-23',
      icon: Package, 
      color: 'text-purple-500' 
    },
    { 
      label: 'Clients actifs', 
      value: (customerStats?.active || 0).toString(), 
      change: `+${Math.floor((customerStats?.active || 0) * 0.05)}`,
      icon: Users, 
      color: 'text-orange-500' 
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      'pending': { label: 'En attente', color: 'bg-yellow-500' },
      'processing': { label: 'En cours', color: 'bg-blue-500' },
      'shipped': { label: 'Expédié', color: 'bg-purple-500' },
      'delivered': { label: 'Livré', color: 'bg-green-500' },
      'cancelled': { label: 'Annulé', color: 'bg-red-500' }
    };
    return statusMap[status] || { label: status, color: 'bg-gray-500' };
  };

  const recentOrders = orders.slice(0, 4).map(order => {
    const statusInfo = getStatusBadge(order.status);
    return {
      id: order.order_number || `#${order.id.slice(0, 8)}`,
      customer: 'Client',
      items: 1,
      total: `€${order.total_amount?.toLocaleString('fr-FR') || 0}`,
      status: statusInfo.label,
      statusColor: statusInfo.color
    };
  });

  const inventory = products.slice(0, 4).map(product => {
    const stock = product.stock_quantity || 0;
    const reserved = Math.floor(stock * 0.3);
    const available = stock - reserved;
    const status = available === 0 ? 'critical' : available < 10 ? 'low' : 'normal';
    
    return {
      product: product.name,
      stock,
      reserved,
      available,
      status
    };
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Chargement des données commerce...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Store className="h-8 w-8 text-primary" />
            Commerce Pro
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestion complète de votre activité e-commerce
          </p>
        </div>
        <Button onClick={refreshData} disabled={isRefreshing} size="lg">
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.change} depuis hier
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Commandes
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Boxes className="mr-2 h-4 w-4" />
            Inventaire
          </TabsTrigger>
          <TabsTrigger value="shipping">
            <Truck className="mr-2 h-4 w-4" />
            Expéditions
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Onglet Commandes */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Commandes Récentes</CardTitle>
              <CardDescription>
                Suivi de vos dernières commandes en temps réel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div 
                    key={order.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-semibold">{order.id}</p>
                        <p className="text-sm text-muted-foreground">{order.customer}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{order.items} articles</p>
                        <p className="font-bold">{order.total}</p>
                      </div>
                      <Badge className={`${order.statusColor} text-white`}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Inventaire */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>État des Stocks</CardTitle>
              <CardDescription>
                Gestion et suivi de votre inventaire
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventory.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{item.product}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.status === 'critical' && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        {item.status === 'low' && (
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                        )}
                        {item.status === 'normal' && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          {item.available}/{item.stock} disponibles
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={(item.available / item.stock) * 100} 
                      className={
                        item.status === 'critical' ? 'bg-red-200 [&>div]:bg-red-500' :
                        item.status === 'low' ? 'bg-yellow-200 [&>div]:bg-yellow-500' :
                        'bg-green-200 [&>div]:bg-green-500'
                      }
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Expéditions */}
        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Expéditions</CardTitle>
              <CardDescription>
                Suivi des livraisons et transporteurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Module d'expédition - Contenu à venir
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Analytics */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Commerce</CardTitle>
              <CardDescription>
                Analyses détaillées de vos performances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Module d'analytics - Contenu à venir
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
