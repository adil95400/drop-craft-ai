import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity, CheckCircle, XCircle, Clock, RefreshCw, 
  Zap, ArrowRight, Calendar, Timer, AlertCircle 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { cn } from '@/lib/utils';

interface ExecutionLog {
  id: string;
  trigger_id: string | null;
  action_id: string | null;
  status: string | null;
  executed_at: string | null;
  duration_ms: number | null;
  error_message: string | null;
  input_data: unknown;
  output_data: unknown;
}

export function ActivityMonitoring() {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('activity_logs')
        .select('id, user_id, action, description, details, created_at, severity')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50) as any;

      if (filter === 'success') {
        query = query.eq('severity', 'info');
      } else if (filter === 'failed') {
        query = query.eq('severity', 'error');
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs((data || []).map((d: any) => ({
        id: d.id,
        trigger_id: null,
        action_id: null,
        status: d.severity === 'error' ? 'failed' : 'success',
        executed_at: d.created_at,
        duration_ms: null,
        error_message: d.severity === 'error' ? d.description : null,
        input_data: d.details,
        output_data: null,
      })));
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const getStatusConfig = (status: string | null) => {
    switch (status) {
      case 'success':
        return { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-500/10', label: 'Succès' };
      case 'failed':
        return { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-500/10', label: 'Échec' };
      case 'pending':
        return { icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-500/10', label: 'En attente' };
      default:
        return { icon: Activity, color: 'text-muted-foreground', bgColor: 'bg-muted', label: 'Inconnu' };
    }
  };

  const stats = {
    total: logs.length,
    success: logs.filter(l => l.status === 'success').length,
    failed: logs.filter(l => l.status === 'failed').length,
    avgDuration: logs.length > 0 
      ? Math.round(logs.reduce((acc, l) => acc + (l.duration_ms || 0), 0) / logs.length)
      : 0
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total exécutions</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Succès</p>
                <p className="text-2xl font-bold text-green-500">{stats.success}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Échecs</p>
                <p className="text-2xl font-bold text-red-500">{stats.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Timer className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Durée moy.</p>
                <p className="text-2xl font-bold">{stats.avgDuration}ms</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Historique des exécutions
              </CardTitle>
              <CardDescription>Logs des dernières automatisations exécutées</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {(['all', 'success', 'failed'] as const).map((f) => (
                  <Button
                    key={f}
                    variant={filter === f ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(f)}
                  >
                    {f === 'all' ? 'Tous' : f === 'success' ? 'Succès' : 'Échecs'}
                  </Button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={fetchLogs}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune exécution trouvée</p>
              <p className="text-sm text-muted-foreground mt-1">
                Les logs apparaîtront ici lorsque vos automatisations s'exécuteront
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {logs.map((log) => {
                  const statusConfig = getStatusConfig(log.status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <div
                      key={log.id}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-lg border",
                        statusConfig.bgColor
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-full", statusConfig.bgColor)}>
                          <StatusIcon className={cn("h-4 w-4", statusConfig.color)} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Automation</span>
                            <Badge variant="outline" className={statusConfig.color}>
                              {statusConfig.label}
                            </Badge>
                          </div>
                          {log.error_message && (
                            <p className="text-sm text-red-500 mt-1">{log.error_message}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {log.executed_at 
                                ? formatDistanceToNow(new Date(log.executed_at), { addSuffix: true, locale: getDateFnsLocale() })
                                : 'N/A'}
                            </span>
                            {log.duration_ms && (
                              <span className="flex items-center gap-1">
                                <Timer className="h-3 w-3" />
                                {log.duration_ms}ms
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
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
}
