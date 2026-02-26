import { useSyncManager, type SyncLog } from '@/hooks/useSyncManager';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

export function SyncLogsViewer() {
  const { logs, isLoadingLogs } = useSyncManager();
  const typedLogs = (logs || []) as SyncLog[];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'create':
        return <Plus className="h-3 w-3" />;
      case 'update':
        return <Edit className="h-3 w-3" />;
      case 'delete':
        return <Trash2 className="h-3 w-3" />;
      case 'fetch':
        return <ArrowDownCircle className="h-3 w-3" />;
      case 'push':
        return <ArrowUpCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      success: 'default',
      error: 'destructive',
      warning: 'secondary',
      info: 'outline',
    };

    return (
      <Badge variant={variants[status] || 'secondary'} className="gap-1">
        {getStatusIcon(status)}
        {status}
      </Badge>
    );
  };

  if (isLoadingLogs) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Historique de synchronisation</h2>
          <Badge variant="outline">{typedLogs.length} entrées</Badge>
        </div>

        {typedLogs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Aucun log de synchronisation
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Opération</TableHead>
                  <TableHead>Entité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {typedLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), {
                        addSuffix: true,
                        locale: getDateFnsLocale(),
                      })}
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline">{log.sync_type}</Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getOperationIcon(log.sync_type)}
                        <span className="text-sm">{log.sync_type}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {log.integration_id && (
                        <div className="text-sm">
                          <p className="font-medium">Integration</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[100px]">
                            {log.integration_id}
                          </p>
                        </div>
                      )}
                    </TableCell>

                    <TableCell>{getStatusBadge(log.status)}</TableCell>

                    <TableCell>
                      {log.records_synced != null && (
                        <span className="text-sm text-muted-foreground">
                          {log.records_synced} enregistrements
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <p className="text-sm max-w-[300px] truncate">
                        {log.error_message || log.sync_type}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </div>
    </Card>
  );
}
