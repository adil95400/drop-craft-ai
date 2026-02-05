/**
 * Background Jobs Monitor Component
 * Real-time monitoring of async jobs from FastAPI backend
 */

import React from 'react';
import { useJobs, useJobStats, useCancelJob, useRetryJob } from '@/services/api/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCcw,
  StopCircle,
  Package,
  FileText,
  Sparkles,
  Download,
  TrendingUp
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface Job {
  id: string;
  job_type: string;
  job_subtype?: string;
  status: string;
  progress_percent?: number;
  progress_message?: string;
  items_processed?: number;
  items_total?: number;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

const JobTypeIcon: React.FC<{ jobType: string }> = ({ jobType }) => {
  const iconClass = "h-4 w-4";
  
  switch (jobType) {
    case 'supplier_sync':
      return <Package className={iconClass} />;
    case 'scraping':
      return <Download className={iconClass} />;
    case 'import':
      return <FileText className={iconClass} />;
    case 'ai_enrichment':
    case 'content_generation':
      return <Sparkles className={iconClass} />;
    case 'fulfillment':
      return <TrendingUp className={iconClass} />;
    default:
      return <Clock className={iconClass} />;
  }
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    pending: { variant: 'secondary', label: 'En attente' },
    running: { variant: 'default', label: 'En cours' },
    completed: { variant: 'outline', label: 'Terminé' },
    failed: { variant: 'destructive', label: 'Échec' },
    cancelled: { variant: 'secondary', label: 'Annulé' },
  };
  
  const config = variants[status] || { variant: 'secondary', label: status };
  
  return (
    <Badge variant={config.variant} className="capitalize">
      {status === 'running' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
      {status === 'completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
      {status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
      {config.label}
    </Badge>
  );
};

const JobCard: React.FC<{ job: Job }> = ({ job }) => {
  const cancelJob = useCancelJob();
  const retryJob = useRetryJob();
  
  const canCancel = job.status === 'running' || job.status === 'pending';
  const canRetry = job.status === 'failed';
  
  const progress = job.progress_percent || 0;
  const itemsText = job.items_total 
    ? `${job.items_processed || 0} / ${job.items_total}`
    : null;
  
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <JobTypeIcon jobType={job.job_type} />
          <span className="font-medium capitalize">
            {job.job_type.replace(/_/g, ' ')}
          </span>
          {job.job_subtype && (
            <span className="text-muted-foreground text-sm">
              ({job.job_subtype})
            </span>
          )}
        </div>
        <StatusBadge status={job.status} />
      </div>
      
      {job.status === 'running' && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {job.progress_message || 'Traitement...'}
            </span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          {itemsText && (
            <p className="text-xs text-muted-foreground text-right">
              {itemsText} éléments
            </p>
          )}
        </div>
      )}
      
      {job.error_message && (
        <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
          {job.error_message}
        </p>
      )}
      
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(job.created_at), { 
            addSuffix: true,
            locale: fr 
          })}
        </p>
        
        <div className="flex gap-2">
          {canCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => cancelJob.mutate(job.id)}
              disabled={cancelJob.isPending}
            >
              <StopCircle className="h-4 w-4 mr-1" />
              Annuler
            </Button>
          )}
          {canRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => retryJob.mutate(job.id)}
              disabled={retryJob.isPending}
            >
              <RefreshCcw className="h-4 w-4 mr-1" />
              Réessayer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export const BackgroundJobsMonitor: React.FC<{
  maxJobs?: number;
  showStats?: boolean;
  compact?: boolean;
}> = ({ maxJobs = 10, showStats = true, compact = false }) => {
  const { t } = useTranslation();
  const { data: jobs, isLoading, error } = useJobs({ limit: maxJobs });
  const { data: stats } = useJobStats();
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8 text-destructive">
          <XCircle className="h-5 w-5 mr-2" />
          Erreur de chargement des jobs
        </CardContent>
      </Card>
    );
  }
  
  const jobsList = jobs || [];
  const runningJobs = jobsList.filter((j: Job) => j.status === 'running').length;
  const pendingJobs = jobsList.filter((j: Job) => j.status === 'pending').length;
  
  return (
    <Card>
      <CardHeader className={compact ? "pb-2" : ""}>
        <div className="flex items-center justify-between">
          <CardTitle className={compact ? "text-base" : ""}>
            Tâches en arrière-plan
          </CardTitle>
          <div className="flex items-center gap-2">
            {runningJobs > 0 && (
              <Badge variant="default" className="animate-pulse">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                {runningJobs} en cours
              </Badge>
            )}
            {pendingJobs > 0 && (
              <Badge variant="secondary">
                {pendingJobs} en attente
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {showStats && stats && (
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center p-2 bg-muted rounded">
              <p className="text-2xl font-bold">{stats.total_today || 0}</p>
              <p className="text-xs text-muted-foreground">Aujourd'hui</p>
            </div>
            <div className="text-center p-2 bg-accent/30 rounded">
              <p className="text-2xl font-bold text-primary">{stats.completed || 0}</p>
              <p className="text-xs text-muted-foreground">Réussis</p>
            </div>
            <div className="text-center p-2 bg-destructive/10 rounded">
              <p className="text-2xl font-bold text-destructive">{stats.failed || 0}</p>
              <p className="text-xs text-muted-foreground">Échecs</p>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <p className="text-2xl font-bold">{stats.avg_duration_seconds || 0}s</p>
              <p className="text-xs text-muted-foreground">Durée moy.</p>
            </div>
          </div>
        )}
        
        {jobsList.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Aucune tâche récente</p>
          </div>
        ) : (
          <ScrollArea className={compact ? "h-[300px]" : "h-[400px]"}>
            <div className="space-y-3">
              {jobsList.map((job: Job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default BackgroundJobsMonitor;
