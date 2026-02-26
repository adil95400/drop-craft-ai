import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

export interface ImportJobStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  source_type?: string;
  created_at: string;
  processed_rows?: number;
  total_rows?: number;
  errors?: string[];
}

interface ImportProgressProps {
  job: ImportJobStatus;
  onRetry?: () => void;
}

export function ImportProgress({ job, onRetry }: ImportProgressProps) {
  const getStatusColor = () => {
    switch (job.status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-destructive';
      case 'processing':
        return 'bg-primary';
      default:
        return 'bg-muted';
    }
  };

  const getStatusIcon = () => {
    switch (job.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <p className="font-medium">Import {job.source_type}</p>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(job.created_at), {
                  addSuffix: true,
                  locale: getDateFnsLocale(),
                })}
              </p>
            </div>
          </div>
          <Badge variant={job.status === 'completed' ? 'default' : job.status === 'failed' ? 'destructive' : 'secondary'}>
            {job.status === 'pending' && 'En attente'}
            {job.status === 'processing' && 'En cours'}
            {job.status === 'completed' && 'Terminé'}
            {job.status === 'failed' && 'Échoué'}
          </Badge>
        </div>

        {(job.status === 'processing' || job.progress > 0) && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">{job.progress}%</span>
            </div>
            <Progress value={job.progress} className="h-2" />
          </div>
        )}

        {job.processed_rows !== undefined && job.total_rows && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Lignes traitées</span>
            <span className="font-medium">
              {job.processed_rows} / {job.total_rows}
            </span>
          </div>
        )}

        {job.errors && job.errors.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-destructive">Erreurs :</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {job.errors.slice(0, 3).map((error, i) => (
                <li key={i} className="truncate">• {error}</li>
              ))}
              {job.errors.length > 3 && (
                <li className="text-xs">... et {job.errors.length - 3} autres</li>
              )}
            </ul>
          </div>
        )}

        {job.status === 'failed' && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </Button>
        )}
      </div>
    </Card>
  );
}
