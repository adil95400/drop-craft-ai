import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle, CheckCircle, Bell } from 'lucide-react';
import { usePriceStockMonitor } from '@/hooks/usePriceStockMonitor';

export function StockAlerts() {
  const { alerts, alertsLoading, markAsRead, resolveAlert } = usePriceStockMonitor();

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'medium':
        return <Bell className="w-5 h-5 text-yellow-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'Critique';
      case 'high':
        return 'Élevée';
      case 'medium':
        return 'Moyenne';
      default:
        return 'Faible';
    }
  };

  const getSeverityVariant = (severity: string): "default" | "destructive" | "secondary" => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (alertsLoading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Alertes Actives</h2>
          <p className="text-muted-foreground">Notifications de prix et stock</p>
        </div>
      </div>

      <div className="grid gap-4">
        {alerts?.filter((alert: any) => !alert.is_resolved).map((alert: any) => (
          <Card key={alert.id} className={alert.is_read ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getSeverityIcon(alert.severity)}
                    {alert.alert_type === 'price_increase' && 'Augmentation de prix'}
                    {alert.alert_type === 'price_decrease' && 'Baisse de prix'}
                    {alert.alert_type === 'stock_low' && 'Stock faible'}
                    {alert.alert_type === 'stock_out' && 'Rupture de stock'}
                  </CardTitle>
                  <CardDescription className="mt-2">{alert.message}</CardDescription>
                </div>
                <Badge variant={getSeverityVariant(alert.severity)}>
                  {getSeverityLabel(alert.severity)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Date</div>
                    <div className="text-sm font-medium">
                      {new Date(alert.created_at).toLocaleString('fr-FR')}
                    </div>
                  </div>
                  {alert.previous_value && alert.new_value && (
                    <div>
                      <div className="text-sm text-muted-foreground">Changement</div>
                      <div className="text-sm font-medium">
                        {alert.previous_value} → {alert.new_value}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {!alert.is_read && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAsRead(alert.id)}
                    >
                      Marquer comme lu
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => resolveAlert(alert.id)}
                  >
                    Résoudre
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {alerts?.filter((alert: any) => !alert.is_resolved).length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <Package className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Aucune alerte active</p>
              <p className="text-sm text-muted-foreground mt-2">
                Toutes vos alertes ont été résolues
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
