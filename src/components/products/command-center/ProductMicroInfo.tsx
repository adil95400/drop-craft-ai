/**
 * Micro-informations produit pour affichage compact
 * Phase 2 - Command Center V2
 */

import { memo } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  DollarSign,
  Clock,
  Percent
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'

interface ProductMicroInfoProps {
  margin?: number
  lastSyncedAt?: string
  hasPriceRule?: boolean
  qualityScore?: number
  variant?: 'inline' | 'stacked'
  compact?: boolean
}

export const ProductMicroInfo = memo(function ProductMicroInfo({
  margin,
  lastSyncedAt,
  hasPriceRule,
  qualityScore,
  variant = 'inline',
  compact = false
}: ProductMicroInfoProps) {
  const items = []

  // Marge
  if (margin !== undefined && margin !== null) {
    const isPositive = margin > 0
    const isHealthy = margin >= 30
    const isWarning = margin >= 15 && margin < 30
    
    items.push({
      id: 'margin',
      icon: isPositive ? TrendingUp : TrendingDown,
      label: `${margin >= 0 ? '+' : ''}${margin.toFixed(0)}%`,
      tooltip: `Marge: ${margin.toFixed(1)}%`,
      className: cn(
        isHealthy && 'text-emerald-600',
        isWarning && 'text-amber-600',
        !isHealthy && !isWarning && 'text-red-600'
      )
    })
  }

  // Dernière synchronisation
  if (lastSyncedAt) {
    const syncDate = new Date(lastSyncedAt)
    const hoursSince = (Date.now() - syncDate.getTime()) / (1000 * 60 * 60)
    const isRecent = hoursSince < 24
    
    items.push({
      id: 'sync',
      icon: RefreshCw,
      label: formatDistanceToNow(syncDate, { addSuffix: false, locale: getDateFnsLocale() }),
      tooltip: `Dernière sync: ${syncDate.toLocaleDateString('fr-FR')} ${syncDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      className: isRecent ? 'text-emerald-600' : 'text-muted-foreground'
    })
  }

  // Règle de prix
  if (hasPriceRule !== undefined) {
    items.push({
      id: 'price_rule',
      icon: DollarSign,
      label: hasPriceRule ? 'Règle' : 'Sans règle',
      tooltip: hasPriceRule ? 'Règle de prix appliquée' : 'Aucune règle de tarification',
      className: hasPriceRule ? 'text-blue-600' : 'text-muted-foreground'
    })
  }

  // Score qualité
  if (qualityScore !== undefined && qualityScore !== null) {
    const isExcellent = qualityScore >= 80
    const isGood = qualityScore >= 60 && qualityScore < 80
    
    items.push({
      id: 'quality',
      icon: Percent,
      label: `${qualityScore}`,
      tooltip: `Score qualité: ${qualityScore}/100`,
      className: cn(
        isExcellent && 'text-emerald-600',
        isGood && 'text-amber-600',
        !isExcellent && !isGood && 'text-red-600'
      )
    })
  }

  if (items.length === 0) return null

  return (
    <TooltipProvider>
      <div className={cn(
        'flex gap-2',
        variant === 'stacked' && 'flex-col gap-1',
        variant === 'inline' && 'flex-wrap items-center'
      )}>
        {items.map((item) => {
          const Icon = item.icon
          
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <div className={cn(
                  'flex items-center gap-1 cursor-default transition-colors',
                  compact ? 'text-[10px]' : 'text-xs',
                  item.className
                )}>
                  <Icon className={cn(compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
                  <span className="font-medium">{item.label}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{item.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
})
