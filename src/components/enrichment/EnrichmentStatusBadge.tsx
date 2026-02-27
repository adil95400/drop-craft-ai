import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Clock, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnrichmentStatusBadgeProps {
  status: 'none' | 'pending' | 'in_progress' | 'success' | 'failed' | 'applied';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const statusConfig = {
  none: {
    label: 'Non enrichi',
    icon: AlertCircle,
    variant: 'secondary' as const,
    className: 'bg-muted text-muted-foreground',
  },
  pending: {
    label: 'En attente',
    icon: Clock,
    variant: 'outline' as const,
    className: 'border-warning/50 text-warning',
  },
  in_progress: {
    label: 'En cours',
    icon: Loader2,
    variant: 'outline' as const,
    className: 'border-info/50 text-info',
  },
  success: {
    label: 'Enrichi',
    icon: Sparkles,
    variant: 'default' as const,
    className: 'bg-success/10 text-success border-success/30',
  },
  failed: {
    label: 'Échec',
    icon: XCircle,
    variant: 'destructive' as const,
    className: 'bg-destructive/10 text-destructive',
  },
  applied: {
    label: 'Appliqué',
    icon: CheckCircle,
    variant: 'default' as const,
    className: 'bg-primary/10 text-primary border-primary/30',
  },
};

export function EnrichmentStatusBadge({ 
  status, 
  size = 'md', 
  showLabel = true 
}: EnrichmentStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.none;
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };
  
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <Badge 
      variant={config.variant}
      className={cn(sizeClasses[size], config.className, 'gap-1')}
    >
      <Icon className={cn(
        iconSizes[size],
        status === 'in_progress' && 'animate-spin'
      )} />
      {showLabel && <span>{config.label}</span>}
    </Badge>
  );
}
