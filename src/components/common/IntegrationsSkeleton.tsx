import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export const IntegrationsSkeleton = () => {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="bg-muted/20 border rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        <Skeleton className="h-8 w-64 mb-2" />
      </div>

      {/* Connected Integrations Skeleton */}
      <div className="mb-8">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-5 h-5 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Platforms Grid Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-12">
        {Array.from({ length: 12 }).map((_, i) => (
          <Card key={i} className="border">
            <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
              <Skeleton className="w-16 h-16" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Technical Files Section */}
      <div className="space-y-6">
        <Skeleton className="h-6 w-80" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="border">
              <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                <Skeleton className="w-16 h-16" />
                <Skeleton className="h-4 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}