/**
 * Priority Action Card V3 - Prescriptive Edition
 * Carte 100% actionnable : 1 problème, 1 impact, 1 CTA principal
 * Style équilibré : CTA principal fort + lien secondaire discret
 */

import { memo } from 'react'
import { motion, Variants } from 'framer-motion'
import { 
  LucideIcon, ChevronRight, AlertTriangle, Sparkles, 
  DollarSign, RefreshCw, Zap, TrendingDown, ArrowRight
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
  isProcessing?: boolean
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

// Styles par variant - Couleurs plus vives et contrastées
const VARIANT_STYLES = {
  destructive: {
    bg: 'bg-gradient-to-br from-red-500/15 to-red-600/5',
    border: 'border-red-500/40',
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-500',
    glow: 'hover:shadow-red-500/30',
    ctaBg: 'bg-red-500 hover:bg-red-600 text-white',
    impactColor: 'text-red-600 dark:text-red-400'
  },
  warning: {
    bg: 'bg-gradient-to-br from-orange-500/15 to-amber-500/5',
    border: 'border-orange-500/40',
    iconBg: 'bg-orange-500/20',
    iconColor: 'text-orange-500',
    glow: 'hover:shadow-orange-500/30',
    ctaBg: 'bg-orange-500 hover:bg-orange-600 text-white',
    impactColor: 'text-orange-600 dark:text-orange-400'
  },
  info: {
    bg: 'bg-gradient-to-br from-blue-500/15 to-cyan-500/5',
    border: 'border-blue-500/40',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-500',
    glow: 'hover:shadow-blue-500/30',
    ctaBg: 'bg-blue-500 hover:bg-blue-600 text-white',
    impactColor: 'text-blue-600 dark:text-blue-400'
  },
  primary: {
    bg: 'bg-gradient-to-br from-purple-500/15 to-pink-500/5',
    border: 'border-purple-500/40',
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-500',
    glow: 'hover:shadow-purple-500/30',
    ctaBg: 'bg-purple-500 hover:bg-purple-600 text-white',
    impactColor: 'text-purple-600 dark:text-purple-400'
  },
  muted: {
    bg: 'bg-muted/30',
    border: 'border-muted-foreground/20',
    iconBg: 'bg-muted-foreground/20',
    iconColor: 'text-muted-foreground',
    glow: 'hover:shadow-muted/20',
    ctaBg: 'bg-muted-foreground hover:bg-muted-foreground/80 text-white',
    impactColor: 'text-muted-foreground'
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

export const PriorityActionCard = memo(function PriorityActionCard({
  card,
  onPrimaryAction,
  onSecondaryAction,
  isLoading = false,
  isProcessing = false
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
              'relative p-4 sm:p-5 rounded-2xl border-2 overflow-hidden',
              'transition-shadow duration-300 cursor-pointer',
              styles.bg,
              styles.border,
              styles.glow,
              'hover:shadow-xl',
              isProcessing && 'opacity-75 pointer-events-none'
            )}
            variants={cardVariants}
            initial="idle"
            whileHover="hover"
            onClick={onPrimaryAction}
          >
            {/* Pulse indicator for critical */}
            {isPriorityCritical && (
              <motion.div
                className={cn(
                  'absolute top-3 right-3 w-2.5 h-2.5 rounded-full',
                  config.variant === 'destructive' ? 'bg-red-500' : 'bg-orange-500'
                )}
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [1, 0.5, 1]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
            
            {/* Header: Icon + Count - Plus compact */}
            <div className="flex items-center justify-between mb-3">
              <motion.div 
                className={cn(
                  'w-11 h-11 rounded-xl flex items-center justify-center',
                  styles.iconBg
                )}
                variants={iconVariants}
              >
                <Icon className={cn('h-5 w-5', styles.iconColor)} />
              </motion.div>
              
              <motion.div 
                className="text-right"
                key={card.count}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className={cn('text-2xl sm:text-3xl font-bold tabular-nums', styles.iconColor)}>
                  {card.count.toLocaleString('fr-FR')}
                </span>
                <p className="text-[10px] text-muted-foreground -mt-1">produits</p>
              </motion.div>
            </div>
            
            {/* Title - Plus grand et impactant */}
            <h3 className="text-base sm:text-lg font-bold text-foreground mb-1">
              {config.title}
            </h3>
            
            {/* Impact - Visible et clair */}
            <p className={cn('text-sm font-semibold mb-3', styles.impactColor)}>
              {card.impactLabel}
            </p>
            
            {/* Actions - CTA principal dominant + secondaire discret */}
            <div className="space-y-2">
              {/* CTA Principal - Full width, couleur forte */}
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onPrimaryAction()
                }}
                disabled={isLoading || isProcessing}
                className={cn(
                  'w-full gap-2 font-semibold h-10',
                  styles.ctaBg,
                  'shadow-lg'
                )}
              >
                {isProcessing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <>
                    {config.ctaPrimary}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
              
              {/* Lien secondaire - Discret */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onSecondaryAction()
                }}
                disabled={isLoading || isProcessing}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                {config.ctaSecondary} →
              </button>
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="font-medium mb-1">{config.title}</p>
          <p className="text-xs text-muted-foreground">{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
})

/**
 * Grille responsive des cartes de priorité - Optimized
 */
interface PriorityCardsGridProps {
  cards: PriorityCard[]
  onCardAction: (card: PriorityCard, action: 'primary' | 'secondary') => void
  isLoading?: boolean
  maxCards?: number
  processingCardType?: PriorityCardType | null
}

export const PriorityCardsGrid = memo(function PriorityCardsGrid({
  cards,
  onCardAction,
  isLoading = false,
  maxCards = 4,
  processingCardType = null
}: PriorityCardsGridProps) {
  // Filtrer les cartes avec count > 0 et limiter
  const visibleCards = cards
    .filter(c => c.count > 0)
    .slice(0, maxCards)
  
  if (visibleCards.length === 0) {
    return (
      <motion.div 
        className="p-6 rounded-2xl bg-emerald-500/5 border-2 border-emerald-500/30 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
          <Sparkles className="h-6 w-6 text-emerald-500" />
        </div>
        <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
          Catalogue optimisé
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Aucune action prioritaire requise. Continuez ainsi !
        </p>
      </motion.div>
    )
  }
  
  return (
    <motion.div 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {visibleCards.map((card, index) => (
        <motion.div
          key={card.type}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 }}
        >
          <PriorityActionCard
            card={card}
            onPrimaryAction={() => onCardAction(card, 'primary')}
            onSecondaryAction={() => onCardAction(card, 'secondary')}
            isLoading={isLoading}
            isProcessing={processingCardType === card.type}
          />
        </motion.div>
      ))}
    </motion.div>
  )
})
