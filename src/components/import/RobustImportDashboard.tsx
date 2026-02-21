/**
 * RobustImportDashboard - P5 Pipeline Import Robuste
 * Real-time progress, per-line error reporting, granular retry
 */
import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Upload, RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle,
  RotateCcw, ChevronLeft, ChevronRight, Filter, FileText, Zap,
} from 'lucide-react';
import {
  usePipelineJobStatus, usePipelineJobItems, useRetryItems, useStartImport,
  PipelineJobItem,
} from '@/hooks/useRobustImport';

// ── Status helpers ───────────────────────────────────────────────────────────
function statusIcon(s: string) {
  switch (s) {
    case 'success': return <CheckCircle2 className="h-4 w-4 text-primary" />;
    case 'failed': return <XCircle className="h-4 w-4 text-destructive" />;
    case 'retrying': return <RotateCcw className="h-4 w-4 text-accent-foreground animate-spin" />;
    case 'pending': return <Clock className="h-4 w-4 text-muted-foreground" />;
    default: return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    success: 'Succès', failed: 'Échec', retrying: 'Relance', pending: 'En attente',
    processing: 'En cours', completed: 'Terminé',
  };
  return map[s] || s;
}

function statusVariant(s: string): 'default' | 'destructive' | 'secondary' | 'outline' {
  switch (s) {
    case 'success': case 'completed': return 'default';
    case 'failed': return 'destructive';
    case 'retrying': case 'processing': return 'secondary';
    default: return 'outline';
  }
}

