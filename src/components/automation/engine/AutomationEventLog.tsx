/**
 * AutomationEventLog - Granular execution logs with filtering
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search, Filter, Download, CheckCircle2, XCircle, AlertTriangle,
  Info, Clock, Terminal, RotateCcw
} from 'lucide-react';
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

const MOCK_LOGS: LogEntry[] = [
  { id: '1', timestamp: new Date(Date.now() - 5000).toISOString(), level: 'success', workflowName: 'Stock Alert', stepName: 'Vérifier stock', message: 'Stock vérifié: 3 unités restantes', executionId: 'exec-1', durationMs: 120 },
  { id: '2', timestamp: new Date(Date.now() - 4800).toISOString(), level: 'info', workflowName: 'Stock Alert', stepName: 'Évaluer condition', message: 'Condition stock < 10 → TRUE', executionId: 'exec-1', durationMs: 15 },
  { id: '3', timestamp: new Date(Date.now() - 4500).toISOString(), level: 'success', workflowName: 'Stock Alert', stepName: 'Notification', message: 'Email envoyé à admin@shop.com', executionId: 'exec-1', durationMs: 890 },
  { id: '4', timestamp: new Date(Date.now() - 60000).toISOString(), level: 'error', workflowName: 'Repricing', stepName: 'Calcul prix', message: 'Marge minimale non respectée: 8% < 15%', details: 'Product SKU-789: cost=42€, proposed_price=45.50€, margin=8.1%', executionId: 'exec-2', durationMs: 120 },
  { id: '5', timestamp: new Date(Date.now() - 59000).toISOString(), level: 'warning', workflowName: 'Repricing', stepName: 'Calcul prix', message: 'Retry 1/3 - Ajustement du prix avec marge de sécurité', executionId: 'exec-2' },
  { id: '6', timestamp: new Date(Date.now() - 58000).toISOString(), level: 'error', workflowName: 'Repricing', stepName: 'Calcul prix', message: 'Retry 2/3 échoué - Marge toujours insuffisante', executionId: 'exec-2' },
  { id: '7', timestamp: new Date(Date.now() - 120000).toISOString(), level: 'info', workflowName: 'Sync Fournisseur', stepName: 'Connexion API', message: 'Connexion établie avec BigBuy API v3', executionId: 'exec-3', durationMs: 340 },
  { id: '8', timestamp: new Date(Date.now() - 119000).toISOString(), level: 'success', workflowName: 'Sync Fournisseur', stepName: 'Fetch catalogue', message: '1,247 produits récupérés en 2.3s', executionId: 'exec-3', durationMs: 2300 },
  { id: '9', timestamp: new Date(Date.now() - 118000).toISOString(), level: 'warning', workflowName: 'Sync Fournisseur', stepName: 'Diff produits', message: '23 produits avec changement de prix détectés', executionId: 'exec-3', durationMs: 450 },
  { id: '10', timestamp: new Date(Date.now() - 300000).toISOString(), level: 'success', workflowName: 'Panier Abandonné', stepName: 'Relance email', message: '12 emails de relance envoyés', executionId: 'exec-4', durationMs: 1200 },
];

export function AutomationEventLog() {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [workflowFilter, setWorkflowFilter] = useState<string>('all');

  const workflowNames = useMemo(() => {
    const names = new Set(MOCK_LOGS.map(l => l.workflowName));
    return Array.from(names);
  }, []);

  const filteredLogs = useMemo(() => {
    return MOCK_LOGS.filter(log => {
      if (levelFilter !== 'all' && log.level !== levelFilter) return false;
      if (workflowFilter !== 'all' && log.workflowName !== workflowFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return log.message.toLowerCase().includes(q) ||
               log.workflowName.toLowerCase().includes(q) ||
               log.stepName.toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, levelFilter, workflowFilter]);

  const getLevelConfig = (level: string) => {
    switch (level) {
      case 'success': return { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' };
      case 'error': return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' };
      case 'warning': return { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' };
      default: return { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10' };
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const counts = {
    total: MOCK_LOGS.length,
    error: MOCK_LOGS.filter(l => l.level === 'error').length,
    warning: MOCK_LOGS.filter(l => l.level === 'warning').length,
    success: MOCK_LOGS.filter(l => l.level === 'success').length,
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Terminal className="h-5 w-5 text-primary" />
            Journal d'événements
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{counts.total} logs</Badge>
            {counts.error > 0 && <Badge variant="destructive" className="text-xs">{counts.error} erreurs</Badge>}
            <Button variant="outline" size="sm" className="h-7">
              <Download className="h-3 w-3 mr-1" /> Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher dans les logs..."
              className="h-8 pl-8 text-xs"
            />
          </div>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue placeholder="Niveau" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous niveaux</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Succès</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Erreur</SelectItem>
            </SelectContent>
          </Select>
          <Select value={workflowFilter} onValueChange={setWorkflowFilter}>
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue placeholder="Workflow" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous workflows</SelectItem>
              {workflowNames.map(name => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Log entries */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-1">
            {filteredLogs.map(log => {
              const config = getLevelConfig(log.level);
              const Icon = config.icon;
              return (
                <div
                  key={log.id}
                  className={cn(
                    "flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors text-xs",
                    log.level === 'error' && "bg-red-50/50 dark:bg-red-950/10"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", config.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-muted-foreground">{formatTime(log.timestamp)}</span>
                      <Badge variant="outline" className="text-[10px] h-4">{log.workflowName}</Badge>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">{log.stepName}</span>
                      {log.durationMs != null && (
                        <span className="text-muted-foreground font-mono">{log.durationMs}ms</span>
                      )}
                    </div>
                    <p className="mt-0.5">{log.message}</p>
                    {log.details && (
                      <p className="mt-1 font-mono text-[11px] text-muted-foreground bg-muted p-1.5 rounded">
                        {log.details}
                      </p>
                    )}
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
