/**
 * Carte d'action du Command Center
 * Design premium avec animations avancées
 */

import { motion, Variants } from 'framer-motion'
import { LucideIcon, TrendingUp, TrendingDown, ChevronRight, Check } from 'lucide-react'
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
  // Bulk actions
  selectable?: boolean
  selected?: boolean
  onSelect?: (selected: boolean) => void
}

const variantStyles: Record<ActionCardVariant, {
  bg: string
  bgHover: string
  border: string
  text: string
  iconBg: string
  glow: string
}> = {
  destructive: {
    bg: 'bg-red-500/10',
    bgHover: 'hover:bg-red-500/20',
    border: 'border-red-500/30',
    text: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-500/20',
    glow: 'shadow-red-500/20'
  },
  warning: {
    bg: 'bg-orange-500/10',
    bgHover: 'hover:bg-orange-500/20',
    border: 'border-orange-500/30',
    text: 'text-orange-600 dark:text-orange-400',
    iconBg: 'bg-orange-500/20',
    glow: 'shadow-orange-500/20'
  },
  info: {
    bg: 'bg-blue-500/10',
    bgHover: 'hover:bg-blue-500/20',
    border: 'border-blue-500/30',
    text: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-500/20',
    glow: 'shadow-blue-500/20'
  },
  primary: {
    bg: 'bg-purple-500/10',
    bgHover: 'hover:bg-purple-500/20',
    border: 'border-purple-500/30',
    text: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-500/20',
    glow: 'shadow-purple-500/20'
  },
  muted: {
    bg: 'bg-muted/50',
    bgHover: 'hover:bg-muted/70',
    border: 'border-muted-foreground/20',
    text: 'text-muted-foreground',
    iconBg: 'bg-muted-foreground/20',
    glow: 'shadow-muted/20'
  }
}

// Animation variants with proper typing
const cardVariants: Variants = {
  idle: { scale: 1, y: 0 },
  hover: { 
    scale: 1.02, 
    y: -4,
    transition: { type: 'spring' as const, stiffness: 400, damping: 25 }
  },
  tap: { scale: 0.98 }
}

const iconVariants: Variants = {
  idle: { rotate: 0, scale: 1 },
  hover: { 
    rotate: [0, -10, 10, -5, 0], 
    scale: 1.1,
    transition: { duration: 0.5 }
  }
}

const pulseVariants: Variants = {
  idle: { opacity: 0, scale: 0.8 },
  hover: { 
    opacity: [0, 0.5, 0],
    scale: [0.8, 1.2, 0.8],
    transition: { duration: 1.5, repeat: Infinity }
  }
}

const arrowVariants: Variants = {
  idle: { x: 0, opacity: 0 },
  hover: { 
    x: 3, 
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 400 }
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
  isLoading = false,
  selectable = false,
  selected = false,
  onSelect
}: ActionCardProps) {
  const styles = variantStyles[variant]
  
  if (isLoading) {
    return (
      <div className="p-4 rounded-xl border bg-card animate-pulse">
        <Skeleton className="h-10 w-10 rounded-lg mb-3" />
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-4 w-24" />
      </div>
    )
  }
  
  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect?.(!selected)
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={onClick}
            className={cn(
              'relative p-4 rounded-xl border transition-colors duration-300',
              'text-left w-full group cursor-pointer overflow-hidden',
              'focus:outline-none focus:ring-2 focus:ring-primary/50',
              // Mobile touch targets
              'min-h-[120px] touch-manipulation',
              styles.bg,
              styles.bgHover,
              styles.border,
              selected && 'ring-2 ring-primary'
            )}
            variants={cardVariants}
            initial="idle"
            whileHover="hover"
            whileTap="tap"
          >
            {/* Animated glow background */}
            <motion.div 
              className={cn(
                'absolute inset-0 rounded-xl blur-xl -z-10',
                styles.iconBg
              )}
              variants={pulseVariants}
            />
            
            {/* Selection checkbox */}
            {selectable && (
              <motion.div 
                className="absolute top-2 right-2 z-10"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handleSelect}
              >
                <div className={cn(
                  'w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all',
                  selected 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : 'border-muted-foreground/40 bg-background/80'
                )}>
                  {selected && <Check className="h-4 w-4" />}
                </div>
              </motion.div>
            )}
            
            {/* Icon with animation */}
            <motion.div 
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center mb-3',
                styles.iconBg
              )}
              variants={iconVariants}
            >
              <Icon className={cn('h-5 w-5', styles.text)} />
            </motion.div>
            
            {/* Count with number animation */}
            <div className="flex items-end gap-2 mb-1">
              <motion.span 
                className={cn('text-2xl font-bold tabular-nums', styles.text)}
                key={count}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {count.toLocaleString('fr-FR')}
              </motion.span>
              
              {/* Trend indicator with animation */}
              {trend && (
                <motion.span 
                  className={cn(
                    'flex items-center text-xs font-medium pb-1',
                    trend.direction === 'up' ? 'text-red-500' : 'text-green-500'
                  )}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {trend.direction === 'up' ? (
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-0.5" />
                  )}
                  {trend.value}%
                </motion.span>
              )}
            </div>
            
            {/* Labels */}
            <p className="text-sm font-medium text-foreground line-clamp-1">{label}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {sublabel.replace('{count}', count.toString())}
            </p>
            
            {/* CTA Arrow with animation */}
            <motion.div 
              className={cn(
                'absolute top-4 right-4',
                styles.text,
                selectable && 'hidden'
              )}
              variants={arrowVariants}
            >
              <ChevronRight className="h-4 w-4" />
            </motion.div>
            
            {/* Hover CTA text */}
            <motion.div 
              className={cn(
                'absolute bottom-3 right-4 text-xs font-medium',
                styles.text
              )}
              initial={{ opacity: 0, x: 5 }}
              whileHover={{ opacity: 1, x: 0 }}
            >
              <span className="hidden group-hover:inline-flex items-center gap-1">
                {cta} <ChevronRight className="h-3 w-3" />
              </span>
            </motion.div>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
