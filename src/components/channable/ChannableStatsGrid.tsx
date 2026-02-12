/**
 * Grille de statistiques style Channable
 */

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { ChannableStat } from './types'

interface ChannableStatsGridProps {
  stats: ChannableStat[]
  columns?: 2 | 3 | 4 | 5 | 6
  className?: string
  compact?: boolean
}

const colorClasses = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-green-500/10 text-green-600 dark:text-green-400',
  warning: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  destructive: 'bg-destructive/10 text-destructive',
  info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
}

export function ChannableStatsGrid({ 
  stats, 
  columns = 4, 
  className,
  compact = false 
}: ChannableStatsGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  }

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {stats.map((stat, index) => {
        const Icon = stat.icon
        const TrendIcon = stat.trend === 'up' ? TrendingUp : stat.trend === 'down' ? TrendingDown : Minus
        const color = stat.color || 'primary'

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card 
              className={cn(
                "relative overflow-hidden hover:shadow-lg transition-shadow duration-300",
                stat.onClick && "cursor-pointer hover:border-primary/30"
              )}
              onClick={stat.onClick}
            >
              {/* Gradient accent */}
              <div className={cn(
                "absolute top-0 left-0 w-1 h-full",
                color === 'primary' && "bg-primary",
                color === 'success' && "bg-green-500",
                color === 'warning' && "bg-yellow-500",
                color === 'destructive' && "bg-destructive",
                color === 'info' && "bg-blue-500"
              )} />

              <CardContent className={cn("pt-4", compact ? "p-4" : "p-6")}>
                <div className="flex items-start justify-between">
                  <div className={cn(
                    "rounded-lg flex items-center justify-center flex-shrink-0",
                    compact ? "h-10 w-10" : "h-12 w-12",
                    colorClasses[color]
                  )}>
                    <Icon className={cn(compact ? "h-5 w-5" : "h-6 w-6")} />
                  </div>

                  {stat.change !== undefined && (
                    <div className={cn(
                      "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                      stat.trend === 'up' && "bg-green-500/10 text-green-600 dark:text-green-400",
                      stat.trend === 'down' && "bg-red-500/10 text-red-600 dark:text-red-400",
                      stat.trend === 'neutral' && "bg-muted text-muted-foreground"
                    )}>
                      <TrendIcon className="h-3 w-3" />
                      {stat.change > 0 ? '+' : ''}{typeof stat.change === 'number' ? stat.change.toFixed(1) : stat.change}%
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <p className={cn(
                    "font-bold tracking-tight",
                    compact ? "text-2xl" : "text-3xl"
                  )}>
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {stat.label}
                  </p>
                  {stat.changeLabel && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.changeLabel}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
