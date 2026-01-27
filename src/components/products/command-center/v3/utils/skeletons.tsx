/**
 * Command Center V3 - Shared Skeleton Components
 * Consistent loading states across all V3 panels
 */

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("rounded bg-muted animate-pulse", className)} />
  )
}

// Panel skeleton with header and content
export function PanelSkeleton({ 
  rows = 3, 
  className 
}: { 
  rows?: number
  className?: string 
}) {
  return (
    <div className={cn("rounded-xl border border-border/50 bg-card/50 p-4", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-5 w-5 rounded-lg" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

// Grid skeleton for ROI dashboard
export function GridSkeleton({ 
  cols = 2, 
  rows = 2,
  className 
}: { 
  cols?: number
  rows?: number
  className?: string 
}) {
  return (
    <div className={cn("rounded-xl border border-border/50 bg-card/50 p-4", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-5 w-5 rounded-lg" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className={cn("grid gap-4", `grid-cols-${cols}`)}>
        {Array.from({ length: cols * rows }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

// Priority cards skeleton
export function PriorityCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-xl border border-border/50 bg-card/50 p-4"
        >
          <div className="flex items-start gap-3 mb-4">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-8 w-full rounded-lg" />
        </motion.div>
      ))}
    </div>
  )
}

// KPI bar skeleton
export function KPIBarSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border border-border/50 bg-card/50">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-2 w-24" />
        </div>
      ))}
    </div>
  )
}

// Header skeleton
export function HeaderSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/50">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>
    </div>
  )
}

// Empty state component
interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  variant?: 'success' | 'neutral'
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  variant = 'neutral' 
}: EmptyStateProps) {
  const bgClass = variant === 'success' 
    ? 'bg-gradient-to-br from-emerald-500/5 to-emerald-600/10' 
    : 'bg-muted/30'
  
  const iconBgClass = variant === 'success'
    ? 'bg-emerald-500/10'
    : 'bg-muted'
  
  const iconClass = variant === 'success'
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-muted-foreground'

  return (
    <motion.div 
      className={cn("rounded-xl border border-border/50 p-6 text-center", bgClass)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={cn("inline-flex items-center justify-center w-12 h-12 rounded-full mb-3", iconBgClass)}>
        <Icon className={cn("h-6 w-6", iconClass)} />
      </div>
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </motion.div>
  )
}
