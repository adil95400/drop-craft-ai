import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useStockAlerts, useDismissAlert, StockAlert } from '@/hooks/useDropshippingIntelligence';
import { 
  Bell, 
  AlertTriangle, 
  AlertCircle,
  Info,
  X,
  Package,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

export function StockAlertsPanel() {
  const { data: alerts, isLoading } = useStockAlerts();
  const dismissAlert = useDismissAlert();

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'high':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case 'medium':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      default:
        return <Info className="h-5 w-5 text-info" />;
    }
  };

  const getAlertBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return <Badge variant="destructive">Critique</Badge>;
      case 'high':
        return <Badge className="bg-warning text-warning-foreground">Urgent</Badge>;
      case 'medium':
        return <Badge className="bg-warning/80 text-warning-foreground">Moyen</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const unreadAlerts = alerts?.filter(a => !a.is_read) || [];
  const criticalCount = alerts?.filter(a => a.alert_level === 'critical').length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Alertes Stock
          {unreadAlerts.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadAlerts.length} nouvelle{unreadAlerts.length > 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {criticalCount > 0 
            ? `${criticalCount} alerte${criticalCount > 1 ? 's' : ''} critique${criticalCount > 1 ? 's' : ''} à traiter`
            : 'Alertes prédictives basées sur l\'analyse des ventes'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {alerts?.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>Aucune alerte active</p>
            <p className="text-sm">Vos stocks sont à des niveaux sûrs</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {alerts?.map(alert => (
              <AlertCard 
                key={alert.id} 
                alert={alert} 
                onDismiss={() => dismissAlert.mutate(alert.id)}
                dismissing={dismissAlert.isPending}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AlertCard({ 
  alert, 
  onDismiss, 
  dismissing 
}: { 
  alert: StockAlert; 
  onDismiss: () => void;
  dismissing: boolean;
}) {
  const getAlertBorderColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'border-l-destructive';
      case 'high':
        return 'border-l-warning';
      case 'medium':
        return 'border-l-warning';
      default:
        return 'border-l-info';
    }
  };

  return (
    <div className={`border rounded-lg p-3 border-l-4 ${getAlertBorderColor(alert.alert_level)} hover:bg-muted/50 transition-colors`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-0.5">
            {alert.alert_level === 'critical' && <AlertTriangle className="h-5 w-5 text-destructive" />}
            {alert.alert_level === 'high' && <AlertCircle className="h-5 w-5 text-warning" />}
            {alert.alert_level === 'medium' && <AlertCircle className="h-5 w-5 text-warning" />}
            {alert.alert_level === 'low' && <Info className="h-5 w-5 text-info" />}
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-sm">{alert.title}</h4>
            <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                {alert.products?.title || 'Produit'}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(alert.created_at), { 
                  addSuffix: true, 
                  locale: getDateFnsLocale() 
                })}
              </span>
            </div>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6"
          onClick={onDismiss}
          disabled={dismissing}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
