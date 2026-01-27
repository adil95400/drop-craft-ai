/**
 * Barre de filtres intelligents pour le Command Center
 * Filtres métier orientés action
 */

import { motion } from 'framer-motion'
import { 
  AlertTriangle, TrendingUp, DollarSign, RefreshCw, 
  Sparkles, TrendingDown, Package 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { SmartFilterType, SMART_FILTER_LABELS, CommandCenterData } from './types'

interface SmartFiltersBarProps {
  activeFilter: SmartFilterType
  onFilterChange: (filter: SmartFilterType) => void
  data: CommandCenterData
  totalProducts: number
}

const filterIcons: Record<SmartFilterType, typeof Package> = {
  all: Package,
  at_risk: AlertTriangle,
  profitable: TrendingUp,
  no_price_rule: DollarSign,
  not_synced: RefreshCw,
  ai_recommended: Sparkles,
  losing_margin: TrendingDown
}

const filterVariants: Record<SmartFilterType, string> = {
  all: 'bg-muted text-muted-foreground hover:bg-muted/80',
  at_risk: 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20',
  profitable: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20',
  no_price_rule: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20',
  not_synced: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20',
  ai_recommended: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20',
  losing_margin: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
}

export function SmartFiltersBar({
  activeFilter,
  onFilterChange,
  data,
  totalProducts
}: SmartFiltersBarProps) {
  // Build filter options with counts
  const filterOptions: Array<{
    id: SmartFilterType
    label: string
    tooltip: string
    count: number
  }> = [
    { 
      id: 'all', 
      ...SMART_FILTER_LABELS.all, 
      count: totalProducts 
    },
    { 
      id: 'at_risk', 
      ...SMART_FILTER_LABELS.at_risk, 
      count: data.smartFilters.atRisk.length 
    },
    { 
      id: 'profitable', 
      ...SMART_FILTER_LABELS.profitable, 
      count: data.smartFilters.profitable.length 
    },
    { 
      id: 'no_price_rule', 
      ...SMART_FILTER_LABELS.no_price_rule, 
      count: data.smartFilters.noPriceRule.length 
    },
    { 
      id: 'not_synced', 
      ...SMART_FILTER_LABELS.not_synced, 
      count: data.smartFilters.notSynced.length 
    },
    { 
      id: 'ai_recommended', 
      ...SMART_FILTER_LABELS.ai_recommended, 
      count: data.smartFilters.aiRecommended.length 
    },
    { 
      id: 'losing_margin', 
      ...SMART_FILTER_LABELS.losing_margin, 
      count: data.smartFilters.losingMargin.length 
    }
  ]
  
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
      <span className="text-sm font-medium text-muted-foreground mr-2">
        Filtres :
      </span>
      
      <TooltipProvider>
        {filterOptions.map((option) => {
          const Icon = filterIcons[option.id]
          const isActive = activeFilter === option.id
          
          return (
            <Tooltip key={option.id}>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={() => onFilterChange(option.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
                    'transition-all duration-200 border',
                    isActive 
                      ? cn(filterVariants[option.id], 'border-current/30 ring-2 ring-current/20')
                      : 'border-transparent hover:border-border bg-background/50 text-muted-foreground hover:text-foreground'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{option.label}</span>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      'h-5 min-w-5 px-1.5 text-[10px] font-bold',
                      isActive ? 'bg-current/20 text-current' : ''
                    )}
                  >
                    {option.count}
                  </Badge>
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{option.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </TooltipProvider>
    </div>
  )
}
