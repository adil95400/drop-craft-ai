/**
 * AIDecisionFilters - Filtres décisionnels IA pour le Command Center
 * Sprint 4: Filtre "À traiter" prioritaire et mis en avant
 */

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  Brain, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle,
  Sparkles,
  X,
  Zap
} from 'lucide-react'

export type AIFilterType = 'all' | 'to_process' | 'risk' | 'opportunity' | 'optimized'

interface AIFilterConfig {
  id: AIFilterType
  label: string
  shortLabel: string
  emoji: string
  icon: typeof Brain
  description: string
  colors: {
    active: string
    inactive: string
  }
  isPrimary?: boolean
}

const AI_FILTERS: AIFilterConfig[] = [
  {
    id: 'to_process',
    label: 'À traiter maintenant',
    shortLabel: 'À traiter',
    emoji: '🎯',
    icon: Zap,
    description: 'Produits nécessitant une action immédiate',
    colors: {
      active: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent shadow-lg shadow-amber-500/30',
      inactive: 'bg-warning/10 text-warning border-amber-500/30 hover:bg-warning/20'
    },
    isPrimary: true
  },
  {
    id: 'risk',
    label: 'Actions requises',
    shortLabel: 'Risques',
    emoji: '⚠️',
    icon: AlertTriangle,
    description: 'Problèmes critiques à corriger',
    colors: {
      active: 'bg-destructive text-white border-transparent',
      inactive: 'bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20'
    }
  },
  {
    id: 'opportunity',
    label: 'Opportunités',
    shortLabel: 'Opportunités',
    emoji: '💰',
    icon: TrendingUp,
    description: 'Gains potentiels identifiés',
    colors: {
      active: 'bg-success text-white border-transparent',
      inactive: 'bg-success/10 text-success border-emerald-500/30 hover:bg-success/20'
    }
  },
  {
    id: 'optimized',
    label: 'Optimisés',
    shortLabel: 'OK',
    emoji: '✅',
    icon: CheckCircle,
    description: 'Produits performants',
    colors: {
      active: 'bg-info text-white border-transparent',
      inactive: 'bg-info/10 text-info border-info/30 hover:bg-info/20'
    }
  },
  {
    id: 'all',
    label: 'Tous les produits',
    shortLabel: 'Tous',
    emoji: '📦',
    icon: Sparkles,
    description: 'Afficher tout le catalogue',
    colors: {
      active: 'bg-primary text-primary-foreground border-transparent',
      inactive: 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
    }
  }
]

interface AIDecisionFiltersProps {
  activeFilter: AIFilterType
  onFilterChange: (filter: AIFilterType) => void
  counts: {
    all: number
    to_process: number
    risk: number
    opportunity: number
    optimized: number
  }
  className?: string
}

export const AIDecisionFilters = memo(function AIDecisionFilters({
  activeFilter,
  onFilterChange,
  counts,
  className
}: AIDecisionFiltersProps) {
  const getFilterCount = (id: AIFilterType): number => {
    switch (id) {
      case 'to_process': return counts.to_process
      case 'risk': return counts.risk
      case 'opportunity': return counts.opportunity
      case 'optimized': return counts.optimized
      case 'all': return counts.all
      default: return 0
    }
  }
  
  return (
    <div className={cn('space-y-3', className)}>
      {/* Header avec indicateur IA */}
      <div className="flex items-center gap-2 text-sm">
        <Brain className="h-4 w-4 text-primary" />
        <span className="font-medium text-foreground">Filtres décisionnels IA</span>
        <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/30">
          Auto
        </Badge>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {AI_FILTERS.map((filter) => {
          const Icon = filter.icon
          const isActive = activeFilter === filter.id
          const count = getFilterCount(filter.id)
          
          return (
            <motion.div
              key={filter.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFilterChange(filter.id)}
                className={cn(
                  'gap-2 transition-all duration-200 border',
                  filter.isPrimary && !isActive && 'ring-2 ring-amber-500/30 ring-offset-1 ring-offset-background',
                  isActive ? filter.colors.active : filter.colors.inactive
                )}
              >
                {/* Emoji for instant recognition */}
                <span className="text-sm">{filter.emoji}</span>
                
                {/* Label - hide on small screens for non-primary */}
                <span className={cn(
                  "font-medium",
                  filter.isPrimary ? '' : 'hidden sm:inline'
                )}>
                  {filter.isPrimary ? filter.label : filter.shortLabel}
                </span>
                
                {/* Count badge */}
                {count > 0 && (
                  <Badge 
                    variant={isActive ? 'secondary' : 'outline'} 
                    className={cn(
                      'h-5 min-w-[20px] px-1.5 text-xs font-bold',
                      isActive && 'bg-white/20 text-inherit border-0',
                      filter.isPrimary && !isActive && 'bg-warning/20 text-amber-700 border-amber-500/30'
                    )}
                  >
                    {count}
                  </Badge>
                )}
                
                {/* Pulse for primary with items */}
                {filter.isPrimary && count > 0 && !isActive && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="h-2 w-2 rounded-full bg-warning"
                  />
                )}
              </Button>
            </motion.div>
          )
        })}
      </div>
      
      {/* Active filter indicator */}
      {activeFilter !== 'all' && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm"
        >
          <span className="text-muted-foreground">Filtre actif:</span>
          <Badge 
            variant="secondary" 
            className="gap-1 pr-1"
          >
            {AI_FILTERS.find(f => f.id === activeFilter)?.emoji}
            {AI_FILTERS.find(f => f.id === activeFilter)?.label}
            <button 
              onClick={() => onFilterChange('all')}
              className="ml-1 p-0.5 rounded hover:bg-destructive/20 transition-colors"
            >
              <X className="h-3 w-3 hover:text-destructive" />
            </button>
          </Badge>
        </motion.div>
      )}
    </div>
  )
})

/**
 * AIDecisionFilterBar - Version compacte pour les headers
 */
export const AIDecisionFilterBar = memo(function AIDecisionFilterBar({
  activeFilter,
  onFilterChange,
  toProcessCount,
  className
}: {
  activeFilter: AIFilterType
  onFilterChange: (filter: AIFilterType) => void
  toProcessCount: number
  className?: string
}) {
  const isProcessActive = activeFilter === 'to_process'
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          variant={isProcessActive ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange(isProcessActive ? 'all' : 'to_process')}
          className={cn(
            'gap-2 font-bold',
            isProcessActive 
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg' 
              : 'bg-warning/10 text-warning border-amber-500/30 hover:bg-warning/20 ring-2 ring-amber-500/20'
          )}
        >
          <span>🎯</span>
          <span>À traiter</span>
          {toProcessCount > 0 && (
            <Badge 
              variant="secondary" 
              className={cn(
                'h-5 min-w-[20px] px-1.5 text-xs font-bold',
                isProcessActive ? 'bg-white/20 text-white border-0' : 'bg-warning/20 text-amber-700'
              )}
            >
              {toProcessCount}
            </Badge>
          )}
          {toProcessCount > 0 && !isProcessActive && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="h-2 w-2 rounded-full bg-warning"
            />
          )}
        </Button>
      </motion.div>
      
      {isProcessActive && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFilterChange('all')}
          className="text-xs text-muted-foreground"
        >
          <X className="h-3 w-3 mr-1" />
          Voir tout
        </Button>
      )}
    </div>
  )
})
