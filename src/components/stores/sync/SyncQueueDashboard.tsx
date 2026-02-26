import { useSyncManager, type SyncQueueItem } from '@/hooks/useSyncManager';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Clock,
  AlertCircle,
  PlayCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

export function SyncQueueDashboard() {
  const { queue, cancelSync, retrySync, isLoadingQueue, isCancelling } = useSyncManager();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'processing':
        return <PlayCircle className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: 'secondary',
      processing: 'default',
      completed: 'default',
      failed: 'destructive',
      cancelled: 'outline',
    };

    return (
      <Badge variant={variants[status] || 'secondary'} className="gap-1">
        {getStatusIcon(status)}
        {status}
      </Badge>
    );
  };

  const getPriorityColor = (priority: number) => {
    if (priority <= 3) return 'text-red-500';
    if (priority <= 6) return 'text-yellow-500';
    return 'text-green-500';
  };

  const stats = {
    pending: queue.filter((q) => q.status === 'pending').length,
    processing: queue.filter((q) => q.status === 'processing').length,
    completed: queue.filter((q) => q.status === 'completed').length,
    failed: queue.filter((q) => q.status === 'failed').length,
  };

  // Calculate overall progress
  const totalJobs = queue.length;
  const completedJobs = stats.completed;
  const progressPercentage = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;
  const hasActiveSync = stats.processing > 0 || stats.pending > 0;

  if (isLoadingQueue) {
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
    <div className="space-y-6">
      {/* Global Progress Bar */}
      {hasActiveSync && (
        <Card className="p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">
                  Synchronisation en cours
                </h3>
                <p className="text-sm text-muted-foreground">
                  {completedJobs} sur {totalJobs} tâches terminées
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">
                  {progressPercentage}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.processing} en cours
                </p>
              </div>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">En attente</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">En cours</p>
              <p className="text-2xl font-bold">{stats.processing}</p>
            </div>
            <PlayCircle className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Terminées</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Échouées</p>
              <p className="text-2xl font-bold">{stats.failed}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Queue Table */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">File d'attente de synchronisation</h2>

          {queue.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Aucune synchronisation en attente
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Planifié</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div>
                        <Badge variant="outline">{job.sync_type}</Badge>
                        {job.error_message && (
                          <p className="text-xs text-red-500 mt-1">
                            {job.error_message}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className={`font-semibold ${getPriorityColor(job.priority)}`}>
                        {job.priority}
                      </span>
                    </TableCell>

                    <TableCell>{getStatusBadge(job.status)}</TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(job.scheduled_at), {
                        addSuffix: true,
                        locale: getDateFnsLocale(),
                      })}
                    </TableCell>

                    <TableCell>
                      <div className="flex gap-2">
                        {job.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelSync(job.id)}
                            disabled={isCancelling}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Annuler
                          </Button>
                        )}

                        {(job.status === 'failed' || job.status === 'cancelled') &&
                          (job.attempts || 0) < (job.max_attempts || 3) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => retrySync(job.id)}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Réessayer
                            </Button>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}
