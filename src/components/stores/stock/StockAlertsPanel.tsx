import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStockIntelligence } from '@/hooks/useStockIntelligence';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

export function StockAlertsPanel() {
  const {
    alerts,
    isLoadingAlerts,
    markAlertAsRead,
    resolveAlert,
    isResolvingAlert,
  } = useStockIntelligence();

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'high':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'medium':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      critical: 'border-red-500 bg-red-50 dark:bg-red-950/20',
      high: 'border-orange-500 bg-orange-50 dark:bg-orange-950/20',
      medium: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
      low: 'border-blue-500 bg-blue-50 dark:bg-blue-950/20',
    };
    return colors[severity as keyof typeof colors] || 'border-muted';
  };

  if (isLoadingAlerts) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </Card>
    );
  }

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Alertes de Stock</h2>
          <p className="text-muted-foreground">
            Notifications importantes pour votre inventaire
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="destructive">{unreadCount} non lu{unreadCount > 1 && 's'}</Badge>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Aucune alerte active</p>
          <p className="text-sm text-muted-foreground">
            Tout va bien avec votre stock !
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 border-l-4 rounded-lg ${getSeverityColor(alert.severity)} ${
                  !alert.is_read ? 'shadow-md' : 'opacity-75'
                }`}
                onClick={() => !alert.is_read && markAlertAsRead(alert.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getSeverityIcon(alert.severity)}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{alert.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {alert.message}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="ml-2 capitalize text-xs"
                      >
                        {alert.alert_type.replace(/_/g, ' ')}
                      </Badge>
                    </div>

                    {alert.current_stock !== null && (
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Stock actuel: <span className="font-medium">{alert.current_stock}</span>
                        </span>
                        {alert.threshold_value !== null && (
                          <span className="text-muted-foreground">
                            Seuil: <span className="font-medium">{alert.threshold_value}</span>
                          </span>
                        )}
                      </div>
                    )}

                    {alert.recommended_action && (
                      <div className="bg-background/50 p-2 rounded text-sm">
                        <p className="font-medium text-foreground">Action recommandée:</p>
                        <p className="text-muted-foreground">{alert.recommended_action}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(alert.created_at), {
                          addSuffix: true,
                          locale: getDateFnsLocale(),
                        })}
                      </span>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveAlert(alert.id)}
                        disabled={isResolvingAlert}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Résoudre
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
}
