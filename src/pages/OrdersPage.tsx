import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Truck, Search, Filter, ExternalLink, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  order_number: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  currency: string;
  customer_id?: string;
  tracking_number?: string;
  carrier?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}

export default function OrdersPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Fetch orders
  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['orders', statusFilter, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        query = query.or(`order_number.ilike.%${searchTerm}%,tracking_number.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Order[];
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Package;
      case 'processing': return Package;
      case 'shipped': return Truck;
      case 'delivered': return Package;
      default: return Package;
    }
  };

  const handleTrackPackage = async (trackingNumber: string, carrier: string = 'auto') => {
    try {
      const { data, error } = await supabase.functions.invoke('track-package', {
        body: { tracking_number: trackingNumber, carrier }
      });

      if (error) throw error;

      toast({
        title: "Suivi de colis",
        description: `Status: ${data.status || 'Inconnu'}`
      });
    } catch (error: any) {
      toast({
        title: "Erreur de suivi",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Commande mise à jour",
        description: "Le statut de la commande a été mis à jour"
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Erreur de mise à jour",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const OrdersList = ({ orders }: { orders: Order[] }) => (
    <div className="space-y-4">
      {orders.map((order) => {
        const StatusIcon = getStatusIcon(order.status);
        return (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <StatusIcon className="w-8 h-8 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold">{order.order_number}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold">
                      {order.total_amount.toFixed(2)} {order.currency}
                    </p>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    {order.tracking_number && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTrackPackage(order.tracking_number!, order.carrier)}
                      >
                        <Truck className="w-4 h-4 mr-1" />
                        Suivre
                      </Button>
                    )}
                    
                    <Select
                      value={order.status}
                      onValueChange={(value) => updateOrderStatus(order.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="processing">En cours</SelectItem>
                        <SelectItem value="shipped">Expédié</SelectItem>
                        <SelectItem value="delivered">Livré</SelectItem>
                        <SelectItem value="cancelled">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {order.tracking_number && (
                <div className="mt-4 p-3 bg-muted/50 rounded-md">
                  <p className="text-sm">
                    <strong>Numéro de suivi:</strong> {order.tracking_number}
                  </p>
                  {order.carrier && order.carrier !== 'auto' && (
                    <p className="text-sm">
                      <strong>Transporteur:</strong> {order.carrier}
                    </p>
                  )}
                </div>
              )}

              {order.notes && (
                <div className="mt-4 p-3 bg-muted/50 rounded-md">
                  <p className="text-sm">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {orders.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune commande trouvée</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all'
                ? 'Essayez de modifier les filtres de recherche'
                : 'Vous n\'avez pas encore de commandes'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const OrdersStats = () => {
    const stats = [
      {
        label: 'Total',
        value: orders.length,
        color: 'text-blue-600'
      },
      {
        label: 'En attente',
        value: orders.filter(o => o.status === 'pending').length,
        color: 'text-yellow-600'
      },
      {
        label: 'Expédiées',
        value: orders.filter(o => o.status === 'shipped').length,
        color: 'text-purple-600'
      },
      {
        label: 'Livrées',
        value: orders.filter(o => o.status === 'delivered').length,
        color: 'text-green-600'
      }
    ];

    return (
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestion des commandes</h1>
        <p className="text-muted-foreground">
          Suivez et gérez toutes vos commandes en temps réel
        </p>
      </div>

      <OrdersStats />

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher par numéro de commande ou de suivi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="processing">En cours</SelectItem>
                <SelectItem value="shipped">Expédié</SelectItem>
                <SelectItem value="delivered">Livré</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Toutes les commandes</TabsTrigger>
          <TabsTrigger value="tracking">Suivi en temps réel</TabsTrigger>
          <TabsTrigger value="analytics">Analytiques</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <OrdersList orders={orders} />
          )}
        </TabsContent>

        <TabsContent value="tracking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Suivi en temps réel</CardTitle>
              <CardDescription>
                Suivez vos colis en temps réel avec 17Track
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Fonctionnalité de suivi en temps réel en cours de développement...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytiques des commandes</CardTitle>
              <CardDescription>
                Analysez les performances de vos commandes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Tableaux de bord analytiques en cours de développement...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}