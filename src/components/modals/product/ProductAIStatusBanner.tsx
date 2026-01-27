/**
 * Product AI Status Banner
 * Bandeau de statut IA prescriptif pour le modal produit
 * Affiche l'état (risque/opportunité/optimisé) + recommandation principale + CTA
 */

import { memo } from 'react'
import { motion } from 'framer-motion'
import { 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle, 
  Sparkles,
  ArrowRight,
  Brain,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export type AIStatusType = 'risk' | 'opportunity' | 'optimized' | 'neutral'

export interface ProductAIStatus {
  type: AIStatusType
  score: number
  priority: 'critical' | 'high' | 'medium' | 'low'
  mainIssue?: string
  recommendation?: string
  estimatedImpact?: number
}

interface ProductAIStatusBannerProps {
  status: ProductAIStatus | null
  onActionClick?: () => void
  actionLabel?: string
  isLoading?: boolean
  className?: string
}

const STATUS_CONFIG = {
  risk: {
    icon: AlertTriangle,
    label: 'Action requise',
    bgClass: 'from-red-500/15 via-red-500/5 to-transparent',
    borderClass: 'border-red-500/30',
    iconClass: 'bg-red-500/20 text-red-500',
    textClass: 'text-red-600 dark:text-red-400',
    ctaClass: 'bg-red-500 hover:bg-red-600 text-white'
  },
  opportunity: {
    icon: TrendingUp,
    label: 'Opportunité',
    bgClass: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
    borderClass: 'border-emerald-500/30',
    iconClass: 'bg-emerald-500/20 text-emerald-500',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    ctaClass: 'bg-emerald-500 hover:bg-emerald-600 text-white'
  },
  optimized: {
    icon: CheckCircle,
    label: 'Optimisé',
    bgClass: 'from-blue-500/15 via-blue-500/5 to-transparent',
    borderClass: 'border-blue-500/30',
    iconClass: 'bg-blue-500/20 text-blue-500',
    textClass: 'text-blue-600 dark:text-blue-400',
    ctaClass: 'bg-blue-500 hover:bg-blue-600 text-white'
  },
  neutral: {
    icon: Sparkles,
    label: 'Standard',
    bgClass: 'from-muted/50 via-muted/20 to-transparent',
    borderClass: 'border-border/50',
    iconClass: 'bg-muted text-muted-foreground',
    textClass: 'text-muted-foreground',
    ctaClass: 'bg-primary hover:bg-primary/90 text-primary-foreground'
  }
}

export const ProductAIStatusBanner = memo(function ProductAIStatusBanner({
  status,
  onActionClick,
  actionLabel,
  isLoading = false,
  className
}: ProductAIStatusBannerProps) {
  if (!status) return null
  
  const config = STATUS_CONFIG[status.type]
  const Icon = config.icon
  const showAction = status.type !== 'optimized' && status.type !== 'neutral' && onActionClick
  
  // Sprint 2: Determine primary CTA label based on status
  const getPrimaryCTALabel = () => {
    if (actionLabel) return actionLabel
    switch (status.type) {
      case 'risk': return 'Corriger maintenant'
      case 'opportunity': return 'Optimiser'
      default: return 'Voir détails'
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-xl border-2 px-5 py-4',
        'bg-gradient-to-r',
        config.bgClass,
        config.borderClass,
        className
      )}
    >
      <div className="flex items-center gap-4">
        {/* Status Icon - Larger for prescriptive feel */}
        <motion.div 
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
            config.iconClass
          )}
          animate={status.type === 'risk' ? {
            scale: [1, 1.08, 1],
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Icon className="h-6 w-6" />
        </motion.div>
        
        {/* Content - More prescriptive messaging */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('text-base font-bold', config.textClass)}>
              {config.label}
            </span>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Brain className="h-3 w-3" />
              <span className="text-[10px] font-semibold">Recommandation IA</span>
            </div>
          </div>
          
          {status.recommendation ? (
            <p className="text-sm text-foreground font-medium">
              {status.recommendation}
            </p>
          ) : status.mainIssue ? (
            <p className="text-sm text-foreground font-medium">
              {status.type === 'risk' ? '⚠️ ' : '💡 '}{status.mainIssue}
            </p>
          ) : null}
        </div>
        
        {/* Impact Badge + Single Primary CTA */}
        <div className="flex items-center gap-4 shrink-0">
          {status.estimatedImpact && status.estimatedImpact > 0 && (
            <div className="text-center px-3 py-1.5 rounded-lg bg-background/80 border border-border/50 hidden sm:block">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Potentiel</p>
              <p className={cn('text-lg font-bold', config.textClass)}>
                +{status.estimatedImpact.toLocaleString('fr-FR')}€
              </p>
            </div>
          )}
          
          {/* Single Primary CTA - Dominant */}
          {showAction && (
            <Button
              size="lg"
              onClick={onActionClick}
              disabled={isLoading}
              className={cn(
                'gap-2 font-bold px-6 shadow-lg',
                config.ctaClass
              )}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Zap className="h-4 w-4" />
                </motion.div>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  {getPrimaryCTALabel()}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      
      {/* Priority indicator - More prominent */}
      {status.priority === 'critical' && (
        <motion.div
          className="absolute top-0 right-0 w-1.5 h-full bg-red-500 rounded-r-xl"
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.div>
  )
})
