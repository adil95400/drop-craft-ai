/**
 * Consistent Skeleton System
 * Unified skeleton loaders for the entire application
 */
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// Base skeleton with shimmer animation
interface SkeletonBaseProps {
  className?: string;
  animate?: boolean;
}

// Card skeleton
interface CardSkeletonProps extends SkeletonBaseProps {
  showHeader?: boolean;
  showFooter?: boolean;
  lines?: number;
  showChart?: boolean;
  showImage?: boolean;
}

export function CardSkeleton({
  className,
  animate = true,
  showHeader = true,
  showFooter = false,
  lines = 3,
  showChart = false,
  showImage = false,
}: CardSkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-4 space-y-4',
        animate && 'animate-pulse',
        className
      )}
    >
      {showHeader && (
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
      )}

      {showImage && <Skeleton className="h-40 w-full rounded-lg" />}

      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn('h-4', i === lines - 1 ? 'w-3/4' : 'w-full')}
          />
        ))}
      </div>

      {showChart && <Skeleton className="h-32 w-full rounded-lg" />}

      {showFooter && (
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      )}
    </div>
  );
}

// Widget skeleton (dashboard)
export function WidgetSkeleton({ className, animate = true }: SkeletonBaseProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-4 min-h-[200px] space-y-4',
        animate && 'animate-pulse',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-[100px] w-full rounded-lg" />
    </div>
  );
}

// Table row skeleton
interface TableRowSkeletonProps extends SkeletonBaseProps {
  columns?: number;
  showCheckbox?: boolean;
  showActions?: boolean;
}

export function TableRowSkeleton({
  className,
  animate = true,
  columns = 5,
  showCheckbox = true,
  showActions = true,
}: TableRowSkeletonProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 border-b border-border',
        animate && 'animate-pulse',
        className
      )}
    >
      {showCheckbox && <Skeleton className="h-4 w-4 rounded" />}
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4 flex-1', i === 0 && 'max-w-[200px]')}
        />
      ))}
      {showActions && <Skeleton className="h-8 w-8 rounded-md" />}
    </div>
  );
}

// Table skeleton
interface TableSkeletonProps extends SkeletonBaseProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({
  className,
  animate = true,
  rows = 5,
  columns = 5,
}: TableSkeletonProps) {
  return (
    <div className={cn('rounded-xl border border-border overflow-hidden', className)}>
      {/* Header */}
      <div className={cn('flex items-center gap-4 p-4 bg-muted/50 border-b border-border', animate && 'animate-pulse')}>
        <Skeleton className="h-4 w-4 rounded" />
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
        <Skeleton className="h-4 w-16" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} columns={columns} animate={animate} />
      ))}
    </div>
  );
}

// Stats grid skeleton
interface StatsGridSkeletonProps extends SkeletonBaseProps {
  count?: number;
}

export function StatsGridSkeleton({
  className,
  animate = true,
  count = 4,
}: StatsGridSkeletonProps) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'p-4 rounded-xl border border-border bg-card space-y-3',
            animate && 'animate-pulse'
          )}
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

// Product card skeleton
export function ProductCardSkeleton({ className, animate = true }: SkeletonBaseProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card overflow-hidden',
        animate && 'animate-pulse',
        className
      )}
    >
      <Skeleton className="h-48 w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>
    </div>
  );
}

// List item skeleton
export function ListItemSkeleton({ className, animate = true }: SkeletonBaseProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 p-3 rounded-lg',
        animate && 'animate-pulse',
        className
      )}
    >
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

// Dashboard page skeleton
export function DashboardSkeleton({ className }: SkeletonBaseProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <StatsGridSkeleton />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <WidgetSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// Form skeleton
export function FormSkeleton({ className, animate = true }: SkeletonBaseProps) {
  return (
    <div className={cn('space-y-6', animate && 'animate-pulse', className)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
    </div>
  );
}

// Timeline skeleton
export function TimelineSkeleton({
  className,
  animate = true,
  steps = 4,
}: SkeletonBaseProps & { steps?: number }) {
  return (
    <div className={cn('space-y-4', animate && 'animate-pulse', className)}>
      {Array.from({ length: steps }).map((_, i) => (
        <div key={i} className="flex items-start gap-4">
          <div className="flex flex-col items-center">
            <Skeleton className="h-8 w-8 rounded-full" />
            {i < steps - 1 && <Skeleton className="h-12 w-0.5" />}
          </div>
          <div className="flex-1 space-y-2 pb-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}
