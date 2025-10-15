import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, Package, TrendingUp, DollarSign, 
  Users, Truck, BarChart3, AlertCircle, CheckCircle,
  Clock, RefreshCw, Store, Boxes
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

export default function CommercePage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  const stats = [
    { 
      label: 'Ventes du jour', 
      value: '€2,847', 
      change: '+12.5%',
      icon: DollarSign, 
      color: 'text-green-500' 
    },
    { 
      label: 'Commandes actives', 
      value: '47', 
      change: '+8',
      icon: ShoppingCart, 
      color: 'text-blue-500' 
    },
    { 
      label: 'Produits en stock', 
      value: '1,234', 
      change: '-23',
      icon: Package, 
      color: 'text-purple-500' 
    },
    { 
      label: 'Clients actifs', 
      value: '892', 
      change: '+45',
      icon: Users, 
      color: 'text-orange-500' 
    }
  ];

  const recentOrders = [
    { 
      id: '#ORD-2847', 
      customer: 'Marie Dubois', 
      items: 3, 
      total: '€127.50', 
      status: 'En cours',
      statusColor: 'bg-blue-500'
    },
    { 
      id: '#ORD-2846', 
      customer: 'Jean Martin', 
      items: 1, 
      total: '€89.99', 
      status: 'Expédié',
      statusColor: 'bg-green-500'
    },
    { 
      id: '#ORD-2845', 
      customer: 'Sophie Bernard', 
      items: 5, 
      total: '€245.00', 
      status: 'Livré',
      statusColor: 'bg-gray-500'
    },
    { 
      id: '#ORD-2844', 
      customer: 'Pierre Leroy', 
      items: 2, 
      total: '€156.80', 
      status: 'En attente',
      statusColor: 'bg-yellow-500'
    }
  ];

  const inventory = [
    { 
      product: 'Smartwatch Ultra', 
      stock: 45, 
      reserved: 12, 
      available: 33,
      status: 'normal' 
    },
    { 
      product: 'Wireless Earbuds', 
      stock: 8, 
      reserved: 5, 
      available: 3,
      status: 'low' 
    },
    { 
      product: 'LED Gaming Setup', 
      stock: 23, 
      reserved: 8, 
      available: 15,
      status: 'normal' 
    },
    { 
      product: 'Portable Blender', 
      stock: 2, 
      reserved: 2, 
      available: 0,
      status: 'critical' 
    }
  ];

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
