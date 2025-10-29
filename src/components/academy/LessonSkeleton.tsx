import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function LessonSkeleton() {
  return (
    <div className="space-y-6">
      {/* Video skeleton */}
      <Card>
        <CardContent className="p-0">
          <div className="aspect-video bg-gradient-to-br from-muted via-accent/5 to-muted animate-pulse" />
        </CardContent>
      </Card>

      {/* Content skeleton */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex gap-3 pt-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
