import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAutoFulfillment } from '@/hooks/useAutoFulfillment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, ExternalLink, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

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
    return <Badge variant={config.variant} className="text-[10px] md:text-xs">{config.label}</Badge>;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base md:text-lg">Commandes Auto-Fulfillment</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Suivez vos commandes automatiques
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetchOrders()}
              className="w-full xs:w-auto"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-3 md:space-y-4">
        {orders && orders.length > 0 ? (
          orders.map((order: any) => (
            <Card key={order.id}>
              <CardHeader className="p-4 md:p-6">
                <div className="flex flex-col xs:flex-row xs:items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base md:text-lg">#{order.order_number}</CardTitle>
                      {getStatusBadge(order.status)}
                    </div>
                    <CardDescription className="text-xs md:text-sm">
                      Créé {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: getDateFnsLocale() })}
                    </CardDescription>
                  </div>
                  <div className="text-left xs:text-right">
                    <p className="text-lg md:text-2xl font-bold">{order.total_amount} {order.currency}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {(order.items as any[])?.length || 0} article(s)
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0 space-y-3 md:space-y-4">
                {order.tracking_number && (
                  <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-xs md:text-sm font-medium">Numéro de suivi</p>
                      <p className="text-sm md:text-lg font-mono break-all">{order.tracking_number}</p>
                    </div>
                    {order.tracking_url && (
                      <Button variant="outline" size="sm" asChild className="w-full xs:w-auto">
                        <a href={order.tracking_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Suivre
                        </a>
                      </Button>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-xs md:text-sm">
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
                    <p className="text-xs md:text-sm font-medium text-destructive">Erreur:</p>
                    <p className="text-xs md:text-sm text-destructive/80">{order.error_message}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 md:py-12 px-4">
              <Package className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mb-4" />
              <p className="text-base md:text-lg font-medium text-center">Aucune commande en fulfillment</p>
              <p className="text-xs md:text-sm text-muted-foreground text-center mt-2">
                Les commandes automatiques apparaîtront ici
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
