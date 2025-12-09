import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useStockAlerts, useResolveAlert } from '@/hooks/useStockManagement';

interface StockAlertsPanelProps {
  limit?: number;
  compact?: boolean;
}

export function StockAlertsPanel({ limit, compact }: StockAlertsPanelProps) {
  const { data: alerts = [], isLoading } = useStockAlerts();
  const resolveAlertMutation = useResolveAlert();
  
  const displayedAlerts = limit ? alerts.slice(0, limit) : alerts;
  
  const handleResolve = (alertId: string) => {
    resolveAlertMutation.mutate(alertId);
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-destructive bg-destructive/10';
      case 'high': return 'border-orange-500 bg-orange-500/10';
      case 'medium': return 'border-yellow-500 bg-yellow-500/10';
      default: return 'border-blue-500 bg-blue-500/10';
    }
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'low_stock': 'Stock Faible',
      'out_of_stock': 'Rupture',
      'sync_failed': 'Échec Sync'
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (compact) {
    if (displayedAlerts.length === 0) {
      return (
        <div className="text-center py-6">
          <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucune alerte active</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        {displayedAlerts.map((alert) => (
          <div key={alert.id} className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <Badge variant="outline" className="text-xs">
                  {getAlertTypeLabel(alert.alert_type)}
                </Badge>
              </div>
              <Button size="sm" variant="ghost" onClick={() => handleResolve(alert.id)}>
                <CheckCircle className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm font-medium mt-1">{alert.product_name}</p>
            <p className="text-xs text-muted-foreground">{alert.message}</p>
          </div>
        ))}
      </div>
    );
  }

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const otherAlerts = alerts.filter(a => a.severity !== 'critical');

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Critiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">{criticalAlerts.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Alertes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{alerts.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Ruptures Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {alerts.filter(a => a.alert_type === 'out_of_stock').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Stock Faible</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {alerts.filter(a => a.alert_type === 'low_stock').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes Critiques */}
      {criticalAlerts.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertes Critiques
            </CardTitle>
            <CardDescription>Nécessitent une action immédiate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalAlerts.map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg border-2 ${getSeverityColor(alert.severity)}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="destructive">{getAlertTypeLabel(alert.alert_type)}</Badge>
                        <Badge variant="outline">Critique</Badge>
                      </div>
                      <p className="font-bold mb-1">{alert.product_name}</p>
                      <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <span>Stock: <strong>{alert.current_stock || 0}</strong></span>
                        <span>•</span>
                        <span>Seuil: <strong>{alert.threshold || 0}</strong></span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: fr })}</span>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleResolve(alert.id)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Résoudre
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Autres Alertes */}
      <Card>
        <CardHeader>
          <CardTitle>Toutes les Alertes</CardTitle>
          <CardDescription>{alerts.length} alerte(s) active(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {otherAlerts.map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{getAlertTypeLabel(alert.alert_type)}</Badge>
                        <Badge variant={alert.severity === 'high' ? 'default' : 'secondary'}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="font-medium mb-1">{alert.product_name}</p>
                      <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Stock: {alert.current_stock || 0}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: fr })}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleResolve(alert.id)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Résoudre
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Aucune alerte active</p>
              <p className="text-sm text-muted-foreground">
                Tous les niveaux de stock sont normaux
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
