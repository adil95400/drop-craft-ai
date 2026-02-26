import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useBulkContentGeneration } from '@/hooks/useBulkContentGeneration';
import { Activity, CheckCircle2, XCircle, Clock, Download, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale';
import { useToast } from '@/hooks/use-toast';

export function BulkJobsMonitor() {
  const { jobs, isLoadingJobs, refetchJobs, cancelJob } = useBulkContentGeneration();
  const locale = useDateFnsLocale();
  const { toast } = useToast();

  const handleDownloadResults = (job: any) => {
    if (!job.results || job.results.length === 0) {
      toast({ title: 'Aucun résultat à télécharger', variant: 'destructive' });
      return;
    }

    const csvHeader = 'Nom,Type,URL\n';
    const csvRows = job.results.map((r: any) => 
      `"${(r.name || '').replace(/"/g, '""')}","${job.job_type}","${r.imageUrl || r.videoUrl || ''}"`
    ).join('\n');

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-${job.job_type}-${job.id.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: `${job.results.length} résultats exportés` });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      refetchJobs();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [refetchJobs]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Terminé</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500"><Activity className="h-3 w-3 mr-1 animate-spin" /> En cours</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Échoué</Badge>;
      case 'cancelled':
        return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" /> Annulé</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> En attente</Badge>;
    }
  };

  const getJobTypeLabel = (type: string) => {
    switch (type) {
      case 'videos': return 'Vidéos';
      case 'images': return 'Images';
      case 'social_posts': return 'Posts Sociaux';
      default: return type;
    }
  };

  if (isLoadingJobs) {
    return (
      <div className="flex items-center justify-center py-12">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold">Aucun job en cours</h3>
        <p className="text-muted-foreground">
          Lancez une génération en masse pour voir vos jobs ici
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          Jobs de Génération
        </h2>
        <p className="text-muted-foreground mt-1">
          Suivez la progression de vos générations en masse
        </p>
      </div>

      <div className="space-y-4">
        {jobs.map((job: any) => {
          const progress = job.total_items > 0 
            ? (job.completed_items / job.total_items) * 100 
            : 0;

          return (
            <Card key={job.id} className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">
                        {getJobTypeLabel(job.job_type)}
                      </h3>
                      {getStatusBadge(job.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Créé {formatDistanceToNow(new Date(job.created_at), { 
                        addSuffix: true,
                        locale 
                      })}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    {job.status === 'completed' && job.results?.length > 0 && (
                      <Button variant="outline" size="sm" onClick={() => handleDownloadResults(job)}>
                        <Download className="h-4 w-4 mr-1" />
                        Télécharger
                      </Button>
                    )}
                    {(job.status === 'pending' || job.status === 'processing') && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => cancelJob(job.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Annuler
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progression</span>
                    <span className="font-medium">
                      {job.completed_items} / {job.total_items}
                      {job.failed_items > 0 && (
                        <span className="text-destructive ml-2">
                          ({job.failed_items} échecs)
                        </span>
                      )}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {job.status === 'completed' && job.results?.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-3">
                      Résultats ({job.results.length})
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {job.results.slice(0, 8).map((result: any, index: number) => (
                        <div key={index} className="border rounded-lg p-3 space-y-2">
                          {result.imageUrl && (
                            <img 
                              src={result.imageUrl} 
                              alt={result.name}
                              className="w-full h-24 object-cover rounded"
                            />
                          )}
                          <p className="text-xs font-medium truncate">{result.name}</p>
                        </div>
                      ))}
                    </div>
                    {job.results.length > 8 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        +{job.results.length - 8} autres résultats
                      </p>
                    )}
                  </div>
                )}

                {job.error_log && job.error_log.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-destructive mb-2">
                      Erreurs ({job.error_log.length})
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {job.error_log.map((error: any, index: number) => (
                        <p key={index} className="text-xs text-muted-foreground">
                          • {error.product}: {error.message}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
