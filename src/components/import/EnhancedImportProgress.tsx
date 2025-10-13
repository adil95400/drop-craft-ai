import { memo } from 'react';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ImportProgressProps {
  progress: number;
  status?: 'idle' | 'processing' | 'success' | 'error';
  message?: string;
  details?: {
    total?: number;
    processed?: number;
    failed?: number;
  };
}

export const ImportProgress = memo(function ImportProgress({
  progress,
  status = 'processing',
  message,
  details,
}: ImportProgressProps) {
  const getIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-8 h-8 text-green-500 animate-in zoom-in" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-destructive animate-in zoom-in" />;
      case 'processing':
        return <Loader2 className="w-8 h-8 text-primary animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-destructive';
      case 'processing':
        return 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  if (status === 'idle') return null;

  return (
    <Card className="p-6 space-y-4 animate-in slide-in-from-bottom">
      <div className="flex items-center gap-4">
        {getIcon()}
        <div className="flex-1 space-y-1">
          <p className={cn("font-semibold", getStatusColor())}>
            {status === 'processing' && 'Import en cours...'}
            {status === 'success' && 'Import terminé'}
            {status === 'error' && 'Erreur d\'import'}
          </p>
          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{progress}%</p>
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      {details && (
        <div className="grid grid-cols-3 gap-4 pt-2 border-t">
          {details.total !== undefined && (
            <div className="text-center">
              <p className="text-2xl font-bold">{details.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          )}
          {details.processed !== undefined && (
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{details.processed}</p>
              <p className="text-xs text-muted-foreground">Traités</p>
            </div>
          )}
          {details.failed !== undefined && (
            <div className="text-center">
              <p className="text-2xl font-bold text-destructive">{details.failed}</p>
              <p className="text-xs text-muted-foreground">Échecs</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
});
