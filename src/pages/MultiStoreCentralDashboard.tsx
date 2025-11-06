import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Store, Package, ShoppingCart, DollarSign, 
  TrendingUp, AlertCircle, Settings, Plus 
} from 'lucide-react';

export default function MultiStoreCentralDashboard() {
  const stores = [
    {
      id: 1,
      name: 'Main Store - Shopify',
      platform: 'Shopify',
      status: 'active',
      products: 1247,
      orders: 342,
      revenue: 28560,
      growth: '+18%',
      alerts: 2
    },
    {
      id: 2,
      name: 'Amazon Store',
      platform: 'Amazon',
      status: 'active',
      products: 856,
      orders: 567,
      revenue: 45230,
      growth: '+24%',
      alerts: 0
    },
    {
      id: 3,
      name: 'eBay Store',
      platform: 'eBay',
      status: 'active',
      products: 623,
      orders: 189,
      revenue: 15420,
      growth: '+12%',
      alerts: 5
    },
    {
      id: 4,
      name: 'WooCommerce Store',
      platform: 'WooCommerce',
      status: 'syncing',
      products: 1089,
      orders: 234,
      revenue: 19870,
      growth: '+9%',
      alerts: 1
    }
  ];

  const consolidatedStats = [
    {
      label: 'Revenu Total',
      value: '€109,080',
      change: '+18.5%',
      icon: DollarSign,
      color: 'text-green-500'
    },
    {
      label: 'Commandes (24h)',
      value: '1,332',
      change: '+24%',
      icon: ShoppingCart,
      color: 'text-blue-500'
    },
    {
      label: 'Produits Uniques',
      value: '2,147',
      change: '+156',
      icon: Package,
      color: 'text-purple-500'
    },
    {
      label: 'Stores Actifs',
      value: '4/5',
      change: '80%',
      icon: Store,
      color: 'text-orange-500'
    }
  ];

  const recentActivity = [
    { store: 'Main Store', action: 'Nouvelle commande #12847', time: '2 min ago', type: 'order' },
    { store: 'Amazon Store', action: '15 produits synchronisés', time: '5 min ago', type: 'sync' },
    { store: 'eBay Store', action: 'Alerte stock bas (5 produits)', time: '12 min ago', type: 'alert' },
    { store: 'WooCommerce', action: 'Prix mis à jour (23 produits)', time: '18 min ago', type: 'update' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'syncing': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingCart className="h-4 w-4 text-blue-500" />;
      case 'sync': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'alert': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'update': return <Settings className="h-4 w-4 text-purple-500" />;
      default: return null;
    }
  };

  return (
    <>
      <Helmet>
        <title>Multi-Store Central Dashboard - DropCraft AI</title>
        <meta name="description" content="Gérez toutes vos boutiques depuis un tableau de bord centralisé" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Multi-Store Central Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Vue consolidée de toutes vos boutiques en ligne
            </p>
          </div>
          
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Connecter Store
          </Button>
        </div>

        {/* Consolidated Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {consolidatedStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-green-500">{stat.change}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="stores">Boutiques</TabsTrigger>
            <TabsTrigger value="activity">Activité</TabsTrigger>
            <TabsTrigger value="bulk">Actions Groupées</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {stores.map((store) => (
                <Card key={store.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Store className="h-6 w-6" />
                          </div>
                          <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${getStatusColor(store.status)} border-2 border-background`} />
                        </div>
                        <div>
                          <h4 className="font-semibold">{store.name}</h4>
                          <Badge variant="outline">{store.platform}</Badge>
                        </div>
                      </div>
                      {store.alerts > 0 && (
                        <Badge variant="destructive">
                          {store.alerts} alertes
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Produits</div>
                        <div className="text-lg font-bold">{store.products}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Commandes</div>
                        <div className="text-lg font-bold">{store.orders}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Revenu</div>
                        <div className="text-lg font-bold">€{store.revenue.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-green-600 font-medium">{store.growth}</span>
                        <span className="text-muted-foreground">vs mois dernier</span>
                      </div>
                      <Button size="sm" variant="outline">
                        Gérer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="stores" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Toutes les Boutiques</CardTitle>
                <CardDescription>
                  Gestion détaillée de chaque boutique connectée
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stores.map((store) => (
                    <div key={store.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Store className="h-5 w-5" />
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${getStatusColor(store.status)} border-2 border-background`} />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold mb-1">{store.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {store.products} produits • {store.orders} commandes
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button size="sm">Ouvrir</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Activité Récente</CardTitle>
                <CardDescription>
                  Événements en temps réel de toutes vos boutiques
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1">
                        <div className="font-medium text-sm">{activity.action}</div>
                        <div className="text-xs text-muted-foreground">
                          {activity.store} • {activity.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Actions Groupées</CardTitle>
                <CardDescription>
                  Effectuez des actions sur plusieurs boutiques simultanément
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                    <Package className="h-6 w-6" />
                    <div className="text-sm font-semibold">Sync Produits</div>
                    <div className="text-xs text-muted-foreground">
                      Toutes les boutiques
                    </div>
                  </Button>

                  <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                    <DollarSign className="h-6 w-6" />
                    <div className="text-sm font-semibold">Mise à Jour Prix</div>
                    <div className="text-xs text-muted-foreground">
                      Appliquer règles
                    </div>
                  </Button>

                  <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                    <TrendingUp className="h-6 w-6" />
                    <div className="text-sm font-semibold">Export Données</div>
                    <div className="text-xs text-muted-foreground">
                      Rapport consolidé
                    </div>
                  </Button>

                  <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                    <Settings className="h-6 w-6" />
                    <div className="text-sm font-semibold">Config Globale</div>
                    <div className="text-xs text-muted-foreground">
                      Paramètres communs
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