// ── Progress Panel ───────────────────────────────────────────────────────────
function JobProgressPanel({ jobId }: { jobId: string }) {
  const { data: status, isLoading } = usePipelineJobStatus(jobId);

  if (isLoading || !status) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
          Chargement du statut...
        </CardContent>
      </Card>
    );
  }

  const isActive = status.status === 'processing';
  const isDone = status.status === 'completed' || status.status === 'failed';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {isActive && <RefreshCw className="h-5 w-5 animate-spin text-primary" />}
            {status.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            {status.status === 'failed' && <XCircle className="h-5 w-5 text-destructive" />}
            Import {status.job_id.slice(0, 8)}
          </CardTitle>
          <Badge variant={statusVariant(status.status)}>{statusLabel(status.status)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{status.progress_percent}% traité</span>
            <span>{status.stats.success + status.stats.failed}/{status.stats.total}</span>
          </div>
          <Progress value={status.progress_percent} className="h-3" />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total" value={status.stats.total} icon={<FileText className="h-4 w-4" />} />
          <StatCard label="Succès" value={status.stats.success} icon={<CheckCircle2 className="h-4 w-4 text-primary" />} variant="success" />
          <StatCard label="Échecs" value={status.stats.failed} icon={<XCircle className="h-4 w-4 text-destructive" />} variant="error" />
          <StatCard label="En attente" value={status.stats.pending + status.stats.retrying} icon={<Clock className="h-4 w-4 text-accent-foreground" />} />
        </div>

        {/* Timing */}
        {isDone && (
          <div className="text-xs text-muted-foreground flex gap-4">
            <span>Démarré: {new Date(status.started_at).toLocaleString('fr-FR')}</span>
            {status.completed_at && <span>Terminé: {new Date(status.completed_at).toLocaleString('fr-FR')}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value, icon, variant }: { label: string; value: number; icon: React.ReactNode; variant?: string }) {
  return (
    <div className="p-3 rounded-lg border bg-card text-center">
      <div className="flex items-center justify-center gap-1 mb-1">{icon}</div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

// ── Items Table ──────────────────────────────────────────────────────────────
function JobItemsTable({ jobId }: { jobId: string }) {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const perPage = 30;

  const { data, isLoading } = usePipelineJobItems(jobId, page, perPage, filter);
  const { mutate: retryItems, isPending: isRetrying } = useRetryItems();

  const items: PipelineJobItem[] = data?.items || [];
  const total = data?.meta?.total || 0;
  const totalPages = Math.ceil(total / perPage);

  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAllFailed = useCallback(() => {
    setSelected(new Set(items.filter(i => i.status === 'failed').map(i => i.id)));
  }, [items]);

  const handleRetrySelected = () => {
    if (selected.size === 0) return;
    retryItems({ jobId, itemIds: Array.from(selected) });
    setSelected(new Set());
  };

  const handleRetryAllFailed = () => {
    retryItems({ jobId, retryAllFailed: true });
    setSelected(new Set());
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Détail par ligne ({total} éléments)
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            {/* Filter tabs */}
            <div className="flex rounded-md border overflow-hidden text-sm">
              {['all', 'success', 'failed', 'pending', 'retrying'].map(f => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setPage(1); }}
                  className={`px-3 py-1.5 transition-colors ${filter === f ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                >
                  {f === 'all' ? 'Tous' : statusLabel(f)}
                </button>
              ))}
            </div>
            {/* Retry actions */}
            <Button size="sm" variant="outline" onClick={selectAllFailed} className="gap-1">
              <AlertTriangle className="h-3 w-3" /> Sélectionner échecs
            </Button>
            <Button
              size="sm" variant="outline" onClick={handleRetrySelected}
              disabled={selected.size === 0 || isRetrying} className="gap-1"
            >
              <RotateCcw className="h-3 w-3" /> Relancer ({selected.size})
            </Button>
            <Button
              size="sm" onClick={handleRetryAllFailed}
              disabled={isRetrying} className="gap-1"
            >
              <Zap className="h-3 w-3" /> Relancer tous les échecs
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[500px]">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
              Chargement...
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun élément {filter !== 'all' ? `avec le statut "${statusLabel(filter)}"` : ''}
            </div>
          ) : (
            <div className="space-y-1">
              {/* Header */}
              <div className="grid grid-cols-[32px_60px_1fr_120px_80px_1fr] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                <span></span>
                <span>Ligne</span>
                <span>Produit</span>
                <span>Statut</span>
                <span>Retry</span>
                <span>Erreur</span>
              </div>
              {items.map(item => (
                <div
                  key={item.id}
                  className={`grid grid-cols-[32px_60px_1fr_120px_80px_1fr] gap-2 px-3 py-2 text-sm rounded-md items-center
                    ${item.status === 'failed' ? 'bg-destructive/5' : ''}
                    ${selected.has(item.id) ? 'ring-1 ring-primary bg-primary/5' : 'hover:bg-muted/50'}
                  `}
                >
                  <Checkbox
                    checked={selected.has(item.id)}
                    onCheckedChange={() => toggleSelect(item.id)}
                    disabled={item.status !== 'failed'}
                  />
                  <span className="font-mono text-xs">#{item.line_number}</span>
                  <span className="truncate font-medium">
                    {item.raw_data?.title || item.raw_data?.name || '—'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {statusIcon(item.status)}
                    <Badge variant={statusVariant(item.status)} className="text-xs">
                      {statusLabel(item.status)}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {item.retry_count > 0 ? `×${item.retry_count}` : '—'}
                  </span>
                  <span className="text-xs text-destructive truncate" title={item.error_message || ''}>
                    {item.error_message || '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t">
            <span className="text-sm text-muted-foreground">
              Page {page}/{totalPages}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export function RobustImportDashboard() {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const { mutate: startImport, isPending: isStarting, data: startResult } = useStartImport();

  // Auto-set active job when a new import starts
  const jobId = activeJobId || (startResult as any)?.job_id || null;

  const handleDemoImport = () => {
    // Demo: start a small import to test the pipeline
    const demoItems = [
      { title: 'Produit Test 1', price: 29.99, sku: 'DEMO-001', category: 'Test', stock_quantity: 10 },
      { title: 'Produit Test 2', price: 49.99, sku: 'DEMO-002', category: 'Test', stock_quantity: 5 },
      { title: '', price: -1, sku: '', category: '' }, // Intentionally invalid for demo
      { title: 'Produit Test 4', price: 19.99, sku: 'DEMO-004', category: 'Test', stock_quantity: 20 },
    ];
    startImport({ items: demoItems, source: 'csv' }, {
      onSuccess: (data: any) => setActiveJobId(data.job_id),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Pipeline Import Robuste
          </h3>
          <p className="text-sm text-muted-foreground">
            Suivi temps réel • Erreurs par ligne • Retry granulaire
          </p>
        </div>
        <Button onClick={handleDemoImport} disabled={isStarting} className="gap-2">
          {isStarting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          Test Pipeline
        </Button>
      </div>

      {jobId ? (
        <Tabs defaultValue="progress" className="space-y-4">
          <TabsList>
            <TabsTrigger value="progress">Progression</TabsTrigger>
            <TabsTrigger value="items">Détail par ligne</TabsTrigger>
          </TabsList>
          <TabsContent value="progress">
            <JobProgressPanel jobId={jobId} />
          </TabsContent>
          <TabsContent value="items">
            <JobItemsTable jobId={jobId} />
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Upload className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium mb-1">Aucun import actif</p>
            <p className="text-sm">Lancez un import CSV, URL ou API pour suivre la progression en temps réel</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
