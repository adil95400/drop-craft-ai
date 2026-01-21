'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  gradient?: string;
  onClick?: () => void;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
  hover: { y: -4, scale: 1.02 },
};

export function StatCard({
  label,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = 'text-primary',
  gradient,
  onClick,
  isLoading = false,
  size = 'md',
  className,
}: StatCardProps) {
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6',
  };

  const valueSizes = {
    sm: 'text-lg sm:text-xl',
    md: 'text-xl sm:text-2xl',
    lg: 'text-2xl sm:text-3xl',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const getTrendIcon = () => {
    if (change === undefined) return null;
    if (change > 0) return <TrendingUp className="h-3 w-3" />;
    if (change < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (change === undefined) return '';
    if (change > 0) return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800';
    if (change < 0) return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800';
    return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700';
  };

  if (isLoading) {
    return (
      <Card className={cn(sizeClasses[size], className)}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={onClick ? "hover" : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card
        className={cn(
          sizeClasses[size],
          'relative overflow-hidden transition-all duration-300',
          onClick && 'cursor-pointer hover:shadow-lg hover:border-primary/30',
          gradient && 'border-0',
          className
        )}
        onClick={onClick}
        style={gradient ? { background: gradient } : undefined}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-current" />
          <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-current" />
        </div>

        <CardContent className="p-0 relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div className={cn(
              'p-2.5 rounded-xl transition-transform',
              gradient ? 'bg-white/20' : 'bg-primary/10',
              iconColor
            )}>
              <Icon className={iconSizes[size]} />
            </div>
            {change !== undefined && (
              <Badge
                variant="outline"
                className={cn('gap-1 font-medium', getTrendColor())}
              >
                {getTrendIcon()}
                {change > 0 ? '+' : ''}{change.toFixed(1)}%
              </Badge>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-1"
          >
            <p className={cn('font-bold tracking-tight', valueSizes[size], gradient ? 'text-white' : 'text-foreground')}>
              {value}
            </p>
            <p className={cn('text-sm', gradient ? 'text-white/80' : 'text-muted-foreground')}>
              {label}
            </p>
            {changeLabel && (
              <p className={cn('text-xs', gradient ? 'text-white/60' : 'text-muted-foreground/80')}>
                {changeLabel}
              </p>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Grid component for stats
interface StatsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

export function StatsGrid({ children, columns = 4, className }: StatsGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.05 } }
      }}
      className={cn('grid gap-4', gridCols[columns], className)}
    >
      {children}
    </motion.div>
  );
}

// Compact stat for inline displays
interface CompactStatProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  change?: number;
  className?: string;
}

export function CompactStat({ label, value, icon: Icon, change, className }: CompactStatProps) {
  return (
    <div className={cn('flex items-center gap-3 p-3 rounded-lg bg-muted/50', className)}>
      {Icon && (
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-sm font-semibold truncate">{value}</p>
      </div>
      {change !== undefined && (
        <Badge variant="outline" className={cn(
          'text-xs',
          change > 0 ? 'text-emerald-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
        )}>
          {change > 0 ? '+' : ''}{change}%
        </Badge>
      )}
    </div>
  );
}
