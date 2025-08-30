import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Activity,
  Users,
  ShoppingCart
} from 'lucide-react';
import { JobQueueManager } from '@/services/JobQueue';
import { ImportJob } from '@/types/suppliers';
import { useToast } from '@/hooks/use-toast';

export const JobQueueDashboard: React.FC = () => {
  const [jobs, setJobs] = useState<Record<string, ImportJob[]>>({});
  const [stats, setStats] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const jobManager = JobQueueManager.getInstance();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [importJobs, orderJobs, syncJobs, queueStats] = await Promise.all([
        jobManager.getQueueJobs('imports'),
        jobManager.getQueueJobs('orders'),
        jobManager.getQueueJobs('sync'),
        jobManager.getQueueStats(),
      ]);

      setJobs({
        imports: importJobs,
        orders: orderJobs,
        sync: syncJobs,
      });
      setStats(queueStats);
    } catch (error) {
      console.error('Failed to load job data:', error);
    }
  };

  const handlePauseQueue = async (queueName: string) => {
    try {
      setLoading(true);
      await jobManager.pauseQueue(queueName);
      await loadData();
      toast({
        title: "File d'attente mise en pause",
        description: `La file "${queueName}" a été mise en pause.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre en pause la file d'attente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResumeQueue = async (queueName: string) => {
    try {
      setLoading(true);
      await jobManager.resumeQueue(queueName);
      await loadData();
      toast({
        title: "File d'attente reprise",
        description: `La file "${queueName}" a été reprise.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de reprendre la file d'attente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'running':
        return <Activity className="w-4 h-4 text-primary animate-pulse" />;
      case 'queued':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      default:
        return <AlertCircle className="w-4 h-4 text-warning" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      failed: 'destructive',
      running: 'secondary',
      queued: 'outline',
      cancelled: 'secondary',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDuration = (startedAt?: Date, completedAt?: Date) => {
    if (!startedAt) return '-';
    
    const end = completedAt || new Date();
    const duration = end.getTime() - startedAt.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Queue Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(stats).map(([queueName, queueStats]) => (
          <Card key={queueName}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium capitalize">
                {queueName === 'imports' && <Users className="w-4 h-4 mr-2 inline" />}
                {queueName === 'orders' && <ShoppingCart className="w-4 h-4 mr-2 inline" />}
                {queueName === 'sync' && <RefreshCw className="w-4 h-4 mr-2 inline" />}
                {queueName}
              </CardTitle>
              <div className="flex items-center space-x-2">
                {queueStats.isActive ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePauseQueue(queueName)}
                    disabled={loading}
                  >
                    <Pause className="w-3 h-3" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResumeQueue(queueName)}
                    disabled={loading}
                  >
                    <Play className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{queueStats.total}</div>
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                <div>En attente: {queueStats.queued}</div>
                <div>En cours: {queueStats.running}</div>
                <div>Terminés: {queueStats.completed}</div>
                <div>Échoués: {queueStats.failed}</div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Concurrence: {queueStats.concurrency}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Job Details */}
      <Card>
        <CardHeader>
          <CardTitle>Tâches en cours et historique</CardTitle>
          <CardDescription>
            Suivi détaillé de toutes les tâches d'import et de synchronisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="imports">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="imports">Imports ({jobs.imports?.length || 0})</TabsTrigger>
              <TabsTrigger value="orders">Commandes ({jobs.orders?.length || 0})</TabsTrigger>
              <TabsTrigger value="sync">Sync ({jobs.sync?.length || 0})</TabsTrigger>
            </TabsList>

            {Object.entries(jobs).map(([queueName, queueJobs]) => (
              <TabsContent key={queueName} value={queueName} className="space-y-4">
                {queueJobs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune tâche dans cette file d'attente
                  </div>
                ) : (
                  <div className="space-y-3">
                    {queueJobs
                      .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime())
                      .map((job) => (
                        <Card key={job.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              {getStatusIcon(job.status)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <p className="text-sm font-medium">
                                    {job.type.replace('_', ' ')} - {job.supplierId}
                                  </p>
                                  {getStatusBadge(job.status)}
                                  <Badge variant="outline">{job.priority}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Programmé: {job.scheduledAt.toLocaleString()}
                                </p>
                                {job.status === 'running' && (
                                  <div className="mt-2">
                                    <div className="flex justify-between text-xs mb-1">
                                      <span>Progression</span>
                                      <span>{Math.round(job.progress)}%</span>
                                    </div>
                                    <Progress value={job.progress} className="h-2" />
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {job.processedItems}/{job.totalItems} éléments traités
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right text-xs text-muted-foreground">
                              <div>Durée: {formatDuration(job.startedAt, job.completedAt)}</div>
                              <div className="mt-1">
                                ✓ {job.successCount} / ✗ {job.errorCount}
                              </div>
                            </div>
                          </div>
                          {job.errors.length > 0 && (
                            <div className="mt-3 p-2 bg-destructive/10 rounded-md">
                              <p className="text-xs font-medium text-destructive">Erreurs:</p>
                              <ul className="text-xs text-destructive mt-1 space-y-1">
                                {job.errors.slice(0, 3).map((error, index) => (
                                  <li key={index}>• {error}</li>
                                ))}
                                {job.errors.length > 3 && (
                                  <li>... et {job.errors.length - 3} autres erreurs</li>
                                )}
                              </ul>
                            </div>
                          )}
                        </Card>
                      ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};