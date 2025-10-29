import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useInventoryPredictor } from '@/hooks/useInventoryPredictor';
import { AlertTriangle, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export function StockAlerts() {
  const { alerts, isLoadingAlerts, resolveAlert } = useInventoryPredictor();

  if (isLoadingAlerts) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-500', variant: 'destructive' as const };
      case 'high':
        return { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-500', variant: 'destructive' as const };
      case 'medium':
        return { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-500', variant: 'secondary' as const };
      default:
        return { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-500', variant: 'default' as const };
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'low_stock':
        return 'Stock Bas';
      case 'out_of_stock':
        return 'Rupture de Stock';
      case 'overstock':
        return 'Surstock';
      case 'reorder_now':
        return 'Commander Maintenant';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-orange-500" />
          Alertes Stock
        </h2>
        <p className="text-muted-foreground mt-1">
          Notifications automatiques pour les produits nécessitant votre attention
        </p>
      </div>

      {(!alerts || alerts.length === 0) ? (
        <Card className="p-12 text-center">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <p className="text-muted-foreground">
            Aucune alerte active. Tous vos stocks sont à des niveaux normaux !
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {alerts.map((alert: any) => {
            const config = getSeverityConfig(alert.severity);
            const Icon = config.icon;

            return (
              <Card key={alert.id} className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${config.bg}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">
                            {alert.inventory_items?.product_name || 'Produit'}
                          </h3>
                          <Badge variant={config.variant} className="capitalize">
                            {alert.severity}
                          </Badge>
                          <Badge variant="outline">
                            {getAlertTypeLabel(alert.alert_type)}
                          </Badge>
                        </div>
                        <p className={`text-sm font-medium ${config.color}`}>
                          {alert.message}
                        </p>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Résoudre
                      </Button>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                      <span>
                        Créée le {new Date(alert.created_at).toLocaleDateString('fr-FR')} à{' '}
                        {new Date(alert.created_at).toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      {alert.inventory_items?.sku && (
                        <span>• SKU: {alert.inventory_items.sku}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}