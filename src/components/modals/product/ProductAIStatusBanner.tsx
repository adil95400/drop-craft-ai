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
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-xl border px-4 py-3',
        'bg-gradient-to-r',
        config.bgClass,
        config.borderClass,
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* Status Icon */}
        <motion.div 
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
            config.iconClass
          )}
          animate={status.type === 'risk' ? {
            scale: [1, 1.05, 1],
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('text-sm font-bold', config.textClass)}>
              {config.label}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Brain className="h-3 w-3" />
                    <span className="text-[10px] font-medium">IA</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">Analyse par Intelligence Artificielle</p>
                  <p className="text-xs text-muted-foreground">Score: {status.score}/100</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {status.recommendation && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
              {status.recommendation}
            </p>
          )}
        </div>
        
        {/* Impact & Action */}
        <div className="flex items-center gap-3 shrink-0">
          {status.estimatedImpact && status.estimatedImpact > 0 && (
            <div className="text-right hidden sm:block">
              <p className="text-xs text-muted-foreground">Potentiel</p>
              <p className={cn('text-sm font-bold', config.textClass)}>
                +{status.estimatedImpact.toLocaleString('fr-FR')}€
              </p>
            </div>
          )}
          
          {showAction && (
            <Button
              size="sm"
              onClick={onActionClick}
              disabled={isLoading}
              className={cn('gap-1.5 font-semibold', config.ctaClass)}
            >
              <Zap className="h-3.5 w-3.5" />
              {actionLabel || 'Optimiser'}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Priority indicator */}
      {status.priority === 'critical' && (
        <motion.div
          className="absolute top-0 right-0 w-2 h-full bg-red-500"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  )
})
