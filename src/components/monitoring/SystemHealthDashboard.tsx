/**
 * Sprint 6: System Health & Monitoring Dashboard
 * Real-time performance and health metrics visualization
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import {
  Activity, Cpu, Clock, AlertTriangle, CheckCircle2,
  XCircle, Gauge, TrendingUp, Wifi, HardDrive
} from 'lucide-react';

function getVitalStatus(metric: string, value: number | null): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  if (value === null) return { label: 'N/A', variant: 'outline' };

  const thresholds: Record<string, [number, number]> = {
    lcp: [2500, 4000],
    fid: [100, 300],
    cls: [0.1, 0.25],
    fcp: [1800, 3000],
    ttfb: [800, 1800],
  };

  const [good, poor] = thresholds[metric] ?? [1000, 3000];
  if (value <= good) return { label: 'Bon', variant: 'default' };
  if (value <= poor) return { label: 'Moyen', variant: 'secondary' };
  return { label: 'Mauvais', variant: 'destructive' };
}

function formatMs(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SystemHealthDashboard() {
  const metrics = usePerformanceMonitoring(3000);

  const overallHealth = (() => {
    const { apiLatency, errorCount } = metrics;
    if (errorCount > 10 || apiLatency.successRate < 90) return 'critical';
    if (errorCount > 3 || apiLatency.successRate < 95 || apiLatency.p95 > 2000) return 'warning';
    return 'healthy';
  })();

  const healthColors = {
    healthy: 'text-primary',
    warning: 'text-accent-foreground',
    critical: 'text-destructive',
  };

  const healthIcons = {
    healthy: <CheckCircle2 className="h-5 w-5 text-primary" />,
    warning: <AlertTriangle className="h-5 w-5 text-accent-foreground" />,
    critical: <XCircle className="h-5 w-5 text-destructive" />,
  };

  const webVitals = [
    { key: 'lcp', label: 'LCP', value: metrics.lcp, unit: 'ms', desc: 'Largest Contentful Paint' },
    { key: 'fcp', label: 'FCP', value: metrics.fcp, unit: 'ms', desc: 'First Contentful Paint' },
    { key: 'ttfb', label: 'TTFB', value: metrics.ttfb, unit: 'ms', desc: 'Time to First Byte' },
    { key: 'cls', label: 'CLS', value: metrics.cls, unit: '', desc: 'Cumulative Layout Shift' },
  ];

  return (
    <div className="space-y-6">
      {/* Health Overview */}
      <div className="flex items-center gap-3">
        {healthIcons[overallHealth]}
        <div>
          <h2 className="text-lg font-semibold">Santé du Système</h2>
          <p className={`text-sm font-medium ${healthColors[overallHealth]}`}>
            {overallHealth === 'healthy' ? 'Tous les systèmes opérationnels' :
             overallHealth === 'warning' ? 'Dégradation de performance détectée' :
             'Problèmes critiques détectés'}
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wifi className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Requêtes API</span>
            </div>
            <p className="text-2xl font-bold">{metrics.apiLatency.totalRequests}</p>
            <p className="text-xs text-muted-foreground">{metrics.apiLatency.failedRequests} échouées</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Taux de succès</span>
            </div>
            <p className="text-2xl font-bold">{metrics.apiLatency.successRate}%</p>
            <Progress value={metrics.apiLatency.successRate} className="mt-1 h-1.5" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Latence P95</span>
            </div>
            <p className="text-2xl font-bold">{formatMs(metrics.apiLatency.p95)}</p>
            <p className="text-xs text-muted-foreground">Moy: {formatMs(metrics.apiLatency.avg)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Erreurs</span>
            </div>
            <p className="text-2xl font-bold">{metrics.errorCount}</p>
            <p className="text-xs text-muted-foreground">{metrics.warningCount} warnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Web Vitals */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Core Web Vitals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {webVitals.map(v => {
              const status = getVitalStatus(v.key, v.value);
              return (
                <div key={v.key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{v.label}</span>
                    <Badge variant={status.variant} className="text-[10px] px-1.5 py-0">
                      {status.label}
                    </Badge>
                  </div>
                  <p className="text-xl font-bold">
                    {v.key === 'cls' && v.value !== null ? v.value.toFixed(3) : formatMs(v.value)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Memory & Navigation */}
      <div className="grid md:grid-cols-2 gap-4">
        {metrics.memoryUsage && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Mémoire JS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Utilisation</span>
                    <span>{metrics.memoryUsage.usagePercent}%</span>
                  </div>
                  <Progress value={metrics.memoryUsage.usagePercent} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>Utilisé: {formatBytes(metrics.memoryUsage.usedJSHeapSize)}</div>
                  <div>Total: {formatBytes(metrics.memoryUsage.totalJSHeapSize)}</div>
                  <div>Limite: {formatBytes(metrics.memoryUsage.jsHeapSizeLimit)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {metrics.navigationTiming && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Navigation Timing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'DOM Content Loaded', value: metrics.navigationTiming.domContentLoaded },
                  { label: 'DOM Complete', value: metrics.navigationTiming.domComplete },
                  { label: 'Page Load', value: metrics.navigationTiming.loadComplete },
                  { label: 'DNS Lookup', value: metrics.navigationTiming.dnsLookup },
                  { label: 'TCP Connect', value: metrics.navigationTiming.tcpConnect },
                ].map(item => (
                  <div key={item.label} className="flex justify-between">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">{formatMs(item.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* API Latency Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Latence API (percentiles)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            {[
              { label: 'P50', value: metrics.apiLatency.p50 },
              { label: 'P95', value: metrics.apiLatency.p95 },
              { label: 'P99', value: metrics.apiLatency.p99 },
              { label: 'Moyenne', value: metrics.apiLatency.avg },
            ].map(p => (
              <div key={p.label}>
                <p className="text-xs text-muted-foreground mb-1">{p.label}</p>
                <p className="text-lg font-bold">{formatMs(p.value)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
