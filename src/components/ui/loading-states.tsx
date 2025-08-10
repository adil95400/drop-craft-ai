import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }

  return (
    <div className={cn("animate-spin rounded-full border-2 border-muted border-t-primary", sizeClasses[size], className)} />
  )
}

interface LoadingCardProps {
  className?: string
  showImage?: boolean
}

export function LoadingCard({ className, showImage = true }: LoadingCardProps) {
  return (
    <Card className={cn("overflow-hidden animate-slide-up", className)}>
      <CardContent className="p-4 space-y-3">
        {showImage && (
          <Skeleton className="h-48 w-full rounded-lg bg-gradient-to-r from-muted to-muted/50" />
        )}
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4 bg-gradient-to-r from-muted to-muted/50" />
          <Skeleton className="h-4 w-1/2 bg-gradient-to-r from-muted to-muted/50" />
          <Skeleton className="h-4 w-2/3 bg-gradient-to-r from-muted to-muted/50" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-16 bg-gradient-to-r from-muted to-muted/50" />
          <Skeleton className="h-8 w-20 bg-gradient-to-r from-muted to-muted/50" />
        </div>
      </CardContent>
    </Card>
  )
}

interface LoadingGridProps {
  count?: number
  className?: string
  showImage?: boolean
}

export function LoadingGrid({ count = 6, className, showImage = true }: LoadingGridProps) {
  return (
    <div className={cn("grid gap-6 md:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-slide-up"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <LoadingCard showImage={showImage} />
        </div>
      ))}
    </div>
  )
}

interface LoadingTableProps {
  rows?: number
  columns?: number
  className?: string
}

export function LoadingTable({ rows = 5, columns = 4, className }: LoadingTableProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-0">
        <div className="space-y-0">
          {/* Header */}
          <div className="flex items-center gap-4 p-4 border-b bg-muted/30">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton 
                key={i} 
                className="h-4 flex-1 bg-gradient-to-r from-muted to-muted/50" 
              />
            ))}
          </div>
          
          {/* Rows */}
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div 
              key={rowIndex} 
              className="flex items-center gap-4 p-4 border-b animate-slide-up"
              style={{ animationDelay: `${rowIndex * 50}ms` }}
            >
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton 
                  key={colIndex} 
                  className="h-4 flex-1 bg-gradient-to-r from-muted to-muted/50" 
                />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface LoadingStatsProps {
  count?: number
  className?: string
}

export function LoadingStats({ count = 4, className }: LoadingStatsProps) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card 
          key={i}
          className="animate-slide-up"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 bg-gradient-to-r from-muted to-muted/50" />
                <Skeleton className="h-8 w-16 bg-gradient-to-r from-muted to-muted/50" />
              </div>
              <Skeleton className="h-8 w-8 rounded bg-gradient-to-r from-muted to-muted/50" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

interface PulsingDotProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function PulsingDot({ className, size = 'md' }: PulsingDotProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  return (
    <div className={cn("rounded-full bg-primary animate-pulse", sizeClasses[size], className)} />
  )
}

export function LoadingOverlay({ isLoading, children }: { isLoading: boolean; children: React.ReactNode }) {
  if (!isLoading) return <>{children}</>

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <LoadingSpinner size="sm" />
          <span className="text-sm font-medium">Chargement...</span>
        </div>
      </div>
    </div>
  )
}