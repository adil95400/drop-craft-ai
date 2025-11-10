import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, TrendingUp, Clock, Package, Truck } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from "@/components/ui/badge";
import { BackButton } from '@/components/navigation/BackButton';

export default function OrdersCenterPage() {
  const { data: orders = [] } = useQuery({
    queryKey: ['orders-center'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    }
  });

  const stats = {
    today: orders.filter(o => {
      const today = new Date().toDateString();
      const orderDate = new Date(o.created_at).toDateString();
      return today === orderDate;
    }).length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    revenue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
  };

  return (
    <>
      <Helmet>
        <title>Centre Commandes - Gestion Centralisée | Drop Craft AI</title>
        <meta name="description" content="Centre de gestion centralisée de toutes vos commandes multi-boutiques." />
      </Helmet>

      <div className="space-y-8">
        <div className="mb-4">
          <BackButton to="/dashboard/orders" label="Retour aux commandes" />
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Centre de Commandes</h1>
            <p className="text-muted-foreground">
              Gérez toutes vos commandes depuis un seul endroit
            </p>
          </div>
          <Button>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Nouvelle commande
          </Button>
        </div>

        {/* Stats rapides */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aujourd'hui</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.today}</div>
              <p className="text-xs text-muted-foreground">
                Commandes du jour
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <Package className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">
                À traiter
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En cours</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
              <p className="text-xs text-muted-foreground">
                En préparation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expédiées</CardTitle>
              <Truck className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.shipped}</div>
              <p className="text-xs text-muted-foreground">
                En transit
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CA Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">€{stats.revenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Chiffre d'affaires
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Onglets */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="pending">En attente</TabsTrigger>
            <TabsTrigger value="processing">En cours</TabsTrigger>
            <TabsTrigger value="shipped">Expédiées</TabsTrigger>
            <TabsTrigger value="delivered">Livrées</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Toutes les commandes</CardTitle>
                <CardDescription>
                  Vue d'ensemble de toutes vos commandes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.slice(0, 10).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{order.order_number}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge>{order.status}</Badge>
                          <div className="text-right">
                            <div className="font-semibold">€{order.total_amount?.toFixed(2)}</div>
                          </div>
                          <Button variant="outline" size="sm">Voir</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucune commande</h3>
                    <p className="text-muted-foreground">
                      Vos commandes apparaîtront ici
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {['pending', 'processing', 'shipped', 'delivered'].map((status) => (
            <TabsContent key={status} value={status} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="capitalize">Commandes {status}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Filtrage par statut en cours de développement...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </>
  );
}
