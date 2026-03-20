/**
 * DecisionBadge - Badge décisionnel IA unique par produit
 * Sprint 4: ⚠️ Action Requise | 💰 Opportunité | ✅ Optimisé
 * 
 * Un seul badge par produit, décidé par l'IA, permettant une lecture
 * immédiate sans ouvrir la fiche produit.
 */

import { memo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle,
  Brain
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ProductAIBadge as ProductAIBadgeType } from './useAIPriorityEngine'

export type DecisionType = 'action' | 'opportunity' | 'optimized'

interface DecisionBadgeProps {
  badge: ProductAIBadgeType | undefined
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showTooltip?: boolean
  className?: string
}

const DECISION_CONFIG = {
  risk: {
    type: 'action' as DecisionType,
    emoji: '⚠️',
    icon: AlertTriangle,
    label: 'Action requise',
    shortLabel: 'Action',
    colors: 'bg-destructive/15 text-destructive dark:text-red-400 border-destructive/40',
    iconColor: 'text-destructive',
    pulseColor: 'bg-destructive'
  },
  opportunity: {
    type: 'opportunity' as DecisionType,
    emoji: '💰',
    icon: TrendingUp,
    label: 'Opportunité',
    shortLabel: 'Opportunité',
    colors: 'bg-success/15 text-success dark:text-emerald-400 border-emerald-500/40',
    iconColor: 'text-success',
    pulseColor: 'bg-success'
  },
  optimized: {
    type: 'optimized' as DecisionType,
    emoji: '✅',
    icon: CheckCircle,
    label: 'Optimisé',
    shortLabel: 'OK',
    colors: 'bg-info/15 text-info dark:text-blue-400 border-info/40',
    iconColor: 'text-info',
    pulseColor: 'bg-info'
  },
  neutral: {
    type: 'optimized' as DecisionType,
    emoji: '✅',
    icon: CheckCircle,
    label: 'Standard',
    shortLabel: 'OK',
    colors: 'bg-muted/50 text-muted-foreground border-border/50',
    iconColor: 'text-muted-foreground',
    pulseColor: 'bg-muted'
  }
} as const

const SIZE_CLASSES = {
  sm: {
    container: 'px-2 py-0.5 gap-1',
    icon: 'h-3 w-3',
    emoji: 'text-xs',
    text: 'text-[10px]',
    pulse: 'h-1.5 w-1.5'
  },
  md: {
    container: 'px-2.5 py-1 gap-1.5',
    icon: 'h-3.5 w-3.5',
    emoji: 'text-sm',
    text: 'text-xs',
    pulse: 'h-2 w-2'
  },
  lg: {
    container: 'px-3 py-1.5 gap-2',
    icon: 'h-4 w-4',
    emoji: 'text-base',
    text: 'text-sm',
    pulse: 'h-2.5 w-2.5'
  }
}

export const DecisionBadge = memo(function DecisionBadge({
  badge,
  size = 'md',
  showLabel = true,
  showTooltip = true,
  className
}: DecisionBadgeProps) {
  if (!badge) return null
  
  const config = DECISION_CONFIG[badge.type]
  const sizeClass = SIZE_CLASSES[size]
  const Icon = config.icon
  const isCritical = badge.priority === 'critical' && badge.type === 'risk'
  
  const badgeContent = (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center rounded-full border font-semibold backdrop-blur-sm',
        'transition-all duration-200 hover:scale-105',
        sizeClass.container,
        config.colors,
        className
      )}
    >
      {/* Emoji for instant recognition */}
      <span className={sizeClass.emoji}>{config.emoji}</span>
      
      {/* Label */}
      {showLabel && (
        <span className={cn('font-bold uppercase tracking-wide', sizeClass.text)}>
          {size === 'sm' ? config.shortLabel : config.label}
        </span>
      )}
      
      {/* Critical pulse indicator */}
      {isCritical && (
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className={cn('rounded-full', sizeClass.pulse, config.pulseColor)}
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
          className="max-w-[220px] bg-popover/95 backdrop-blur p-3"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <Brain className="h-4 w-4 text-primary" />
              <span>Décision IA</span>
            </div>
            
            {badge.mainIssue && (
              <p className="text-sm text-muted-foreground leading-snug">
                {badge.mainIssue}
              </p>
            )}
            
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1.5 border-t border-border/50">
              <div className="flex items-center gap-1">
                <span className="font-medium">Score:</span>
                <span className={cn('font-bold', config.iconColor)}>{badge.score}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">Priorité:</span>
                <span className={cn(
                  'font-bold capitalize',
                  badge.priority === 'critical' && 'text-destructive',
                  badge.priority === 'high' && 'text-warning',
                  badge.priority === 'medium' && 'text-warning'
                )}>
                  {badge.priority}
                </span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
})

/**
 * DecisionBadgeInline - Version compacte pour les listes
 */
export const DecisionBadgeInline = memo(function DecisionBadgeInline({
  badge,
  className
}: {
  badge: ProductAIBadgeType | undefined
  className?: string
}) {
  if (!badge) return null
  
  const config = DECISION_CONFIG[badge.type]
  
  return (
    <span className={cn('text-base', className)}>
      {config.emoji}
    </span>
  )
})

/**
 * DecisionBadgeWithAction - Badge avec CTA intégré
 */
export const DecisionBadgeWithAction = memo(function DecisionBadgeWithAction({
  badge,
  onAction,
  className
}: {
  badge: ProductAIBadgeType | undefined
  onAction?: () => void
  className?: string
}) {
  if (!badge || badge.type === 'optimized' || badge.type === 'neutral') {
    return <DecisionBadge badge={badge} size="md" className={className} />
  }
  
  const config = DECISION_CONFIG[badge.type]
  
  return (
    <motion.button
      onClick={onAction}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border font-semibold',
        'transition-all duration-200 cursor-pointer',
        config.colors,
        'hover:shadow-md',
        className
      )}
    >
      <span className="text-sm">{config.emoji}</span>
      <span className="text-xs font-bold uppercase tracking-wide">
        {badge.type === 'risk' ? 'Corriger' : 'Optimiser'}
      </span>
    </motion.button>
  )
})
