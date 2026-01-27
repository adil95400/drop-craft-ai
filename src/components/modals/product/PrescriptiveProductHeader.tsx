/**
 * PrescriptiveProductHeader - Header prescriptif pour le modal produit
 * Sprint 4: Bandeau statut IA complet avec recommandation et CTA unique
 */

import { memo } from 'react'
import { motion } from 'framer-motion'
import { 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle, 
  Brain,
  Zap,
  ArrowRight,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ProductAIBadge } from '@/components/products/command-center'

interface PrescriptiveProductHeaderProps {
  product: {
    name: string
    image_url?: string
    status?: string
    price?: number
  }
  aiBadge?: ProductAIBadge
  onPrimaryAction?: () => void
  onClose?: () => void
  isLoading?: boolean
  className?: string
}

const AI_STATUS_CONFIG = {
  risk: {
    icon: AlertTriangle,
    title: 'Action requise',
    subtitle: 'Ce produit nécessite votre attention immédiate',
    ctaLabel: 'Corriger maintenant',
    ctaIcon: Zap,
    gradient: 'from-red-500/20 via-red-500/10 to-transparent',
    border: 'border-red-500/40',
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-500',
    textColor: 'text-red-600 dark:text-red-400',
    ctaClass: 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
  },
  opportunity: {
    icon: TrendingUp,
    title: 'Opportunité détectée',
    subtitle: 'Potentiel de gain identifié par l\'IA',
    ctaLabel: 'Optimiser',
    ctaIcon: TrendingUp,
    gradient: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
    border: 'border-emerald-500/40',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-500',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    ctaClass: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
  },
  optimized: {
    icon: CheckCircle,
    title: 'Produit optimisé',
    subtitle: 'Aucune action requise',
    ctaLabel: 'Voir détails',
    ctaIcon: ArrowRight,
    gradient: 'from-blue-500/20 via-blue-500/10 to-transparent',
    border: 'border-blue-500/40',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-500',
    textColor: 'text-blue-600 dark:text-blue-400',
    ctaClass: 'bg-blue-500 hover:bg-blue-600 text-white'
  },
  neutral: {
    icon: CheckCircle,
    title: 'Produit standard',
    subtitle: 'Analyse en cours',
    ctaLabel: 'Voir détails',
    ctaIcon: ArrowRight,
    gradient: 'from-muted/50 via-muted/20 to-transparent',
    border: 'border-border/50',
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
    textColor: 'text-muted-foreground',
    ctaClass: 'bg-primary hover:bg-primary/90 text-primary-foreground'
  }
}

export const PrescriptiveProductHeader = memo(function PrescriptiveProductHeader({
  product,
  aiBadge,
  onPrimaryAction,
  onClose,
  isLoading = false,
  className
}: PrescriptiveProductHeaderProps) {
  const badgeType = aiBadge?.type || 'neutral'
  const config = AI_STATUS_CONFIG[badgeType]
  const Icon = config.icon
  const CtaIcon = config.ctaIcon
  const showCta = badgeType !== 'optimized' && badgeType !== 'neutral' && onPrimaryAction
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-xl border-2',
        'bg-gradient-to-r',
        config.gradient,
        config.border,
        className
      )}
    >
      <div className="px-5 py-4">
        <div className="flex items-center gap-4">
          {/* Product Image Thumbnail */}
          <div className="relative shrink-0">
            {product.image_url ? (
              <img 
                src={product.image_url} 
                alt={product.name}
                className="h-14 w-14 rounded-lg object-cover border border-border/50"
              />
            ) : (
              <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
            )}
            
            {/* Status indicator overlay */}
            <motion.div 
              className={cn(
                'absolute -bottom-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center',
                config.iconBg
              )}
              animate={badgeType === 'risk' ? {
                scale: [1, 1.1, 1],
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Icon className={cn('h-3.5 w-3.5', config.iconColor)} />
            </motion.div>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Product name + AI Badge */}
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-bold text-lg truncate">{product.name}</h2>
              <Badge 
                variant="outline" 
                className="shrink-0 bg-purple-500/10 text-purple-600 border-purple-500/30"
              >
                <Brain className="h-3 w-3 mr-1" />
                IA
              </Badge>
            </div>
            
            {/* AI Status */}
            <div className="flex items-center gap-2">
              <span className={cn('font-semibold', config.textColor)}>
                {config.title}
              </span>
              <span className="text-muted-foreground">—</span>
              <span className="text-sm text-muted-foreground">
                {aiBadge?.mainIssue || config.subtitle}
              </span>
            </div>
          </div>
          
          {/* Right section: Impact + CTA */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Estimated impact */}
            {aiBadge && (aiBadge as any).estimatedImpact > 0 && (
              <div className="text-center px-3 py-1.5 rounded-lg bg-background/80 border border-border/50 hidden md:block">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Potentiel</p>
                <p className={cn('text-lg font-bold', config.textColor)}>
                  +{((aiBadge as any).estimatedImpact || 0).toLocaleString('fr-FR')}€
                </p>
              </div>
            )}
            
            {/* Single Primary CTA */}
            {showCta && (
              <Button
                size="lg"
                onClick={onPrimaryAction}
                disabled={isLoading}
                className={cn(
                  'gap-2 font-bold px-6',
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
                    <CtaIcon className="h-4 w-4" />
                    {config.ctaLabel}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
            
            {/* Close button */}
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Priority indicator bar */}
      {badgeType === 'risk' && aiBadge?.priority === 'critical' && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500"
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ backgroundSize: '200% 200%' }}
        />
      )}
    </motion.div>
  )
})
