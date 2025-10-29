import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Package, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function AutoOrders() {
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['auto-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auto_orders')
        .select('*, catalog_products(*)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    }
  });

  const retryOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.functions.invoke('auto-order-processor', {
        body: { action: 'retry_order', orderId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Commande relancée',
        description: 'La commande sera retraitée'
      });
      queryClient.invalidateQueries({ queryKey: ['auto-orders'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-blue-500" />;
      case 'ordered':
        return <Package className="w-5 h-5 text-primary" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      processing: 'En traitement',
      ordered: 'Commandé',
      shipped: 'Expédié',
      delivered: 'Livré',
      failed: 'Échec',
      cancelled: 'Annulé'
    };
    return labels[status] || status;
  };

  const getStatusVariant = (status: string): "default" | "destructive" | "secondary" => {
    switch (status) {
      case 'delivered':
      case 'shipped':
      case 'ordered':
        return 'default';
      case 'failed':
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Commandes Automatiques</h2>
        <p className="text-muted-foreground">Historique des commandes passées automatiquement</p>
      </div>

      <div className="grid gap-4">
        {orders?.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getStatusIcon(order.order_status)}
                    {order.catalog_products?.name || 'Produit'}
                  </CardTitle>
                  <CardDescription>
                    Commande #{order.id.slice(0, 8)} • {new Date(order.order_date).toLocaleDateString('fr-FR')}
                  </CardDescription>
                </div>
                <Badge variant={getStatusVariant(order.order_status)}>
                  {getStatusLabel(order.order_status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Quantité</div>
                    <div className="text-lg font-semibold">{order.quantity} unités</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Prix unitaire</div>
                    <div className="text-lg font-semibold">€{order.unit_price.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total</div>
                    <div className="text-lg font-semibold">€{order.total_price.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Tracking</div>
                    <div className="text-sm">
                      {order.tracking_number || '—'}
                    </div>
                  </div>
                </div>

                {order.supplier_order_id && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">ID Fournisseur:</span>{' '}
                    <span className="font-mono">{order.supplier_order_id}</span>
                  </div>
                )}

                {order.expected_delivery_date && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Livraison prévue:</span>{' '}
                    {new Date(order.expected_delivery_date).toLocaleDateString('fr-FR')}
                  </div>
                )}

                {order.error_message && (
                  <div className="text-sm text-red-500 bg-red-50 p-3 rounded">
                    <strong>Erreur:</strong> {order.error_message}
                  </div>
                )}

                {order.order_status === 'failed' && order.retry_count < order.max_retries && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => retryOrderMutation.mutate(order.id)}
                    className="gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Réessayer ({order.retry_count}/{order.max_retries})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {orders?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Aucune commande automatique</p>
              <p className="text-sm text-muted-foreground mt-2">
                Les commandes automatiques apparaîtront ici
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
