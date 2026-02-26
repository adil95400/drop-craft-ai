/**
 * CronJobsDashboard - Monitoring et gestion des jobs asynchrones
 */
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  RefreshCw, 
  Play, 
  Pause, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Activity,
  Package,
  Truck,
  DollarSign,
  RotateCcw,
  Loader2,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

interface CronJob {
  id: string;
  name: string;
  description: string;
  functionName: string;
  schedule: string;
  lastRun?: string;
  nextRun?: string;
  status: 'idle' | 'running' | 'success' | 'error';
  lastResult?: Record<string, unknown>;
  icon: React.ReactNode;
}

interface JobLog {
  id: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_body: Record<string, unknown>;
  created_at: string;
}

const cronJobs: CronJob[] = [
  {
    id: 'retry-failed-orders',
    name: 'Retry Failed Orders',
    description: 'Réessaie les commandes échouées avec backoff exponentiel',
    functionName: 'retry-failed-orders',
    schedule: 'Toutes les 15 min',
    icon: <RotateCcw className="h-5 w-5" />,
    status: 'idle',
  },
  {
    id: 'sync-all-tracking',
    name: 'Sync Tracking',
    description: 'Synchronise les numéros de suivi avec les transporteurs',
    functionName: 'sync-all-tracking',
    schedule: 'Toutes les heures',
    icon: <Truck className="h-5 w-5" />,
    status: 'idle',
  },
  {
    id: 'check-delivery-delays',
    name: 'Check Delays',
    description: 'Vérifie les retards de livraison et crée des alertes',
    functionName: 'check-delivery-delays',
    schedule: 'Toutes les 6 heures',
    icon: <AlertTriangle className="h-5 w-5" />,
    status: 'idle',
  },
  {
    id: 'stock-price-sync',
    name: 'Stock & Price Sync',
    description: 'Synchronise les prix et stocks avec les fournisseurs',
    functionName: 'stock-price-sync',
    schedule: 'Toutes les heures',
    icon: <DollarSign className="h-5 w-5" />,
    status: 'idle',
  },
];

export function CronJobsDashboard() {
  const [jobs, setJobs] = useState<CronJob[]>(cronJobs);
  const [logs, setLogs] = useState<JobLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningJob, setRunningJob] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalRuns: 0,
    successRate: 0,
    lastHourRuns: 0,
    failedJobs: 0,
  });

  const fetchLogs = useCallback(async () => {
    const { data } = await supabase
      .from('api_logs')
      .select('*')
      .eq('method', 'CRON')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (data) {
      setLogs(data as JobLog[]);
      
      // Calculate stats
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const lastHourLogs = data.filter(
        log => new Date(log.created_at) > oneHourAgo
      );
      
      const successLogs = data.filter(log => log.status_code === 200);
      
      setStats({
        totalRuns: data.length,
        successRate: data.length > 0 ? Math.round((successLogs.length / data.length) * 100) : 100,
        lastHourRuns: lastHourLogs.length,
        failedJobs: data.length - successLogs.length,
      });

      // Update job statuses from logs
      setJobs(prev => prev.map(job => {
        const jobLogs = data.filter(log => log.endpoint === `/${job.functionName}`);
        const lastLog = jobLogs[0];
        
        if (lastLog) {
          return {
            ...job,
            lastRun: lastLog.created_at,
            lastResult: (typeof lastLog.response_body === 'object' && lastLog.response_body !== null && !Array.isArray(lastLog.response_body)) 
              ? lastLog.response_body as Record<string, unknown>
              : { data: lastLog.response_body },
            status: (lastLog.status_code === 200 ? 'success' : 'error') as CronJob['status'],
          };
        }
        return job;
      }));
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const runJob = async (job: CronJob) => {
    setRunningJob(job.id);
    setJobs(prev => prev.map(j => 
      j.id === job.id ? { ...j, status: 'running' } : j
    ));

    try {
      const { data, error } = await supabase.functions.invoke(job.functionName);
      
      if (error) throw error;
      
      toast.success(`${job.name} terminé`, {
        description: data?.message || 'Job exécuté avec succès',
      });
      
      setJobs(prev => prev.map(j => 
        j.id === job.id ? { 
          ...j, 
          status: 'success', 
          lastRun: new Date().toISOString(),
          lastResult: data,
        } : j
      ));
    } catch (err) {
      toast.error(`Erreur ${job.name}`, {
        description: err instanceof Error ? err.message : 'Erreur inconnue',
      });
      
      setJobs(prev => prev.map(j => 
        j.id === job.id ? { ...j, status: 'error' } : j
      ));
    } finally {
      setRunningJob(null);
      fetchLogs();
    }
  };

  const getStatusBadge = (status: CronJob['status']) => {
    switch (status) {
      case 'running':
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> En cours</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Succès</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Erreur</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> En attente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalRuns}</p>
                <p className="text-xs text-muted-foreground">Exécutions totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.successRate}%</p>
                <p className="text-xs text-muted-foreground">Taux de succès</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.lastHourRuns}</p>
                <p className="text-xs text-muted-foreground">Dernière heure</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{stats.failedJobs}</p>
                <p className="text-xs text-muted-foreground">Échecs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="jobs" className="w-full">
        <TabsList>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="logs">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchLogs}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {jobs.map(job => (
              <Card key={job.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {job.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base">{job.name}</CardTitle>
                        <CardDescription className="text-xs">{job.schedule}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(job.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{job.description}</p>
                  
                  {job.lastRun && (
                    <div className="text-xs text-muted-foreground mb-3">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      Dernière exécution: {formatDistanceToNow(new Date(job.lastRun), { 
                        addSuffix: true, 
                        locale: getDateFnsLocale() 
                      })}
                    </div>
                  )}
                  
                  {job.lastResult && (
                    <div className="bg-muted/50 rounded-md p-2 mb-3 text-xs font-mono overflow-hidden">
                      {typeof job.lastResult === 'object' && 'message' in job.lastResult 
                        ? String(job.lastResult.message)
                        : JSON.stringify(job.lastResult, null, 2).slice(0, 100)}
                    </div>
                  )}
                  
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => runJob(job)}
                    disabled={runningJob === job.id}
                  >
                    {runningJob === job.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Exécution...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Exécuter maintenant
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Historique des exécutions</CardTitle>
              <CardDescription>Les 50 dernières exécutions de jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {logs.map(log => (
                    <div 
                      key={log.id} 
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {log.status_code === 200 ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{log.endpoint}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), 'dd MMM yyyy HH:mm:ss', { locale: getDateFnsLocale() })}
                          </p>
                        </div>
                      </div>
                      <Badge variant={log.status_code === 200 ? 'default' : 'destructive'}>
                        {log.status_code}
                      </Badge>
                    </div>
                  ))}
                  
                  {logs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Aucune exécution enregistrée</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
