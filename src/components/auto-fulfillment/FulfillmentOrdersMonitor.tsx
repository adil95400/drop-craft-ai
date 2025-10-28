import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAutoFulfillment } from '@/hooks/useAutoFulfillment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, ExternalLink, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export function FulfillmentOrdersMonitor() {
  const { orders, isLoadingOrders, refetchOrders } = useAutoFulfillment();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', label: 'En attente' },
      processing: { variant: 'default', label: 'Traitement' },
      sent: { variant: 'default', label: 'Envoyée' },
      confirmed: { variant: 'default', label: 'Confirmée' },
      shipped: { variant: 'default', label: 'Expédiée' },
      delivered: { variant: 'default', label: 'Livrée' },
      failed: { variant: 'destructive', label: 'Échouée' },
      cancelled: { variant: 'outline', label: 'Annulée' }
    };

    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Commandes Auto-Fulfillment</CardTitle>
              <CardDescription>
                Suivez toutes vos commandes automatiques en temps réel
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchOrders()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {orders && orders.length > 0 ? (
          orders.map((order: any) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">#{order.order_number}</CardTitle>
                      {getStatusBadge(order.status)}
                    </div>
                    <CardDescription>
                      Créé {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: fr })}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{order.total_amount} {order.currency}</p>
                    <p className="text-sm text-muted-foreground">
                      {(order.items as any[])?.length || 0} article(s)
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.tracking_number && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Numéro de suivi</p>
                      <p className="text-lg font-mono">{order.tracking_number}</p>
                    </div>
                    {order.tracking_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={order.tracking_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Suivre
                        </a>
                      </Button>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {order.sent_at && (
                    <div>
                      <p className="text-muted-foreground">Envoyée</p>
                      <p className="font-medium">
                        {new Date(order.sent_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  )}
                  {order.confirmed_at && (
                    <div>
                      <p className="text-muted-foreground">Confirmée</p>
                      <p className="font-medium">
                        {new Date(order.confirmed_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  )}
                  {order.shipped_at && (
                    <div>
                      <p className="text-muted-foreground">Expédiée</p>
                      <p className="font-medium">
                        {new Date(order.shipped_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  )}
                  {order.delivered_at && (
                    <div>
                      <p className="text-muted-foreground">Livrée</p>
                      <p className="font-medium">
                        {new Date(order.delivered_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  )}
                </div>

                {order.error_message && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm font-medium text-destructive">Erreur:</p>
                    <p className="text-sm text-destructive/80">{order.error_message}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Aucune commande en fulfillment</p>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Les commandes automatiques apparaîtront ici une fois configurées
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
