/**
 * Carte d'action du Command Center
 * Affiche un KPI avec action rapide
 */

import { motion } from 'framer-motion'
import { LucideIcon, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { ActionCardVariant } from './types'

interface ActionCardProps {
  label: string
  sublabel: string
  count: number
  icon: LucideIcon
  variant: ActionCardVariant
  tooltip: string
  cta: string
  onClick: () => void
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
  isLoading?: boolean
}

const variantStyles: Record<ActionCardVariant, {
  bg: string
  border: string
  text: string
  iconBg: string
}> = {
  destructive: {
    bg: 'bg-red-500/10 hover:bg-red-500/15',
    border: 'border-red-500/30',
    text: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-500/20'
  },
  warning: {
    bg: 'bg-orange-500/10 hover:bg-orange-500/15',
    border: 'border-orange-500/30',
    text: 'text-orange-600 dark:text-orange-400',
    iconBg: 'bg-orange-500/20'
  },
  info: {
    bg: 'bg-blue-500/10 hover:bg-blue-500/15',
    border: 'border-blue-500/30',
    text: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-500/20'
  },
  primary: {
    bg: 'bg-purple-500/10 hover:bg-purple-500/15',
    border: 'border-purple-500/30',
    text: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-500/20'
  },
  muted: {
    bg: 'bg-muted/50 hover:bg-muted/70',
    border: 'border-muted-foreground/20',
    text: 'text-muted-foreground',
    iconBg: 'bg-muted-foreground/20'
  }
}

export function ActionCard({
  label,
  sublabel,
  count,
  icon: Icon,
  variant,
  tooltip,
  cta,
  onClick,
  trend,
  isLoading = false
}: ActionCardProps) {
  const styles = variantStyles[variant]
  
  if (isLoading) {
    return (
      <div className="p-4 rounded-xl border bg-card">
        <Skeleton className="h-10 w-10 rounded-lg mb-3" />
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-4 w-24" />
      </div>
    )
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={onClick}
            className={cn(
              'relative p-4 rounded-xl border transition-all duration-200',
              'text-left w-full group cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-primary/50',
              styles.bg,
              styles.border
            )}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Icon */}
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center mb-3',
              styles.iconBg
            )}>
              <Icon className={cn('h-5 w-5', styles.text)} />
            </div>
            
            {/* Count */}
            <div className="flex items-end gap-2 mb-1">
              <span className={cn('text-2xl font-bold', styles.text)}>
                {count.toLocaleString('fr-FR')}
              </span>
              
              {/* Trend indicator */}
              {trend && (
                <span className={cn(
                  'flex items-center text-xs font-medium pb-1',
                  trend.direction === 'up' ? 'text-red-500' : 'text-green-500'
                )}>
                  {trend.direction === 'up' ? (
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-0.5" />
                  )}
                  {trend.value}%
                </span>
              )}
            </div>
            
            {/* Labels */}
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">
              {sublabel.replace('{count}', count.toString())}
            </p>
            
            {/* CTA Arrow */}
            <div className={cn(
              'absolute top-4 right-4 opacity-0 group-hover:opacity-100',
              'transition-opacity duration-200',
              styles.text
            )}>
              <ChevronRight className="h-4 w-4" />
            </div>
            
            {/* Hover CTA text */}
            <div className={cn(
              'absolute bottom-3 right-4 opacity-0 group-hover:opacity-100',
              'transition-opacity duration-200 text-xs font-medium',
              styles.text
            )}>
              {cta} →
            </div>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
