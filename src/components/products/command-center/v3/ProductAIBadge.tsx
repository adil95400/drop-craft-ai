/**
 * Badge IA individuel pour les produits
 * Affiche le type (risque/opportunité/optimisé) avec le problème principal
 */

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle, 
  Minus,
  Zap,
  Brain
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ProductAIBadge as ProductAIBadgeType } from './useAIPriorityEngine'

interface ProductAIBadgeProps {
  badge: ProductAIBadgeType | undefined
  compact?: boolean
  showTooltip?: boolean
  className?: string
}

const BADGE_CONFIG = {
  risk: {
    icon: AlertTriangle,
    label: 'À risque',
    colors: 'bg-red-500/10 text-red-600 border-red-500/30',
    iconColor: 'text-red-500',
    gradient: 'from-red-500/20 to-red-600/10'
  },
  opportunity: {
    icon: TrendingUp,
    label: 'Opportunité',
    colors: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    iconColor: 'text-emerald-500',
    gradient: 'from-emerald-500/20 to-emerald-600/10'
  },
  optimized: {
    icon: CheckCircle,
    label: 'Optimisé',
    colors: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    iconColor: 'text-blue-500',
    gradient: 'from-blue-500/20 to-blue-600/10'
  },
  neutral: {
    icon: Minus,
    label: 'Standard',
    colors: 'bg-muted text-muted-foreground border-border/50',
    iconColor: 'text-muted-foreground',
    gradient: 'from-muted/50 to-muted/30'
  }
} as const

export function ProductAIBadgeComponent({
  badge,
  compact = false,
  showTooltip = true,
  className
}: ProductAIBadgeProps) {
  if (!badge) return null
  
  const config = BADGE_CONFIG[badge.type]
  const Icon = config.icon
  
  const badgeContent = (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border backdrop-blur-sm',
        compact ? 'px-1.5 py-0.5' : 'px-2.5 py-1',
        config.colors,
        className
      )}
    >
      <Icon className={cn(
        config.iconColor,
        compact ? 'h-3 w-3' : 'h-3.5 w-3.5'
      )} />
      
      {!compact && (
        <span className="text-[10px] font-semibold uppercase tracking-wide">
          {config.label}
        </span>
      )}
      
      {badge.type !== 'neutral' && badge.priority === 'critical' && (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="h-1.5 w-1.5 rounded-full bg-current"
        />
      )}
    </motion.div>
  )
  
  if (!showTooltip || badge.type === 'neutral') {
    return badgeContent
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-[200px] bg-popover/95 backdrop-blur"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-medium">
              <Brain className="h-3.5 w-3.5 text-primary" />
              <span>Analyse IA</span>
            </div>
            
            {badge.mainIssue && (
              <p className="text-xs text-muted-foreground">
                {badge.type === 'risk' ? '⚠️ ' : '✨ '}
                {badge.mainIssue}
              </p>
            )}
            
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1 border-t border-border/50">
              <span>Score: {badge.score}</span>
              <span>•</span>
              <span className="capitalize">{badge.priority}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Badge simplifié pour les listes compactes
 */
export function ProductAIBadgeMinimal({
  badge,
  className
}: {
  badge: ProductAIBadgeType | undefined
  className?: string
}) {
  if (!badge || badge.type === 'neutral') return null
  
  const config = BADGE_CONFIG[badge.type]
  const Icon = config.icon
  
  return (
    <div className={cn(
      'h-5 w-5 rounded-full flex items-center justify-center',
      `bg-gradient-to-br ${config.gradient}`,
      className
    )}>
      <Icon className={cn('h-3 w-3', config.iconColor)} />
    </div>
  )
}

/**
 * Indicateur de priorité IA (barre colorée)
 */
export function ProductAIPriorityIndicator({
  badge,
  className
}: {
  badge: ProductAIBadgeType | undefined
  className?: string
}) {
  if (!badge) return null
  
  const priorityColors = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-amber-500',
    low: 'bg-muted'
  }
  
  return (
    <div className={cn('flex gap-0.5', className)}>
      {['critical', 'high', 'medium', 'low'].map((level, idx) => (
        <div
          key={level}
          className={cn(
            'h-1 w-3 rounded-sm transition-colors',
            idx <= ['critical', 'high', 'medium', 'low'].indexOf(badge.priority)
              ? priorityColors[badge.priority]
              : 'bg-muted/30'
          )}
        />
      ))}
    </div>
  )
}
