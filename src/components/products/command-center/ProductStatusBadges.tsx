/**
 * Badges de statut dynamiques pour les cartes produit
 * Phase 2 - Command Center V2
 */

import { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  AlertTriangle, 
  CheckCircle, 
  Sparkles, 
  DollarSign, 
  RefreshCw,
  TrendingDown,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export interface ProductStatusData {
  stockCritical: boolean
  lowQuality: boolean
  aiOptimized: boolean
  hasPriceRule: boolean
  recentlySync: boolean
  losingMargin: boolean
  qualityScore?: number
  stockQuantity?: number
}

interface ProductStatusBadgesProps {
  status: ProductStatusData
  compact?: boolean
  showAll?: boolean
}

interface BadgeConfig {
  id: string
  condition: boolean
  icon: typeof AlertTriangle
  label: string
  tooltip: string
  className: string
  priority: number
}

export const ProductStatusBadges = memo(function ProductStatusBadges({
  status,
  compact = false,
  showAll = false
}: ProductStatusBadgesProps) {
  const badges: BadgeConfig[] = [
    {
      id: 'stock_critical',
      condition: status.stockCritical,
      icon: AlertTriangle,
      label: 'Stock critique',
      tooltip: `Stock: ${status.stockQuantity ?? 0} unités - Risque de rupture`,
      className: 'bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20',
      priority: 1
    },
    {
      id: 'low_quality',
      condition: status.lowQuality,
      icon: Zap,
      label: 'Qualité faible',
      tooltip: `Score qualité: ${status.qualityScore ?? 0}/100 - À optimiser`,
      className: 'bg-warning/10 text-warning border-warning/30 hover:bg-warning/20',
      priority: 2
    },
    {
      id: 'losing_margin',
      condition: status.losingMargin,
      icon: TrendingDown,
      label: 'Marge faible',
      tooltip: 'Marge inférieure au seuil recommandé (15%)',
      className: 'bg-warning/10 text-warning border-warning/30 hover:bg-warning/20',
      priority: 3
    },
    {
      id: 'ai_optimized',
      condition: status.aiOptimized,
      icon: Sparkles,
      label: 'Optimisé IA',
      tooltip: 'Ce produit a été optimisé par l\'IA',
      className: 'bg-success/10 text-success border-success/30 hover:bg-success/20',
      priority: 4
    },
    {
      id: 'price_rule',
      condition: status.hasPriceRule,
      icon: DollarSign,
      label: 'Règle prix',
      tooltip: 'Une règle de tarification est appliquée',
      className: 'bg-info/10 text-info border-info/30 hover:bg-info/20',
      priority: 5
    },
    {
      id: 'synced',
      condition: status.recentlySync,
      icon: RefreshCw,
      label: 'Synchronisé',
      tooltip: 'Synchronisé récemment avec les boutiques',
      className: 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20',
      priority: 6
    },
    {
      id: 'not_synced',
      condition: !status.recentlySync,
      icon: RefreshCw,
      label: 'Non sync',
      tooltip: 'Non synchronisé depuis plus de 24h',
      className: 'bg-muted text-muted-foreground border-border hover:bg-muted/80',
      priority: 7
    }
  ]

  // Filtrer et trier les badges
  const activeBadges = badges
    .filter(b => showAll ? true : b.condition)
    .filter(b => {
      // Ne pas afficher à la fois synced et not_synced
      if (b.id === 'synced' && !status.recentlySync) return false
      if (b.id === 'not_synced' && status.recentlySync) return false
      return true
    })
    .sort((a, b) => a.priority - b.priority)
    .slice(0, compact ? 3 : 5)

  if (activeBadges.length === 0) return null

  return (
    <TooltipProvider>
      <div className={cn(
        'flex flex-wrap gap-1',
        compact && 'gap-0.5'
      )}>
        {activeBadges.map((badge, index) => {
          const Icon = badge.icon
          
          return (
            <Tooltip key={badge.id}>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      'transition-all duration-200 cursor-default',
                      compact ? 'text-[9px] px-1.5 py-0' : 'text-[10px] px-2 py-0.5',
                      badge.className
                    )}
                  >
                    <Icon className={cn(
                      compact ? 'h-2.5 w-2.5' : 'h-3 w-3',
                      !compact && 'mr-1'
                    )} />
                    {!compact && badge.label}
                  </Badge>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="font-medium">{badge.label}</p>
                <p className="text-xs text-muted-foreground">{badge.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
})

/**
 * Hook pour calculer le statut d'un produit pour les badges
 */
export function calculateProductStatus(
  productId: string,
  product: {
    stock_quantity?: number
    profit_margin?: number
    price?: number
    cost_price?: number
    updated_at?: string
  },
  auditScore?: number,
  priceRuleIds?: Set<string>,
  aiOptimizedIds?: Set<string>
): ProductStatusData {
  const stock = product.stock_quantity ?? 0
  const margin = product.profit_margin ?? 
    (product.price && product.cost_price 
      ? ((product.price - product.cost_price) / product.price) * 100 
      : 0)
  
  const hoursSinceUpdate = product.updated_at 
    ? (Date.now() - new Date(product.updated_at).getTime()) / (1000 * 60 * 60)
    : Infinity
  
  return {
    stockCritical: stock < 10,
    lowQuality: (auditScore ?? 100) < 40,
    aiOptimized: aiOptimizedIds?.has(productId) ?? false,
    hasPriceRule: priceRuleIds?.has(productId) ?? false,
    recentlySync: hoursSinceUpdate < 24,
    losingMargin: margin > 0 && margin < 15,
    qualityScore: auditScore,
    stockQuantity: stock
  }
}
