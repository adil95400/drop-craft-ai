import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Activity,
  ChevronRight
} from 'lucide-react';
import { useBackgroundJobs, useJobStats, useRealtimeJobs } from '@/hooks/useBackgroundJobs';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { Link } from 'react-router-dom';

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'processing':
      return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-primary" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-destructive" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'secondary',
    processing: 'default',
    completed: 'outline',
    failed: 'destructive',
  };

  const labels: Record<string, string> = {
    pending: 'En attente',
    processing: 'En cours',
    completed: 'Terminé',
    failed: 'Échec',
  };

  return (
    <Badge variant={variants[status] || 'secondary'}>
      {labels[status] || status}
    </Badge>
  );
};

export function JobsDashboardWidget() {
  // Enable realtime updates
  useRealtimeJobs();
  
  const { data: jobs, isLoading: jobsLoading } = useBackgroundJobs({ limit: 5 });
  const { data: stats, isLoading: statsLoading } = useJobStats();

  const activeJobs = jobs?.filter(j => j.status === 'running' || (j.status as string) === 'processing') || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Tâches en arrière-plan
            </CardTitle>
            <CardDescription>
              Synchronisations, imports et traitements IA
            </CardDescription>
          </div>
          <Link to="/jobs">
            <Button variant="ghost" size="sm">
              Voir tout
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats summary */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="rounded-lg bg-muted/50 p-2">
              <div className="text-lg font-semibold">{stats.pending}</div>
              <div className="text-xs text-muted-foreground">En attente</div>
            </div>
            <div className="rounded-lg bg-primary/10 p-2">
              <div className="text-lg font-semibold text-primary">{stats.running}</div>
              <div className="text-xs text-muted-foreground">En cours</div>
            </div>
            <div className="rounded-lg bg-accent/50 p-2">
              <div className="text-lg font-semibold text-accent-foreground">{stats.completed}</div>
              <div className="text-xs text-muted-foreground">Terminés</div>
            </div>
            <div className="rounded-lg bg-destructive/10 p-2">
              <div className="text-lg font-semibold text-destructive">{stats.failed}</div>
              <div className="text-xs text-muted-foreground">Échoués</div>
            </div>
          </div>
        )}

        {/* Active jobs with progress */}
        {activeJobs.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">En cours</h4>
            {activeJobs.map((job) => (
              <div key={job.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm font-medium">
                      {job.name || job.job_type}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {job.progress_percent || 0}%
                  </span>
                </div>
                <Progress value={job.progress_percent || 0} className="h-2" />
                {job.progress_message && (
                  <p className="text-xs text-muted-foreground">
                    {job.progress_message}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Recent jobs list */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Récents</h4>
          {jobsLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : jobs && jobs.length > 0 ? (
            <div className="space-y-2">
              {jobs.slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <div className="flex items-center gap-2">
                    <StatusIcon status={job.status} />
                    <div>
                      <p className="text-sm font-medium">
                        {job.name || job.job_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(job.created_at), {
                          addSuffix: true,
                          locale: getDateFnsLocale(),
                        })}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune tâche récente
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}