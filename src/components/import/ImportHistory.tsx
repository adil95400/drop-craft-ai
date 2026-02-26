import { memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { FileText, CheckCircle2, XCircle, Clock, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ImportJob {
  id: string;
  created_at: string;
  status: string;
  source_type?: string;
  processed_rows?: number;
  failed_rows?: number;
  errors?: string[];
}

interface ImportHistoryProps {
  jobs?: ImportJob[];
  isLoading?: boolean;
}

export const ImportHistory = memo(function ImportHistory({
  jobs = [],
  isLoading = false,
}: ImportHistoryProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-primary animate-pulse" />;
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      completed: { variant: 'default' as const, label: 'Terminé', className: 'bg-green-500/10 text-green-500' },
      failed: { variant: 'destructive' as const, label: 'Échoué', className: '' },
      processing: { variant: 'default' as const, label: 'En cours', className: '' },
      pending: { variant: 'secondary' as const, label: 'En attente', className: '' },
    };

    const { variant, label, className } = config[status as keyof typeof config] || config.pending;

    return (
      <Badge variant={variant} className={className}>
        {label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <Card className="p-8 text-center">
        <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Aucun historique d'import</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <Card
          key={job.id}
          className={cn(
            "p-4 transition-all hover:shadow-md",
            job.status === 'processing' && "border-primary"
          )}
        >
          <div className="flex items-start gap-4">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              job.status === 'completed' && "bg-green-500/10",
              job.status === 'failed' && "bg-destructive/10",
              job.status === 'processing' && "bg-primary/10",
              job.status === 'pending' && "bg-muted"
            )}>
              {getStatusIcon(job.status)}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">
                  Import {job.source_type}
                </p>
                {getStatusBadge(job.status)}
              </div>

              <p className="text-sm text-muted-foreground">
{formatDistanceToNow(new Date(job.created_at), {
                  addSuffix: true,
                  locale: getDateFnsLocale(),
                })}
              </p>

              {job.processed_rows !== undefined && (
                <div className="flex gap-4 text-sm">
                  <span className="text-green-500">
                    ✓ {job.processed_rows} traités
                  </span>
                  {job.failed_rows !== undefined && job.failed_rows > 0 && (
                    <span className="text-destructive">
                      ✗ {job.failed_rows} échecs
                    </span>
                  )}
                </div>
              )}

              {job.errors && job.errors.length > 0 && (
                <details className="text-sm text-destructive cursor-pointer">
                  <summary className="hover:underline">
                    Voir les erreurs ({job.errors.length})
                  </summary>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    {job.errors.slice(0, 3).map((error, i) => (
                      <li key={i} className="truncate">{error}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
});
