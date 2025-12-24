import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  text?: string
  className?: string
  fullScreen?: boolean
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
}

const textSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
}

export function LoadingSpinner({ 
  size = "md", 
  text, 
  className,
  fullScreen = false 
}: LoadingSpinnerProps) {
  const content = (
    <div className={cn(
      "flex flex-col items-center justify-center gap-3",
      fullScreen && "min-h-screen",
      className
    )}>
      <Loader2 className={cn(
        "animate-spin text-primary",
        sizeClasses[size]
      )} />
      {text && (
        <p className={cn(
          "text-muted-foreground animate-pulse",
          textSizeClasses[size]
        )}>
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    )
  }

  return content
}

// Composant pour overlay de chargement sur un conteneur
export function LoadingOverlay({ 
  isLoading, 
  text = "Chargement...",
  children 
}: { 
  isLoading: boolean
  text?: string
  children: React.ReactNode 
}) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm rounded-lg">
          <LoadingSpinner size="lg" text={text} />
        </div>
      )}
    </div>
  )
}

// Skeleton pour les listes
export function LoadingSkeleton({ 
  rows = 3,
  className 
}: { 
  rows?: number
  className?: string 
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 animate-pulse">
          <div className="h-12 w-12 bg-muted rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Skeleton pour les cards
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "rounded-lg border bg-card p-6 space-y-4 animate-pulse",
      className
    )}>
      <div className="h-4 bg-muted rounded w-2/3" />
      <div className="h-8 bg-muted rounded w-1/3" />
      <div className="h-3 bg-muted rounded w-full" />
    </div>
  )
}

// Grid de skeleton cards
export function CardSkeletonGrid({ 
  count = 4,
  className 
}: { 
  count?: number
  className?: string 
}) {
  return (
    <div className={cn(
      "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
      className
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}
