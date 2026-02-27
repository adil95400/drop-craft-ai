import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, ShoppingCart, UserPlus, Package, CreditCard, AlertTriangle, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useProductionData } from '@/hooks/useProductionData';
import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

interface RecentActivityWidgetProps {
  timeRange: string;
  settings?: {
    maxItems?: number;
    showTimestamp?: boolean;
  };
}

const typeLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  order: { label: 'Commande', variant: 'default' },
  customer: { label: 'Client', variant: 'secondary' },
  shipping: { label: 'Livraison', variant: 'outline' },
};

export function RecentActivityWidget({ settings }: RecentActivityWidgetProps) {
  const maxItems = settings?.maxItems ?? 8;
  const showTimestamp = settings?.showTimestamp ?? true;
  const { orders, customers, shipmentsData, isLoadingOrders, isLoadingCustomers, isLoadingShipments } = useProductionData();

  const activities = useMemo(() => {
    const allActivities: Array<{
      id: string;
      type: string;
      message: string;
      time: string;
      timestamp: Date;
      icon: typeof ShoppingCart;
      color: string;
    }> = [];

    // Add orders
    (orders || []).slice(0, 10).forEach(order => {
      allActivities.push({
        id: `order-${order.id}`,
        type: 'order',
        message: `Commande ${order.order_number} - ${Number(order.total_amount || 0).toLocaleString('fr-FR')}€`,
        time: formatDistanceToNow(new Date(order.created_at || ''), { addSuffix: true, locale: getDateFnsLocale() }),
        timestamp: new Date(order.created_at || ''),
        icon: ShoppingCart,
        color: 'text-info'
      });
    });

    // Add customers
    (customers || []).slice(0, 5).forEach(customer => {
      allActivities.push({
        id: `customer-${customer.id}`,
        type: 'customer',
        message: `Nouveau client: ${customer.first_name || ''} ${customer.last_name || customer.email}`,
        time: formatDistanceToNow(new Date(customer.created_at || ''), { addSuffix: true, locale: getDateFnsLocale() }),
        timestamp: new Date(customer.created_at || ''),
        icon: UserPlus,
        color: 'text-success'
      });
    });

    // Add shipments
    (shipmentsData || []).slice(0, 5).forEach(shipment => {
      allActivities.push({
        id: `shipment-${shipment.id}`,
        type: 'shipping',
        message: `Expédition ${shipment.tracking_number || shipment.id.slice(0, 8)} - ${shipment.status}`,
        time: formatDistanceToNow(new Date(shipment.created_at || ''), { addSuffix: true, locale: getDateFnsLocale() }),
        timestamp: new Date(shipment.created_at || ''),
        icon: Package,
        color: 'text-warning'
      });
    });

    // Sort by timestamp desc
    return allActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, maxItems);
  }, [orders, customers, shipmentsData, maxItems]);

  const isLoading = isLoadingOrders || isLoadingCustomers || isLoadingShipments;

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-primary" />
          Activité récente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] pr-4">
          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune activité récente
              </p>
            ) : (
              activities.map((activity) => {
                const Icon = activity.icon;
                const typeInfo = typeLabels[activity.type] || { label: activity.type, variant: 'outline' as const };
                
                return (
                  <div 
                    key={activity.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-2 rounded-full bg-muted ${activity.color}`}>
                      <Icon className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{activity.message}</p>
                        <Badge variant={typeInfo.variant} className="text-[10px] px-1.5 py-0 shrink-0">
                          {typeInfo.label}
                        </Badge>
                      </div>
                      {showTimestamp && (
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
