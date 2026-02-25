/**
 * AutomationEventLog - Granular execution logs from activity_logs table
 */
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Download, CheckCircle2, XCircle, AlertTriangle, Info, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  workflowName: string;
  stepName: string;
  message: string;
  details?: string;
  executionId: string;
  durationMs?: number;
}

export function AutomationEventLog() {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [workflowFilter, setWorkflowFilter] = useState<string>('all');

  const { data: logs = [] } = useQuery({
    queryKey: ['automation-event-logs'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      
      const { data, error } = await (supabase.from('activity_logs') as any)
        .select('*')
        .eq('user_id', user.id)
        .or('source.eq.automation,source.eq.workflow,action.ilike.%automation%,action.ilike.%workflow%')
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (error) return []
      
      return (data || []).map((log: any) => ({
        id: log.id,
        timestamp: log.created_at,
        level: log.severity === 'error' ? 'error' : log.severity === 'warn' ? 'warning' : log.action?.includes('success') || log.action?.includes('completed') ? 'success' : 'info',
        workflowName: log.entity_type || 'Workflow',
        stepName: log.action || '',
        message: log.description || log.action,
        details: log.details ? JSON.stringify(log.details) : undefined,
        executionId: log.entity_id || log.id,
        durationMs: log.details?.duration_ms,
      })) as LogEntry[]
    },
    refetchInterval: 15_000,
  })

  const workflowNames = useMemo(() => {
    const names = new Set(logs.map((l: LogEntry) => l.workflowName));
    return Array.from(names);
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log: LogEntry) => {
      if (levelFilter !== 'all' && log.level !== levelFilter) return false;
      if (workflowFilter !== 'all' && log.workflowName !== workflowFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return log.message.toLowerCase().includes(q) || log.workflowName.toLowerCase().includes(q) || log.stepName.toLowerCase().includes(q);
      }
      return true;
    });
  }, [logs, search, levelFilter, workflowFilter]);

  const getLevelConfig = (level: string) => {
    switch (level) {
      case 'success': return { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' };
      case 'error': return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' };
      case 'warning': return { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' };
      default: return { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10' };
    }
  };

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const counts = {
    total: logs.length,
    error: logs.filter((l: LogEntry) => l.level === 'error').length,
    warning: logs.filter((l: LogEntry) => l.level === 'warning').length,
    success: logs.filter((l: LogEntry) => l.level === 'success').length,
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg"><Terminal className="h-5 w-5 text-primary" />Journal d'événements</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{counts.total} logs</Badge>
            {counts.error > 0 && <Badge variant="destructive" className="text-xs">{counts.error} erreurs</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher dans les logs..." className="h-8 pl-8 text-xs" />
          </div>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue placeholder="Niveau" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous niveaux</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Succès</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Erreur</SelectItem>
            </SelectContent>
          </Select>
          <Select value={workflowFilter} onValueChange={setWorkflowFilter}>
            <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue placeholder="Workflow" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous workflows</SelectItem>
              {workflowNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <ScrollArea className="h-[400px]">
          <div className="space-y-1">
            {filteredLogs.map((log: LogEntry) => {
              const config = getLevelConfig(log.level);
              const Icon = config.icon;
              return (
                <div key={log.id} className={cn("flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors text-xs", log.level === 'error' && "bg-red-50/50 dark:bg-red-950/10")}>
                  <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", config.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-muted-foreground">{formatTime(log.timestamp)}</span>
                      <Badge variant="outline" className="text-[10px] h-4">{log.workflowName}</Badge>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">{log.stepName}</span>
                      {log.durationMs != null && <span className="text-muted-foreground font-mono">{log.durationMs}ms</span>}
                    </div>
                    <p className="mt-0.5">{log.message}</p>
                    {log.details && <p className="mt-1 font-mono text-[11px] text-muted-foreground bg-muted p-1.5 rounded">{log.details}</p>}
                  </div>
                </div>
              );
            })}
            {filteredLogs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucun log trouvé</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}