import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import {
  Search, RefreshCw, AlertTriangle, Info, AlertCircle, CheckCircle,
  FileText, Shield, Globe, Clock, Filter, Download
} from 'lucide-react';

type LogLevel = 'all' | 'info' | 'warn' | 'error' | 'debug';
type LogSource = 'all' | 'activity' | 'api' | 'audit';

interface UnifiedLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug' | 'success';
  source: LogSource;
  action: string;
  message: string;
  details?: string;
  user_id?: string | null;
  metadata?: Record<string, any>;
}

export function CentralizedLogsDashboard() {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel>('all');
  const [sourceFilter, setSourceFilter] = useState<LogSource>('all');

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['centralized-logs'],
    queryFn: async () => {
      const [activityRes, apiRes, auditRes] = await Promise.all([
        supabase
          .from('activity_logs')
          .select('id, action, description, source, severity, details, user_id, created_at')
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('api_logs')
          .select('id, endpoint, method, status_code, error_message, duration_ms, user_id, created_at')
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('audit_logs')
          .select('id, action, action_category, severity, description, resource_type, user_id, created_at')
          .order('created_at', { ascending: false })
          .limit(200),
      ]);

      const unified: UnifiedLog[] = [];

      (activityRes.data || []).forEach(log => {
        unified.push({
          id: `act-${log.id}`,
          timestamp: log.created_at || '',
          level: log.severity === 'error' ? 'error' : log.severity === 'warn' ? 'warn' : 'info',
          source: 'activity',
          action: log.action,
          message: log.description || log.action,
          details: log.source || undefined,
          user_id: log.user_id,
          metadata: (log.details as Record<string, any>) || undefined,
        });
      });

      (apiRes.data || []).forEach(log => {
        const code = log.status_code || 0;
        unified.push({
          id: `api-${log.id}`,
          timestamp: log.created_at || '',
          level: code >= 500 ? 'error' : code >= 400 ? 'warn' : 'info',
          source: 'api',
          action: `${log.method || 'GET'} ${log.endpoint}`,
          message: log.error_message || `${code} - ${log.endpoint}`,
          details: log.duration_ms ? `${log.duration_ms}ms` : undefined,
          user_id: log.user_id,
        });
      });

      (auditRes.data || []).forEach(log => {
        unified.push({
          id: `aud-${log.id}`,
          timestamp: log.created_at || '',
          level: log.severity === 'error' || log.severity === 'critical' ? 'error' : log.severity === 'warn' || log.severity === 'warning' ? 'warn' : 'info',
          source: 'audit',
          action: `[${log.action_category}] ${log.action}`,
          message: log.description || log.action,
          details: log.resource_type || undefined,
          user_id: log.user_id,
        });
      });

      return unified.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const filtered = useMemo(() => {
    return logs.filter(log => {
      if (levelFilter !== 'all' && log.level !== levelFilter) return false;
      if (sourceFilter !== 'all' && log.source !== sourceFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return log.action.toLowerCase().includes(q) || log.message.toLowerCase().includes(q);
      }
      return true;
    });
  }, [logs, levelFilter, sourceFilter, search]);

  const stats = useMemo(() => ({
    total: logs.length,
    errors: logs.filter(l => l.level === 'error').length,
    warnings: logs.filter(l => l.level === 'warn').length,
    activity: logs.filter(l => l.source === 'activity').length,
    api: logs.filter(l => l.source === 'api').length,
    audit: logs.filter(l => l.source === 'audit').length,
  }), [logs]);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
      case 'warn': return <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />;
      case 'success': return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
      default: return <Info className="h-3.5 w-3.5 text-blue-500" />;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'api': return <Globe className="h-3.5 w-3.5" />;
      case 'audit': return <Shield className="h-3.5 w-3.5" />;
      default: return <FileText className="h-3.5 w-3.5" />;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'error': return <Badge variant="destructive" className="text-[10px] px-1.5">ERROR</Badge>;
      case 'warn': return <Badge variant="secondary" className="text-[10px] px-1.5">WARN</Badge>;
      default: return <Badge variant="outline" className="text-[10px] px-1.5">INFO</Badge>;
    }
  };

  const exportLogs = () => {
    const csv = ['Timestamp,Level,Source,Action,Message']
      .concat(filtered.map(l => `${l.timestamp},${l.level},${l.source},"${l.action}","${l.message}"`))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: FileText },
          { label: 'Erreurs', value: stats.errors, icon: AlertCircle, className: 'text-destructive' },
          { label: 'Warnings', value: stats.warnings, icon: AlertTriangle, className: 'text-yellow-500' },
          { label: 'Activité', value: stats.activity, icon: FileText },
          { label: 'API', value: stats.api, icon: Globe },
          { label: 'Audit', value: stats.audit, icon: Shield },
        ].map((s, i) => (
          <Card key={i} className="p-3">
            <div className="flex items-center gap-2">
              <s.icon className={`h-4 w-4 ${s.className || 'text-muted-foreground'}`} />
              <div>
                <p className={`text-lg font-bold ${s.className || ''}`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans les logs..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={levelFilter} onValueChange={v => setLevelFilter(v as LogLevel)}>
              <SelectTrigger className="w-[130px]">
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous niveaux</SelectItem>
                <SelectItem value="error">Erreurs</SelectItem>
                <SelectItem value="warn">Warnings</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={v => setSourceFilter(v as LogSource)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes sources</SelectItem>
                <SelectItem value="activity">Activité</SelectItem>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="audit">Audit</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Rafraîchir
            </Button>
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Exporter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Log entries */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Logs centralisés
          </CardTitle>
          <CardDescription>{filtered.length} entrées affichées</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-1 font-mono text-xs">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucun log trouvé</p>
                </div>
              ) : (
                filtered.map(log => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-2 px-2 py-1.5 rounded hover:bg-muted/50 transition-colors ${
                      log.level === 'error' ? 'bg-destructive/5' : log.level === 'warn' ? 'bg-yellow-500/5' : ''
                    }`}
                  >
                    <span className="text-muted-foreground whitespace-nowrap flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3" />
                      {new Date(log.timestamp).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    {getLevelIcon(log.level)}
                    {getSourceIcon(log.source)}
                    {getLevelBadge(log.level)}
                    <span className="text-muted-foreground shrink-0">[{log.source.toUpperCase()}]</span>
                    <span className="truncate">{log.message}</span>
                    {log.details && (
                      <span className="text-muted-foreground ml-auto shrink-0">{log.details}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
