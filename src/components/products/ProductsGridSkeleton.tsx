import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductsGridSkeletonProps {
  count?: number;
}

export function ProductsGridSkeleton({ count = 8 }: ProductsGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="p-0">
            <Skeleton className="aspect-square w-full rounded-t-lg shimmer" />
          </CardHeader>
          
          <CardContent className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-16" />
            </div>
            
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            
            <Skeleton className="h-6 w-full rounded" />
          </CardContent>
          
          <CardFooter className="p-4 pt-0 flex gap-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
