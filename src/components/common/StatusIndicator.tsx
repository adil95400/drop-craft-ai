import { memo, useMemo } from 'react';
import { AlertCircle, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusType = 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info' 
  | 'loading' 
  | 'pending'
  | 'neutral';

interface StatusIndicatorProps {
  status: StatusType;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'dot' | 'icon' | 'full';
  className?: string;
  animated?: boolean;
}

export const StatusIndicator = memo(function StatusIndicator({
  status,
  text,
  size = 'md',
  variant = 'badge',
  className,
  animated = true,
}: StatusIndicatorProps) {

  const statusConfig = useMemo(() => {
    const configs = {
      success: {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        badgeVariant: 'secondary' as const,
        dotColor: 'bg-green-500',
        label: 'Succès',
      },
      error: {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        badgeVariant: 'destructive' as const,
        dotColor: 'bg-red-500',
        label: 'Erreur',
      },
      warning: {
        icon: AlertCircle,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        badgeVariant: 'secondary' as const,
        dotColor: 'bg-yellow-500',
        label: 'Attention',
      },
      info: {
        icon: AlertCircle,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        badgeVariant: 'secondary' as const,
        dotColor: 'bg-blue-500',
        label: 'Info',
      },
      loading: {
        icon: Loader2,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        badgeVariant: 'secondary' as const,
        dotColor: 'bg-blue-500',
        label: 'Chargement',
      },
      pending: {
        icon: Clock,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        badgeVariant: 'secondary' as const,
        dotColor: 'bg-orange-500',
        label: 'En attente',
      },
      neutral: {
        icon: AlertCircle,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        badgeVariant: 'outline' as const,
        dotColor: 'bg-gray-500',
        label: 'Neutre',
      },
    };

    return configs[status];
  }, [status]);

  const sizeConfig = useMemo(() => {
    const configs = {
      sm: {
        icon: 'h-3 w-3',
        dot: 'h-2 w-2',
        text: 'text-xs',
        padding: 'px-2 py-1',
      },
      md: {
        icon: 'h-4 w-4',
        dot: 'h-3 w-3',
        text: 'text-sm',
        padding: 'px-3 py-1',
      },
      lg: {
        icon: 'h-5 w-5',
        dot: 'h-4 w-4',
        text: 'text-base',
        padding: 'px-4 py-2',
      },
    };

    return configs[size];
  }, [size]);

  const Icon = statusConfig.icon;
  const displayText = text || statusConfig.label;

  const iconClasses = cn(
    sizeConfig.icon,
    statusConfig.color,
    {
      'animate-spin': status === 'loading' && animated,
      'animate-pulse': (status === 'pending' || status === 'loading') && animated,
    }
  );

  const dotClasses = cn(
    sizeConfig.dot,
    'rounded-full',
    statusConfig.dotColor,
    {
      'animate-pulse': (status === 'pending' || status === 'loading') && animated,
    }
  );

  if (variant === 'badge') {
    return (
      <Badge
        variant={statusConfig.badgeVariant}
        className={cn(
          'gap-1.5 font-medium',
          statusConfig.color,
          statusConfig.bgColor,
          statusConfig.borderColor,
          sizeConfig.text,
          className
        )}
      >
        <Icon className={iconClasses} />
        {displayText}
      </Badge>
    );
  }

  if (variant === 'dot') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={dotClasses} />
        {displayText && (
          <span className={cn(sizeConfig.text, 'font-medium')}>
            {displayText}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'icon') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Icon className={iconClasses} />
        {displayText && (
          <span className={cn(sizeConfig.text, 'font-medium', statusConfig.color)}>
            {displayText}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={cn(
        'flex items-center gap-3 rounded-lg border p-3',
        statusConfig.bgColor,
        statusConfig.borderColor,
        sizeConfig.padding,
        className
      )}>
        <Icon className={iconClasses} />
        <span className={cn(sizeConfig.text, 'font-medium', statusConfig.color)}>
          {displayText}
        </span>
      </div>
    );
  }

  return null;
});

StatusIndicator.displayName = 'StatusIndicator';