/**
 * Lazy loading wrapper for Recharts components
 * This ensures recharts (~100KB) is only loaded when charts are actually rendered
 */
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Chart loading skeleton
export const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <div className="w-full animate-pulse" style={{ height }}>
    <Skeleton className="w-full h-full rounded-lg" />
  </div>
);

// Type for chart props
interface LazyChartProps {
  children: React.ReactNode;
  height?: number;
}

/**
 * Wrapper component that lazily loads charts
 * Use this to wrap any chart content that uses recharts
 */
export function LazyChart({ children, height = 300 }: LazyChartProps) {
  return (
    <Suspense fallback={<ChartSkeleton height={height} />}>
      {children}
    </Suspense>
  );
}
