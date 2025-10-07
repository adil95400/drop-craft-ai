import { memo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePerformanceStore } from '@/stores/performanceStore';
import { useCacheStore } from '@/stores/cacheStore';
import { Activity, Zap, Database, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerformanceMonitorWidgetProps {
  compact?: boolean;
  showAlerts?: boolean;
  className?: string;
}

export const PerformanceMonitorWidget = memo(function PerformanceMonitorWidget({
  compact = false,
  showAlerts = true,
  className,
}: PerformanceMonitorWidgetProps) {
  const { metrics, alerts, isMonitoring } = usePerformanceStore();
  const { stats } = useCacheStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Afficher seulement en dev ou si explicitement activé
    const isDev = import.meta.env.DEV;
    setIsVisible(isDev || isMonitoring);
  }, [isMonitoring]);

  if (!isVisible) return null;

  const getMetricStatus = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'critical';
    if (value >= thresholds.warning) return 'warning';
    return 'good';
  };

  const getStatusColor = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'critical':
        return 'text-red-500';
    }
  };

  const getStatusIcon = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 text-sm', className)}>
        <Activity className="h-4 w-4 text-primary animate-pulse" />
        <span className="font-mono">{Math.round(metrics.fps)} FPS</span>
        <Database className="h-4 w-4 text-primary" />
        <span className="font-mono">{stats.hitRate.toFixed(0)}%</span>
        {alerts.length > 0 && (
          <Badge variant="destructive" className="h-5 px-1 text-xs">
            {alerts.length}
          </Badge>
        )}
      </div>
    );
  }

  const fpsStatus = getMetricStatus(metrics.fps, { warning: 30, critical: 15 });
  const memoryStatus = getMetricStatus(metrics.memoryUsage, { warning: 100, critical: 200 });
  const cacheStatus = getMetricStatus(100 - stats.hitRate, { warning: 50, critical: 70 });

  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Performance Monitor
          </CardTitle>
          <Badge variant={isMonitoring ? 'default' : 'secondary'}>
            {isMonitoring ? 'Active' : 'Standby'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* FPS */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className={cn('font-medium', getStatusColor(fpsStatus))}>
                {getStatusIcon(fpsStatus)}
              </span>
              FPS
            </span>
            <span className="font-mono font-medium">{Math.round(metrics.fps)}</span>
          </div>
          <Progress value={(metrics.fps / 60) * 100} className="h-1" />
        </div>

        {/* Memory */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className={cn('font-medium', getStatusColor(memoryStatus))}>
                {getStatusIcon(memoryStatus)}
              </span>
              Memory
            </span>
            <span className="font-mono font-medium">{metrics.memoryUsage.toFixed(1)} MB</span>
          </div>
          <Progress value={(metrics.memoryUsage / 200) * 100} className="h-1" />
        </div>

        {/* Cache Hit Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className={cn('font-medium', getStatusColor(cacheStatus))}>
                {getStatusIcon(cacheStatus)}
              </span>
              Cache Hit Rate
            </span>
            <span className="font-mono font-medium">{stats.hitRate.toFixed(1)}%</span>
          </div>
          <Progress value={stats.hitRate} className="h-1" />
        </div>

        {/* Connections */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Active Connections</span>
            <span className="font-mono font-medium">{metrics.activeConnections}</span>
          </div>
        </div>

        {/* Cache Stats */}
        <div className="pt-2 border-t">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-muted-foreground">Cache Entries</div>
              <div className="font-mono font-medium">{stats.totalEntries}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Cache Size</div>
              <div className="font-mono font-medium">
                {(stats.totalSize / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {showAlerts && alerts.length > 0 && (
          <div className="pt-2 border-t space-y-2">
            <div className="text-sm font-medium">Alertes Récentes</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {alerts.slice(-3).map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'text-xs p-2 rounded-md flex items-start gap-2',
                    alert.type === 'critical' && 'bg-red-500/10 text-red-500',
                    alert.type === 'warning' && 'bg-yellow-500/10 text-yellow-500',
                    alert.type === 'error' && 'bg-orange-500/10 text-orange-500'
                  )}
                >
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                  <span className="flex-1">{alert.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

PerformanceMonitorWidget.displayName = 'PerformanceMonitorWidget';
