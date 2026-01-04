import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export function LoadingSpinner({ className, size = 'md', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  )
}

interface PageLoadingProps {
  text?: string
}

export function PageLoading({ text = 'Chargement...' }: PageLoadingProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}

interface ButtonLoadingProps {
  children: React.ReactNode
  isLoading: boolean
  loadingText?: string
}

export function ButtonLoading({ children, isLoading, loadingText }: ButtonLoadingProps) {
  if (isLoading) {
    return (
      <>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        {loadingText || children}
      </>
    )
  }
  return <>{children}</>
}

interface SkeletonCardProps {
  className?: string
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-6 space-y-4 animate-pulse', className)}>
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-4 bg-muted rounded w-1/2" />
      <div className="h-20 bg-muted rounded" />
    </div>
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted/50 p-4 border-b">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-4 bg-muted rounded flex-1" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="p-4 border-b last:border-b-0 animate-pulse">
          <div className="flex gap-4">
            {Array.from({ length: cols }).map((_, colIdx) => (
              <div key={colIdx} className="h-4 bg-muted rounded flex-1" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
