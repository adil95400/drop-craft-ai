/**
 * Priority Action Card V3
 * Carte de priorité avec CTA principal, impact business et design premium
 */

import { motion, Variants } from 'framer-motion'
import { 
  LucideIcon, ChevronRight, AlertTriangle, Sparkles, 
  DollarSign, RefreshCw, Zap, TrendingDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { PriorityCard } from './useAIPriorityEngine'
import { PRIORITY_CARD_CONFIG, PriorityCardType } from './labels'

interface PriorityActionCardProps {
  card: PriorityCard
  onPrimaryAction: () => void
  onSecondaryAction: () => void
  isLoading?: boolean
}

// Icônes par type
const CARD_ICONS: Record<PriorityCardType, LucideIcon> = {
  stock_critical: AlertTriangle,
  no_price_rule: DollarSign,
  ai_opportunities: Sparkles,
  not_synced: RefreshCw,
  quality_low: Zap,
  margin_loss: TrendingDown
}

// Styles par variant
const VARIANT_STYLES = {
  destructive: {
    bg: 'bg-gradient-to-br from-red-500/10 to-red-600/5',
    border: 'border-red-500/30',
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-500',
    glow: 'hover:shadow-red-500/20',
    pulseColor: 'bg-red-500'
  },
  warning: {
    bg: 'bg-gradient-to-br from-orange-500/10 to-amber-500/5',
    border: 'border-orange-500/30',
    iconBg: 'bg-orange-500/20',
    iconColor: 'text-orange-500',
    glow: 'hover:shadow-orange-500/20',
    pulseColor: 'bg-orange-500'
  },
  info: {
    bg: 'bg-gradient-to-br from-blue-500/10 to-cyan-500/5',
    border: 'border-blue-500/30',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-500',
    glow: 'hover:shadow-blue-500/20',
    pulseColor: 'bg-blue-500'
  },
  primary: {
    bg: 'bg-gradient-to-br from-purple-500/10 to-pink-500/5',
    border: 'border-purple-500/30',
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-500',
    glow: 'hover:shadow-purple-500/20',
    pulseColor: 'bg-purple-500'
  },
  muted: {
    bg: 'bg-muted/30',
    border: 'border-muted-foreground/20',
    iconBg: 'bg-muted-foreground/20',
    iconColor: 'text-muted-foreground',
    glow: 'hover:shadow-muted/20',
    pulseColor: 'bg-muted-foreground'
  }
}

const cardVariants: Variants = {
  idle: { scale: 1, y: 0 },
  hover: { 
    scale: 1.02, 
    y: -4,
    transition: { type: 'spring', stiffness: 400, damping: 25 }
  }
}

const iconVariants: Variants = {
  idle: { rotate: 0 },
  hover: { 
    rotate: [0, -8, 8, -4, 0], 
    transition: { duration: 0.5 }
  }
}

export function PriorityActionCard({
  card,
  onPrimaryAction,
  onSecondaryAction,
  isLoading = false
}: PriorityActionCardProps) {
  const config = PRIORITY_CARD_CONFIG[card.type]
  const styles = VARIANT_STYLES[config.variant]
  const Icon = CARD_ICONS[card.type]
  
  // Ne pas afficher si count = 0
  if (card.count === 0) return null
  
  const isPriorityCritical = card.priority === 'critical' || card.priority === 'high'
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className={cn(
              'relative p-5 rounded-2xl border-2 overflow-hidden',
              'transition-shadow duration-300',
              styles.bg,
              styles.border,
              styles.glow,
              'hover:shadow-xl'
            )}
            variants={cardVariants}
            initial="idle"
            whileHover="hover"
          >
            {/* Pulse indicator for critical */}
            {isPriorityCritical && (
              <motion.div
                className={cn(
                  'absolute top-3 right-3 w-2 h-2 rounded-full',
                  styles.pulseColor
                )}
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [1, 0.5, 1]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
            
            {/* Header: Icon + Count */}
            <div className="flex items-start justify-between mb-4">
              <motion.div 
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  styles.iconBg
                )}
                variants={iconVariants}
              >
                <Icon className={cn('h-6 w-6', styles.iconColor)} />
              </motion.div>
              
              <motion.span 
                className={cn('text-3xl font-bold tabular-nums', styles.iconColor)}
                key={card.count}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {card.count.toLocaleString('fr-FR')}
              </motion.span>
            </div>
            
            {/* Title */}
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {config.title}
            </h3>
            
            {/* Impact Label */}
            <p className={cn('text-sm font-medium mb-1', styles.iconColor)}>
              {config.impactLabel}
            </p>
            
            {/* Impact Detail */}
            <p className="text-xs text-muted-foreground mb-4">
              {card.impactLabel}
            </p>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onPrimaryAction()
                }}
                disabled={isLoading}
                className={cn(
                  'flex-1 gap-1.5 font-medium',
                  isPriorityCritical && 'animate-pulse'
                )}
              >
                {config.ctaPrimary}
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onSecondaryAction()
                }}
                disabled={isLoading}
                className="text-muted-foreground hover:text-foreground"
              >
                {config.ctaSecondary}
              </Button>
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Grille responsive des cartes de priorité
 */
interface PriorityCardsGridProps {
  cards: PriorityCard[]
  onCardAction: (card: PriorityCard, action: 'primary' | 'secondary') => void
  isLoading?: boolean
  maxCards?: number
}

export function PriorityCardsGrid({
  cards,
  onCardAction,
  isLoading = false,
  maxCards = 4
}: PriorityCardsGridProps) {
  // Filtrer les cartes avec count > 0 et limiter
  const visibleCards = cards
    .filter(c => c.count > 0)
    .slice(0, maxCards)
  
  if (visibleCards.length === 0) return null
  
  return (
    <motion.div 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ staggerChildren: 0.1 }}
    >
      {visibleCards.map((card, index) => (
        <motion.div
          key={card.type}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <PriorityActionCard
            card={card}
            onPrimaryAction={() => onCardAction(card, 'primary')}
            onSecondaryAction={() => onCardAction(card, 'secondary')}
            isLoading={isLoading}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}
