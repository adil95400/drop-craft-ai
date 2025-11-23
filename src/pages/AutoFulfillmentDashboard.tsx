import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Package, Truck, CheckCircle, XCircle, Clock, 
  Zap, Settings, AlertCircle, TrendingUp 
} from 'lucide-react';

export default function AutoFulfillmentDashboard() {
  const [autoFulfillmentEnabled, setAutoFulfillmentEnabled] = useState(true);

  const stats = [
    { label: 'Commandes Auto (24h)', value: '127', change: '+23%', icon: Zap, color: 'text-blue-500' },
    { label: 'Taux de Succès', value: '98.5%', change: '+1.2%', icon: CheckCircle, color: 'text-green-500' },
    { label: 'Temps Moyen', value: '4.2 min', change: '-15%', icon: Clock, color: 'text-orange-500' },
    { label: 'Économies', value: '€2,340', change: '+18%', icon: TrendingUp, color: 'text-purple-500' }
  ];

  const recentOrders = [
    {
      id: 'ORD-12847',
      product: 'Wireless Earbuds Pro',
      supplier: 'AliExpress',
      status: 'completed',
      time: '2 min ago',
      cost: '€12.50'
    },
    {
      id: 'ORD-12846',
      product: 'Smart Watch Band',
      supplier: 'Alibaba',
      status: 'processing',
      time: '5 min ago',
      cost: '€8.20'
    },
    {
      id: 'ORD-12845',
      product: 'Phone Case Premium',
      supplier: 'CJ Dropshipping',
      status: 'completed',
      time: '12 min ago',
      cost: '€5.80'
    },
    {
      id: 'ORD-12844',
      product: 'LED Strip Lights',
      supplier: 'AliExpress',
      status: 'failed',
      time: '18 min ago',
      cost: '€15.30',
      error: 'Insufficient supplier stock'
    }
  ];

  const automationRules = [
    {
      name: 'Commande Immédiate',
      description: 'Auto-commande pour produits en stock',
      enabled: true,
      orders: 89,
      successRate: 99
    },
    {
      name: 'Backup Supplier',
      description: 'Bascule auto sur fournisseur alternatif si rupture',
      enabled: true,
      orders: 23,
      successRate: 95
    },
    {
      name: 'Order Batching',
      description: 'Regroupe les commandes toutes les 2h',
      enabled: false,
      orders: 0,
      successRate: 0
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      completed: 'default',
      processing: 'secondary',
      failed: 'destructive'
    };
    return variants[status] || 'secondary';
  };

  return (
    <>
      <Helmet>
        <title>Auto-Fulfillment Dashboard - ShopOpti</title>
        <meta name="description" content="Système d'exécution automatique des commandes avec multi-fournisseurs et routing intelligent" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Auto-Fulfillment System</h1>
            <p className="text-muted-foreground mt-2">
              Commande automatique aux fournisseurs et gestion intelligente
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-fulfillment">Auto-Fulfillment</Label>
              <Switch 
                id="auto-fulfillment"
                checked={autoFulfillmentEnabled}
                onCheckedChange={setAutoFulfillmentEnabled}
              />
            </div>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Configuration
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
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

        <Tabs defaultValue="recent" className="space-y-6">
          <TabsList>
            <TabsTrigger value="recent">Commandes Récentes</TabsTrigger>
            <TabsTrigger value="rules">Règles d'Automatisation</TabsTrigger>
            <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Commandes Auto-Fulfillment</CardTitle>
                <CardDescription>
                  Suivi en temps réel des commandes automatiques
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-2 rounded-lg bg-primary/10">
                          {getStatusIcon(order.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{order.id}</span>
                            <Badge variant={getStatusBadge(order.status)}>
                              {order.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{order.product}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Truck className="h-3 w-3" />
                              {order.supplier}
                            </span>
                            <span>{order.time}</span>
                          </div>
                          {order.error && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                              <AlertCircle className="h-3 w-3" />
                              {order.error}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{order.cost}</div>
                        <Button size="sm" variant="outline" className="mt-2">
                          Détails
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">Règles d'Automatisation</h3>
                <p className="text-sm text-muted-foreground">
                  Configurez le comportement de l'auto-fulfillment
                </p>
              </div>
              <Button>
                <Zap className="h-4 w-4 mr-2" />
                Nouvelle Règle
              </Button>
            </div>

            <div className="space-y-4">
              {automationRules.map((rule, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold">{rule.name}</h4>
                          <Switch checked={rule.enabled} />
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {rule.description}
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Commandes: </span>
                            <span className="font-semibold">{rule.orders}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Taux de succès: </span>
                            <span className="font-semibold text-green-600">{rule.successRate}%</span>
                          </div>
                        </div>
                        {rule.enabled && rule.successRate > 0 && (
                          <Progress value={rule.successRate} className="mt-3 h-2" />
                        )}
                      </div>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fournisseurs Configurés</CardTitle>
                <CardDescription>
                  Gestion des fournisseurs pour l'auto-fulfillment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configuration des fournisseurs disponible dans Suppliers → Manage</p>
                  <Button variant="outline" className="mt-4">
                    Gérer les Fournisseurs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Auto-Fulfillment</CardTitle>
                <CardDescription>
                  Performance et statistiques détaillées
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Analytics et reporting détaillés disponibles prochainement</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
