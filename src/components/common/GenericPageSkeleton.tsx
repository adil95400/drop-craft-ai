/**
 * Generic page skeleton loader
 * Reusable for any data-driven page (not just dashboard)
 */
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface GenericPageSkeletonProps {
  /** Number of stat cards to show */
  stats?: number;
  /** Number of list items to show */
  rows?: number;
  /** Show a chart placeholder */
  chart?: boolean;
  /** Variant */
  variant?: 'default' | 'table' | 'cards' | 'grid';
}

export function GenericPageSkeleton({ 
  stats = 4, rows = 5, chart = false, variant = 'default' 
}: GenericPageSkeletonProps) {
  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-300">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>

      {/* Stat cards */}
      {stats > 0 && (
        <div className={`grid grid-cols-2 lg:grid-cols-${Math.min(stats, 4)} gap-4`}>
          {Array.from({ length: stats }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-7 w-16" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Chart */}
      {chart && (
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-52 w-full rounded-lg" />
          </CardContent>
        </Card>
      )}

      {/* Content area */}
      {variant === 'cards' || variant === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: rows }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
