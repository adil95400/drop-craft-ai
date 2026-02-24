import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAutomaticAlerts } from '@/hooks/useAutomaticAlerts';
import {
  Bell, AlertTriangle, AlertCircle, CheckCircle, Clock, Eye, Trash2, RefreshCw
} from 'lucide-react';

export function AutomaticAlertsPanel() {
  const { activeAlerts, isLoading, acknowledgeAlert, resolveAlert, evaluateThresholds } = useAutomaticAlerts();

  const active = activeAlerts.filter(a => a.status === 'active');
  const acknowledged = activeAlerts.filter(a => a.status === 'acknowledged');
  const resolved = activeAlerts.filter(a => a.status === 'resolved');

  const getSeverityBadge = (severity: string | null) => {
    switch (severity) {
      case 'critical': return <Badge variant="destructive">Critique</Badge>;
      case 'high': return <Badge variant="destructive" className="bg-orange-600">Haute</Badge>;
      case 'warning': return <Badge variant="secondary">Attention</Badge>;
      default: return <Badge variant="outline">Info</Badge>;
    }
  };

  const getSeverityIcon = (severity: string | null) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-xl font-bold text-destructive">{active.length}</p>
              <p className="text-[10px] text-muted-foreground">Actives</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-xl font-bold">{acknowledged.length}</p>
              <p className="text-[10px] text-muted-foreground">Acquittées</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-xl font-bold text-green-600">{resolved.length}</p>
              <p className="text-[10px] text-muted-foreground">Résolues</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Alerts list */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alertes automatiques
              </CardTitle>
              <CardDescription>Système de surveillance proactive</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={evaluateThresholds}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Réévaluer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {activeAlerts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-500" />
                <p className="font-medium">Aucune alerte</p>
                <p className="text-sm">Tous les systèmes fonctionnent normalement</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      alert.status === 'active'
                        ? 'bg-destructive/5 border-destructive/20'
                        : alert.status === 'acknowledged'
                        ? 'bg-yellow-500/5 border-yellow-500/20'
                        : 'bg-muted/50 border-border opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">{alert.title}</span>
                          {getSeverityBadge(alert.severity)}
                          <Badge variant="outline" className="text-[10px]">{alert.alert_type}</Badge>
                        </div>
                        {alert.message && (
                          <p className="text-xs text-muted-foreground">{alert.message}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {alert.created_at ? new Date(alert.created_at).toLocaleString('fr-FR') : '—'}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {alert.status === 'active' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => acknowledgeAlert(alert.id)}>
                            <Eye className="h-3 w-3 mr-1" />
                            Acquitter
                          </Button>
                        )}
                        {alert.status !== 'resolved' && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => resolveAlert(alert.id)}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Résoudre
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
