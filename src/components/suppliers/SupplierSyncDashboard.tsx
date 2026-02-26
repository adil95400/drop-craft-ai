import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupplierSyncMonitor } from '@/hooks/useSupplierSyncMonitor';
import { RefreshCw, AlertTriangle, CheckCircle, Clock, Bell, Activity, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale';

export function SupplierSyncDashboard() {
  const locale = useDateFnsLocale();
  const {
    syncStatuses,
    recentAlerts,
    recentJobs,
    isLoading,
    toggleAutoSync,
    updateSyncInterval,
    triggerManualSync,
  } = useSupplierSyncMonitor();

  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await triggerManualSync();
    } finally {
      setIsSyncing(false);
    }
  };

  const highAlerts = recentAlerts.filter((a) => a.severity === 'high');
  const mediumAlerts = recentAlerts.filter((a) => a.severity === 'medium');

  return (
    <div className="space-y-6">
      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{syncStatuses.length}</p>
                <p className="text-sm text-muted-foreground">Fournisseurs actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {syncStatuses.filter((s) => s.autoSyncEnabled).length}
                </p>
                <p className="text-sm text-muted-foreground">Sync auto activée</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{highAlerts.length}</p>
                <p className="text-sm text-muted-foreground">Alertes critiques</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Bell className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mediumAlerts.length}</p>
                <p className="text-sm text-muted-foreground">Avertissements</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual sync button */}
      <div className="flex justify-end">
        <Button onClick={handleManualSync} disabled={isSyncing}>
          {isSyncing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Synchroniser maintenant
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier connections */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Connexions fournisseurs</CardTitle>
          </CardHeader>
          <CardContent>
            {syncStatuses.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucun fournisseur connecté</p>
            ) : (
              <div className="space-y-4">
                {syncStatuses.map((status) => (
                  <div
                    key={status.connectionId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{status.supplierId}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {status.lastSyncAt
                          ? `Dernière sync: ${formatDistanceToNow(new Date(status.lastSyncAt), { addSuffix: true, locale })}`
                          : 'Jamais synchronisé'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Select
                        value={String(status.syncIntervalMinutes)}
                        onValueChange={(val) =>
                          updateSyncInterval(status.connectionId, parseInt(val))
                        }
                      >
                        <SelectTrigger className="w-24 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 min</SelectItem>
                          <SelectItem value="15">15 min</SelectItem>
                          <SelectItem value="30">30 min</SelectItem>
                          <SelectItem value="60">1h</SelectItem>
                          <SelectItem value="360">6h</SelectItem>
                        </SelectContent>
                      </Select>
                      <Switch
                        checked={status.autoSyncEnabled}
                        onCheckedChange={(checked) =>
                          toggleAutoSync(status.connectionId, checked)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alertes récentes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentAlerts.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucune alerte</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {recentAlerts.slice(0, 15).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 p-2 border rounded-lg"
                  >
                    {alert.severity === 'high' ? (
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Bell className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{alert.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true, locale })}
                      </p>
                    </div>
                    <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'} className="text-xs flex-shrink-0">
                      {alert.type === 'out_of_stock' ? 'Rupture' : 'Stock bas'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent sync jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historique des synchronisations</CardTitle>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucune synchronisation récente</p>
          ) : (
            <div className="space-y-2">
              {recentJobs.slice(0, 10).map((job: any) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {job.status === 'completed' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : job.status === 'running' ? (
                      <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{job.name || 'Sync fournisseur'}</p>
                      <p className="text-xs text-muted-foreground">
                        {job.progress_message || `${job.items_processed || 0}/${job.items_total || 0} produits`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={job.status === 'completed' ? 'default' : job.status === 'running' ? 'secondary' : 'destructive'}>
                      {job.status === 'completed' ? 'Terminé' : job.status === 'running' ? 'En cours' : 'Erreur'}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {job.completed_at
                        ? formatDistanceToNow(new Date(job.completed_at), { addSuffix: true, locale })
                        : formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
