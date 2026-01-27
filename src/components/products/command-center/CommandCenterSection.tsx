/**
 * Section Command Center - "À faire aujourd'hui"
 * Bloc principal orienté action en haut de la page produits
 */

import { motion } from 'framer-motion'
import { 
  AlertTriangle, Sparkles, DollarSign, Brain, RefreshCw,
  ArrowRight
} from 'lucide-react'
import { ProductAuditResult } from '@/types/audit'
import { ActionCard } from './ActionCard'
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            hasIssues 
              ? 'bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30'
              : 'bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30'
          )}>
            {hasIssues ? (
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            ) : (
              <Sparkles className="h-5 w-5 text-emerald-500" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              {hasIssues ? 'À faire aujourd\'hui' : 'Tout est en ordre'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {hasIssues 
                ? `${totalIssues.toLocaleString('fr-FR')} produits nécessitent votre attention`
                : 'Votre catalogue est optimisé'
              }
            </p>
          </div>
        </div>
        
        {hasIssues && (
          <motion.button
            className="hidden sm:flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium"
            whileHover={{ x: 4 }}
          >
            Tout voir <ArrowRight className="h-4 w-4" />
          </motion.button>
        )}
      </div>
      
      {/* Action Cards Grid */}
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3"
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
