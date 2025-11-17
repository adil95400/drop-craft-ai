import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSyncManager } from '@/hooks/useSyncManager';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  Play,
  Pause,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface SyncJobMonitorProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const SyncJobMonitor: React.FC<SyncJobMonitorProps> = ({ 
  autoRefresh = true, 
  refreshInterval = 5000 
}) => {
  const { 
    queue: syncJobs, 
    isLoadingQueue: isLoading,
  } = useSyncManager();
  
  const queueStats = {
    total: syncJobs.length,
    running: syncJobs.filter(j => j.status === 'processing').length,
    completed: syncJobs.filter(j => j.status === 'completed').length,
    failed: syncJobs.filter(j => j.status === 'failed').length,
    by_status: {
      pending: syncJobs.filter(j => j.status === 'pending').length,
      processing: syncJobs.filter(j => j.status === 'processing').length,
      completed: syncJobs.filter(j => j.status === 'completed').length,
      failed: syncJobs.filter(j => j.status === 'failed').length,
    }
  };

  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Les hooks se rechargent automatiquement via react-query
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const getJobStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getJobStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { variant: 'default' as const, label: 'Terminé', className: 'bg-green-500' },
      failed: { variant: 'destructive' as const, label: 'Échoué', className: '' },
      running: { variant: 'default' as const, label: 'En cours', className: 'bg-blue-500' },
      pending: { variant: 'secondary' as const, label: 'En attente', className: '' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                   { variant: 'outline' as const, label: status, className: '' };

    return (
      <Badge 
        variant={config.variant} 
        className={config.className || ''}
      >
        {config.label}
      </Badge>
    );
  };

  const formatJobType = (type: string) => {
    return type || 'Synchronisation';
  };

  const calculateProgress = (job: any) => {
    if (job.status === 'completed') return 100;
    if (job.status === 'failed' || job.status === 'pending') return 0;
    
    // Simulate progress for running jobs
    const elapsed = Date.now() - new Date(job.created_at).getTime();
    const estimatedDuration = 60000; // 1 minute estimate
    return Math.min(Math.floor((elapsed / estimatedDuration) * 100), 95);
  };

  return (
    <div className="space-y-6">
      {/* Queue Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold">{queueStats?.total || 0}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <RefreshCw className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En cours</p>
                <p className="text-2xl font-bold text-blue-600">{queueStats?.running || 0}</p>
              </div>
              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Réussis</p>
                <p className="text-2xl font-bold text-green-600">{queueStats?.completed || 0}</p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Échecs</p>
                <p className="text-2xl font-bold text-red-600">{queueStats?.failed || 0}</p>
              </div>
              <XCircle className="h-4 w-4 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button 
          disabled
          size="sm"
          title="Fonctionnalité à venir"
        >
          <Play className="h-4 w-4 mr-2" />
          Sync Manuel
        </Button>
        
        <Button 
          disabled
          variant="outline"
          size="sm"
          title="Fonctionnalité à venir"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Nettoyer (7j)
        </Button>
      </div>

      {/* Job List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Jobs de Synchronisation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Chargement des jobs...</span>
            </div>
          ) : syncJobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun job de synchronisation trouvé
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {syncJobs.map((job) => {
                  const progress = calculateProgress(job);
                  
                  return (
                    <div
                      key={job.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedJob === job.id ? 'bg-muted' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedJob(job.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getJobStatusIcon(job.status)}
                          <span className="font-medium">{formatJobType(job.sync_type)}</span>
                          {getJobStatusBadge(job.status)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(job.created_at).toLocaleString()}
                        </div>
                      </div>

                      {job.status === 'running' && (
                        <div className="mb-2">
                          <Progress value={progress} className="h-2" />
                          <div className="text-xs text-muted-foreground mt-1">
                            {progress}% complété
                          </div>
                        </div>
                      )}

                      <div className="text-sm text-muted-foreground">
                        {job.entity_type} - {job.operation}
                        {job.entity_id && ` (ID: ${job.entity_id})`}
                      </div>

                      {job.payload && Object.keys(job.payload).length > 0 && (
                        <div className="mt-2 text-xs">
                          <strong>Détails:</strong> {JSON.stringify(job.payload, null, 2)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};