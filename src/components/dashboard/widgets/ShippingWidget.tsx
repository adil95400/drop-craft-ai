import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Package, Clock, CheckCircle, AlertCircle, MapPin, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useProductionData } from '@/hooks/useProductionData';
import { useMemo } from 'react';

interface ShippingWidgetProps {
  timeRange: string;
  settings?: {
    showDetails?: boolean;
    showRecent?: boolean;
  };
}

const statusConfig: Record<string, { color: string; label: string; icon: typeof Package }> = {
  pending: { color: 'text-orange-500', label: 'En attente', icon: Clock },
  processing: { color: 'text-blue-500', label: 'En cours', icon: Package },
  shipped: { color: 'text-blue-500', label: 'Expédié', icon: Truck },
  in_transit: { color: 'text-blue-500', label: 'En transit', icon: Truck },
  delivered: { color: 'text-green-500', label: 'Livré', icon: CheckCircle },
  returned: { color: 'text-red-500', label: 'Retourné', icon: AlertCircle },
  failed: { color: 'text-red-500', label: 'Échoué', icon: AlertCircle },
};

export function ShippingWidget({ settings }: ShippingWidgetProps) {
  const showDetails = settings?.showDetails ?? true;
  const showRecent = settings?.showRecent ?? true;
  const { shipmentsData, isLoadingShipments } = useProductionData();

  const shippingStats = useMemo(() => {
    const stats = {
      pending: 0,
      shipped: 0,
      delivered: 0,
      returned: 0,
    };

    (shipmentsData || []).forEach(shipment => {
      const status = shipment.status?.toLowerCase() || 'pending';
      if (status === 'pending' || status === 'processing') {
        stats.pending++;
      } else if (status === 'shipped' || status === 'in_transit') {
        stats.shipped++;
      } else if (status === 'delivered') {
        stats.delivered++;
      } else if (status === 'returned' || status === 'failed') {
        stats.returned++;
      }
    });

    return stats;
  }, [shipmentsData]);

  const recentShipments = useMemo(() => {
    return (shipmentsData || []).slice(0, 3).map(shipment => ({
      id: shipment.tracking_number || `#${shipment.id.slice(0, 6)}`,
      status: shipment.status?.toLowerCase() || 'pending',
      carrier: shipment.carrier_code || 'N/A',
      eta: shipment.estimated_delivery 
        ? new Date(shipment.estimated_delivery).toLocaleDateString('fr-FR')
        : 'Non défini'
    }));
  }, [shipmentsData]);

  const total = shippingStats.pending + shippingStats.shipped + shippingStats.delivered + shippingStats.returned;
  const deliveryRate = total > 0 ? ((shippingStats.delivered / total) * 100).toFixed(1) : '0';

  if (isLoadingShipments) {
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
          <Truck className="h-4 w-4 text-blue-500" />
          Expéditions & Livraisons
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showDetails && (
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2 bg-orange-500/10 rounded-lg">
              <Clock className="h-4 w-4 mx-auto text-orange-500 mb-1" />
              <p className="text-lg font-bold">{shippingStats.pending}</p>
              <p className="text-[10px] text-muted-foreground">En attente</p>
            </div>
            <div className="text-center p-2 bg-blue-500/10 rounded-lg">
              <Truck className="h-4 w-4 mx-auto text-blue-500 mb-1" />
              <p className="text-lg font-bold">{shippingStats.shipped}</p>
              <p className="text-[10px] text-muted-foreground">Expédiées</p>
            </div>
            <div className="text-center p-2 bg-green-500/10 rounded-lg">
              <CheckCircle className="h-4 w-4 mx-auto text-green-500 mb-1" />
              <p className="text-lg font-bold">{shippingStats.delivered}</p>
              <p className="text-[10px] text-muted-foreground">Livrées</p>
            </div>
            <div className="text-center p-2 bg-red-500/10 rounded-lg">
              <AlertCircle className="h-4 w-4 mx-auto text-red-500 mb-1" />
              <p className="text-lg font-bold">{shippingStats.returned}</p>
              <p className="text-[10px] text-muted-foreground">Retours</p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Taux de livraison</span>
            <span className="font-medium text-green-500">{deliveryRate}%</span>
          </div>
          <Progress value={parseFloat(deliveryRate)} className="h-2" />
        </div>

        {showRecent && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Expéditions récentes</p>
            {recentShipments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune expédition
              </p>
            ) : (
              recentShipments.map((shipment) => {
                const config = statusConfig[shipment.status] || statusConfig.pending;
                const StatusIcon = config.icon;
                
                return (
                  <div key={shipment.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-4 w-4 ${config.color}`} />
                      <div>
                        <p className="text-sm font-medium">{shipment.id}</p>
                        <p className="text-xs text-muted-foreground">{config.label}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-[10px]">{shipment.carrier}</Badge>
                      <p className={`text-xs ${config.color}`}>{shipment.eta}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
