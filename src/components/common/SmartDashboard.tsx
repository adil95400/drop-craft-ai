import { memo, useCallback, useMemo } from 'react';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { OptimizedSkeleton } from '@/components/common/OptimizedSkeleton';
import { StatusIndicator } from '@/components/common/StatusIndicator';
import { cn } from '@/lib/utils';

interface MetricCardData {
  id: string;
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    period: string;
  };
  target?: {
    current: number;
    goal: number;
  };
  status?: 'success' | 'warning' | 'error' | 'neutral';
  trend?: number[];
}

interface SmartDashboardProps {
  title?: string;
  subtitle?: string;
  metrics: MetricCardData[];
  layout?: 'grid' | 'list';
  loading?: boolean;
  className?: string;
  onMetricClick?: (metric: MetricCardData) => void;
}

const MetricCard = memo(function MetricCard({ 
  metric, 
  layout, 
  onClick 
}: { 
  metric: MetricCardData; 
  layout: 'grid' | 'list';
  onClick?: (metric: MetricCardData) => void;
}) {
  const handleClick = useCallback(() => {
    onClick?.(metric);
  }, [onClick, metric]);

  const changeColor = useMemo(() => {
    if (!metric.change) return 'text-muted-foreground';
    
    switch (metric.change.type) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  }, [metric.change]);

  const changeIcon = useMemo(() => {
    if (!metric.change) return '';
    
    switch (metric.change.type) {
      case 'increase':
        return '↗';
      case 'decrease':
        return '↘';
      default:
        return '→';
    }
  }, [metric.change]);

  return (
    <Card 
      className={cn(
        'p-6 transition-all duration-200 hover:shadow-md',
        onClick && 'cursor-pointer hover:border-primary/50',
        layout === 'list' && 'flex flex-row items-center justify-between'
      )}
      onClick={handleClick}
    >
      <div className={cn(
        'space-y-2',
        layout === 'list' && 'space-y-0'
      )}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">
            {metric.title}
          </h3>
          {metric.status && (
            <StatusIndicator 
              status={metric.status} 
              variant="dot" 
              size="sm" 
            />
          )}
        </div>
        
        <div className="flex items-end gap-2">
          <div className="text-2xl font-bold">
            {metric.value}
          </div>
          
          {metric.change && (
            <Badge variant="secondary" className={cn('text-xs', changeColor)}>
              {changeIcon} {Math.abs(metric.change.value)}%
            </Badge>
          )}
        </div>

        {metric.target && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progression</span>
              <span>{metric.target.current}/{metric.target.goal}</span>
            </div>
            <Progress 
              value={(metric.target.current / metric.target.goal) * 100} 
              className="h-2"
            />
          </div>
        )}

        {metric.change && (
          <p className="text-xs text-muted-foreground">
            {metric.change.period}
          </p>
        )}
      </div>
    </Card>
  );
});

export const SmartDashboard = memo(function SmartDashboard({
  title = 'Dashboard',
  subtitle,
  metrics,
  layout = 'grid',
  loading = false,
  className,
  onMetricClick,
}: SmartDashboardProps) {

  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="space-y-2">
          <OptimizedSkeleton variant="card" count={1} className="h-8 w-48" />
          {subtitle && <OptimizedSkeleton variant="card" count={1} className="h-4 w-64" />}
        </div>
        
        <OptimizedSkeleton 
          variant={layout === 'grid' ? 'grid' : 'list'} 
          count={metrics.length || 4} 
        />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* Metrics Grid */}
      <div className={cn(
        'gap-6',
        layout === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          : 'space-y-4'
      )}>
        {metrics.map((metric) => (
          <MetricCard
            key={metric.id}
            metric={metric}
            layout={layout}
            onClick={onMetricClick}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm">
          Exporter les données
        </Button>
        <Button variant="outline" size="sm">
          Configurer les alertes
        </Button>
        <Button variant="outline" size="sm">
          Planifier un rapport
        </Button>
      </div>
    </div>
  );
});

SmartDashboard.displayName = 'SmartDashboard';