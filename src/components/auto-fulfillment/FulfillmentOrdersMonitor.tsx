import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAutoFulfillment } from '@/hooks/useAutoFulfillment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, RefreshCw, RotateCcw, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

export function FulfillmentOrdersMonitor() {
  const {
    orders,
    isLoadingOrders,
    refetchOrders,
    processOrder,
    isProcessingOrder,
    retryFailed,
    isRetrying,
  } = useAutoFulfillment();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'secondary', label: 'En attente' },
      processing: { variant: 'default', label: 'Traitement' },
      completed: { variant: 'default', label: 'Confirmée' },
      failed: { variant: 'destructive', label: 'Échouée' },
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
              <CardTitle className="text-base md:text-lg">Queue Auto-Fulfillment</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Commandes fournisseurs en file d'attente
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
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col xs:flex-row xs:items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm md:text-base">
                        {order.shopify_order_id || order.order_id?.slice(0, 8)}
                      </span>
                      {getStatusBadge(order.status)}
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {order.supplier_name}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {order.items_count} article(s) · Coût: {order.supplier_cost?.toFixed(2) || '0.00'}€
                      {' · '}
                      {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: getDateFnsLocale() })}
                    </p>

                    {order.tracking_number && (
                      <p className="text-xs font-mono bg-muted px-2 py-1 rounded inline-block mt-1">
                        📦 {order.tracking_number}
                      </p>
                    )}

                    {order.error_message && (
                      <p className="text-xs text-destructive mt-1">⚠ {order.error_message}</p>
                    )}

                    {order.retry_count > 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        Tentatives: {order.retry_count}/{order.max_retries || 3}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {order.status === 'failed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => retryFailed([order.id])}
                        disabled={isRetrying}
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        Relancer
                      </Button>
                    )}
                    {order.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => processOrder(order.order_id)}
                        disabled={isProcessingOrder}
                      >
                        <Play className="w-3.5 h-3.5 mr-1" />
                        Traiter
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 md:py-12 px-4">
              <Package className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mb-4" />
              <p className="text-base md:text-lg font-medium text-center">Aucune commande en file</p>
              <p className="text-xs md:text-sm text-muted-foreground text-center mt-2">
                Les commandes automatiques apparaîtront ici quand vous activerez le fulfillment
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
