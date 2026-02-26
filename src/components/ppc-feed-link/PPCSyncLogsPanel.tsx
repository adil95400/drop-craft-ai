/**
 * PPC Sync Logs Panel
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, AlertCircle, Clock, Package, Plus, Minus, RefreshCw } from 'lucide-react';
import { usePPCSyncLogs } from '@/hooks/usePPCFeedLink';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

interface PPCSyncLogsPanelProps {
  linkId?: string;
}

export function PPCSyncLogsPanel({ linkId }: PPCSyncLogsPanelProps) {
  const { data: logs = [], isLoading } = usePPCSyncLogs(linkId, 50);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Chargement...
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">Aucune synchronisation</h3>
          <p className="text-muted-foreground">
            Les logs de synchronisation apparaîtront ici
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Historique des synchronisations</CardTitle>
        <CardDescription>
          {logs.length} synchronisation(s) enregistrée(s)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 border rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {log.status === 'success' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : log.status === 'partial' ? (
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    )}
                    <Badge
                      variant={
                        log.status === 'success'
                          ? 'default'
                          : log.status === 'partial'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {log.status === 'success'
                        ? 'Succès'
                        : log.status === 'partial'
                        ? 'Partiel'
                        : 'Échec'}
                    </Badge>
                    <Badge variant="outline">{log.sync_type}</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(log.started_at), {
                      addSuffix: true,
                      locale: getDateFnsLocale(),
                    })}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>
                      <strong>{log.products_processed}</strong> traités
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <Plus className="h-4 w-4" />
                    <span>{log.products_added} ajoutés</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600">
                    <RefreshCw className="h-4 w-4" />
                    <span>{log.products_updated} mis à jour</span>
                  </div>
                  <div className="flex items-center gap-2 text-orange-600">
                    <Minus className="h-4 w-4" />
                    <span>{log.products_removed} supprimés</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2 border-t text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {log.duration_ms}ms
                  </span>
                  {log.errors_count > 0 && (
                    <span className="text-destructive">
                      {log.errors_count} erreur(s)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
