/**
 * Section Command Center - "À faire aujourd'hui"
 * Bloc principal orienté action en haut de la page produits
 * V2 - Animations premium, temps réel, mobile optimisé
 */

import { motion, Variants } from 'framer-motion'
import { 
  AlertTriangle, Sparkles, DollarSign, Brain, RefreshCw,
  ArrowRight, CheckCircle2
} from 'lucide-react'
import { ProductAuditResult } from '@/types/audit'
import { ActionCard } from './ActionCard'
import { RealTimeIndicator } from './RealTimeIndicator'
import { useCommandCenterData } from './useCommandCenterData'
import { 
  ActionCardType, 
  ActionCardVariant, 
  ACTION_CARD_LABELS 
} from './types'
import { cn } from '@/lib/utils'

// Generic product interface for flexibility
interface GenericProduct {
  id: string
  name?: string
  stock_quantity?: number
}

interface CommandCenterSectionProps {
  products: GenericProduct[]
  auditResults: ProductAuditResult[]
  onCardClick: (type: ActionCardType, productIds: string[]) => void
  isLoading?: boolean
}

const cardConfig: Record<ActionCardType, {
  icon: typeof AlertTriangle
  variant: ActionCardVariant
  priority: number
}> = {
  stock: {
    icon: AlertTriangle,
    variant: 'destructive',
    priority: 1
  },
  quality: {
    icon: Sparkles,
    variant: 'warning',
    priority: 2
  },
  price_rule: {
    icon: DollarSign,
    variant: 'info',
    priority: 3
  },
  ai: {
    icon: Brain,
    variant: 'primary',
    priority: 4
  },
  sync: {
    icon: RefreshCw,
    variant: 'muted',
    priority: 5
  }
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25 }
  }
}

const headerVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { type: 'spring', stiffness: 200 }
  }
}

export function CommandCenterSection({
  products,
  auditResults,
  onCardClick,
  isLoading = false
}: CommandCenterSectionProps) {
  const commandData = useCommandCenterData({ products, auditResults })
  
  // Calculate if there are any issues to address
  const hasIssues = commandData.cards.some(card => card.count > 0)
  const totalIssues = commandData.cards.reduce((sum, card) => sum + card.count, 0)
  
  // Sort cards by count (highest first) but keep priorities
  const sortedCards = [...commandData.cards].sort((a, b) => {
    // First by having issues
    if (a.count > 0 && b.count === 0) return -1
    if (a.count === 0 && b.count > 0) return 1
    // Then by priority
    return cardConfig[a.type].priority - cardConfig[b.type].priority
  })
  
  return (
    <motion.div
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header with real-time indicator */}
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        variants={headerVariants}
      >
        <div className="flex items-center gap-3">
          <motion.div 
            className={cn(
              'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0',
              hasIssues 
                ? 'bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30'
                : 'bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30'
            )}
            animate={hasIssues ? { 
              boxShadow: ['0 0 0 0 rgba(249, 115, 22, 0)', '0 0 0 8px rgba(249, 115, 22, 0.1)', '0 0 0 0 rgba(249, 115, 22, 0)']
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {hasIssues ? (
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
            ) : (
              <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
            )}
          </motion.div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold">
              {hasIssues ? 'À faire aujourd\'hui' : 'Tout est en ordre'}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {hasIssues 
                ? `${totalIssues.toLocaleString('fr-FR')} produits nécessitent votre attention`
                : 'Votre catalogue est optimisé'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Real-time status indicator */}
          <RealTimeIndicator showMetrics />
          
          {hasIssues && (
            <motion.button
              className="hidden sm:flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              Tout voir <ArrowRight className="h-4 w-4" />
            </motion.button>
          )}
        </div>
      </motion.div>
      
      {/* Action Cards Grid - Mobile responsive */}
      <motion.div 
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3"
        variants={containerVariants}
      >
        {sortedCards.map((card) => {
          const config = cardConfig[card.type]
          const labels = ACTION_CARD_LABELS[card.type]
          
          return (
            <motion.div key={card.type} variants={itemVariants}>
              <ActionCard
                label={labels.title}
                sublabel={labels.subtitle}
                count={card.count}
                icon={config.icon}
                variant={card.count > 0 ? config.variant : 'muted'}
                tooltip={labels.tooltip}
                cta={labels.cta}
                onClick={() => onCardClick(card.type, card.productIds)}
                isLoading={isLoading}
              />
            </motion.div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}
