/**
 * AuditLogViewer - Admin component to view and filter audit logs
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Filter, 
  Info, 
  RefreshCw, 
  Search,
  Shield,
  User,
  Database,
  Settings,
  Download,
  Upload,
  Zap,
  AlertCircle
} from 'lucide-react';
import { useAuditLogs, useAuditStatistics } from '@/hooks/useAuditLog';
import type { AuditCategory, AuditSeverity, AuditLogRecord } from '@/services/AuditService';
import { formatDistanceToNow, format } from 'date-fns';
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale';

const CATEGORY_ICONS: Record<AuditCategory, React.ReactNode> = {
  auth: <User className="h-4 w-4" />,
  data: <Database className="h-4 w-4" />,
  admin: <Shield className="h-4 w-4" />,
  api: <Zap className="h-4 w-4" />,
  import: <Upload className="h-4 w-4" />,
  export: <Download className="h-4 w-4" />,
  integration: <Settings className="h-4 w-4" />,
  billing: <Activity className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
  system: <Settings className="h-4 w-4" />,
  automation: <Zap className="h-4 w-4" />
};

const SEVERITY_CONFIG: Record<AuditSeverity, { color: string; icon: React.ReactNode }> = {
  debug: { color: 'bg-muted text-muted-foreground', icon: <Info className="h-3 w-3" /> },
  info: { color: 'bg-blue-500/10 text-blue-600', icon: <CheckCircle className="h-3 w-3" /> },
  warn: { color: 'bg-yellow-500/10 text-yellow-600', icon: <AlertTriangle className="h-3 w-3" /> },
  error: { color: 'bg-red-500/10 text-red-600', icon: <AlertCircle className="h-3 w-3" /> },
  critical: { color: 'bg-red-600 text-white', icon: <AlertCircle className="h-3 w-3" /> }
};

const CATEGORIES: AuditCategory[] = [
  'auth', 'data', 'admin', 'api', 'import', 'export', 
  'integration', 'billing', 'security', 'system', 'automation'
];

const SEVERITIES: AuditSeverity[] = ['debug', 'info', 'warn', 'error', 'critical'];

export function AuditLogViewer() {
  const locale = useDateFnsLocale();
  const [category, setCategory] = useState<AuditCategory | 'all'>('all');
  const [severity, setSeverity] = useState<AuditSeverity | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { logs, isLoading, refetch } = useAuditLogs({
    category: category === 'all' ? undefined : category,
    severity: severity === 'all' ? undefined : severity,
    limit: 200,
    realtime: true
  });

  const { data: stats } = useAuditStatistics(30);

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(query) ||
      log.description?.toLowerCase().includes(query) ||
      log.resource_name?.toLowerCase().includes(query) ||
      log.actor_email?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.total_events?.toLocaleString() || 0}</p>
                  <p className="text-xs text-muted-foreground">Événements (30j)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.unique_users || 0}</p>
                  <p className="text-xs text-muted-foreground">Utilisateurs actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.by_severity?.warn || 0}</p>
                  <p className="text-xs text-muted-foreground">Avertissements</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.critical_events || 0}</p>
                  <p className="text-xs text-muted-foreground">Événements critiques</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Log Viewer */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Journal d'Audit
              </CardTitle>
              <CardDescription>
                Historique complet des actions et événements
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans les logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={category} onValueChange={(v) => setCategory(v as AuditCategory | 'all')}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    <span className="flex items-center gap-2">
                      {CATEGORY_ICONS[cat]}
                      {cat}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={severity} onValueChange={(v) => setSeverity(v as AuditSeverity | 'all')}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sévérité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {SEVERITIES.map(sev => (
                  <SelectItem key={sev} value={sev}>
                    <span className="flex items-center gap-2">
                      {SEVERITY_CONFIG[sev].icon}
                      {sev}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Log List */}
          <ScrollArea className="h-[500px] pr-4">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun événement trouvé</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLogs.map((log) => (
                  <AuditLogItem key={log.id} log={log} />
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function AuditLogItem({ log }: { log: AuditLogRecord }) {
  const locale = useDateFnsLocale();
  const [expanded, setExpanded] = useState(false);
  const severityConfig = SEVERITY_CONFIG[log.severity as AuditSeverity] || SEVERITY_CONFIG.info;
  const categoryIcon = CATEGORY_ICONS[log.action_category as AuditCategory];

  return (
    <div 
      className="border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="mt-0.5">
            {categoryIcon}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{log.action}</span>
              <Badge variant="outline" className={`text-xs ${severityConfig.color}`}>
                {severityConfig.icon}
                <span className="ml-1">{log.severity}</span>
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {log.action_category}
              </Badge>
            </div>
            
            {log.description && (
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {log.description}
              </p>
            )}
            
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              {log.actor_email && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {log.actor_email}
                </span>
              )}
              {log.resource_name && (
                <span className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  {log.resource_name}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale })}
        </div>
      </div>
      
      {expanded && (
        <div className="mt-3 pt-3 border-t space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">ID:</span>
              <span className="ml-2 font-mono text-xs">{log.id}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Type d'acteur:</span>
              <span className="ml-2">{log.actor_type}</span>
            </div>
            {log.resource_type && (
              <div>
                <span className="text-muted-foreground">Type de ressource:</span>
                <span className="ml-2">{log.resource_type}</span>
              </div>
            )}
            {log.resource_id && (
              <div>
                <span className="text-muted-foreground">ID ressource:</span>
                <span className="ml-2 font-mono text-xs">{log.resource_id}</span>
              </div>
            )}
          </div>
          
          {log.changed_fields && log.changed_fields.length > 0 && (
            <div>
              <span className="text-sm text-muted-foreground">Champs modifiés:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {log.changed_fields.map(field => (
                  <Badge key={field} variant="outline" className="text-xs">
                    {field}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div>
              <span className="text-sm text-muted-foreground">Métadonnées:</span>
              <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground">
            {format(new Date(log.created_at), 'PPpp', { locale })}
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditLogViewer;
