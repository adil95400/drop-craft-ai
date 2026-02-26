import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { StoreStats } from '@/hooks/useUnifiedStores';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

interface StoreSyncStatusProps {
  stats: StoreStats[];
  isLoading?: boolean;
}

export function StoreSyncStatus({ stats, isLoading }: StoreSyncStatusProps) {
  if (isLoading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-40 bg-muted rounded" />
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500">Connecté</Badge>;
      case 'syncing':
        return <Badge className="bg-blue-500">Synchronisation</Badge>;
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>;
      default:
        return <Badge variant="secondary">Déconnecté</Badge>;
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Statut de Synchronisation</h3>
      
      {stats.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Aucune boutique connectée</p>
        </div>
      ) : (
        <div className="space-y-4">
          {stats.map((stat) => (
            <div key={stat.store_id} className="border-b pb-4 last:border-0 last:pb-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-foreground">{stat.store_name}</h4>
                  {stat.is_active ? (
                    <Badge variant="outline" className="text-xs">Actif</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Inactif</Badge>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {stat.active_integrations}/{stat.total_integrations} actives
                </span>
              </div>

              {stat.integrations_summary.length > 0 ? (
                <div className="space-y-2">
                  {stat.integrations_summary.map((integration, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(integration.status)}
                        <span className="text-foreground">{integration.platform}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(integration.status)}
                        {integration.last_sync && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(integration.last_sync), {
                              addSuffix: true,
                              locale: getDateFnsLocale(),
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune intégration</p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
