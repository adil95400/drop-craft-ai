import { memo, useCallback, useMemo } from 'react';
import { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface OptimizedCardProps {
  title: string;
  description?: string;
  value?: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'metric' | 'action' | 'minimal';
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  loading?: boolean;
}

export const OptimizedCard = memo(function OptimizedCard({
  title,
  description,
  value,
  trend = 'neutral',
  trendValue,
  icon: Icon,
  variant = 'default',
  className,
  onClick,
  children,
  loading = false,
}: OptimizedCardProps) {
  
  const trendColor = useMemo(() => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-50';
      case 'down':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-muted-foreground bg-muted';
    }
  }, [trend]);

  const cardVariants = useMemo(() => {
    const base = 'transition-all duration-200 hover:shadow-md';
    const variants = {
      default: 'border bg-card',
      metric: 'border bg-gradient-to-br from-card to-muted/20',
      action: 'border bg-card hover:border-primary/50 cursor-pointer',
      minimal: 'border-0 bg-transparent shadow-none',
    };
    return cn(base, variants[variant], className);
  }, [variant, className]);

  const handleClick = useCallback(() => {
    if (onClick && !loading) {
      onClick();
    }
  }, [onClick, loading]);

  if (loading) {
    return (
      <Card className={cardVariants}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          {Icon && <div className="h-4 w-4 bg-muted animate-pulse rounded" />}
        </CardHeader>
        <CardContent>
          <div className="h-7 w-16 bg-muted animate-pulse rounded mb-1" />
          <div className="h-3 w-32 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const CardComponent = onClick ? Button : Card;
  const cardProps = onClick 
    ? { 
        variant: 'ghost' as const, 
        className: cn(cardVariants, 'h-auto p-0 justify-start'),
        onClick: handleClick,
        disabled: loading
      }
    : { className: cardVariants, onClick: handleClick };

  const content = (
    <>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        {variant === 'metric' && value && (
          <div className="text-2xl font-bold">{value}</div>
        )}
        
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}

        {trendValue && (
          <Badge variant="secondary" className={cn('mt-2 text-xs', trendColor)}>
            {trend === 'up' && '↗'} 
            {trend === 'down' && '↘'} 
            {trendValue}
          </Badge>
        )}

        {children}
      </CardContent>
    </>
  );

  return onClick ? (
    <CardComponent {...cardProps}>
      <Card className="w-full">
        {content}
      </Card>
    </CardComponent>
  ) : (
    <CardComponent {...cardProps}>
      {content}
    </CardComponent>
  );
});

OptimizedCard.displayName = 'OptimizedCard';