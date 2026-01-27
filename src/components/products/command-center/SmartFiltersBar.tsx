/**
 * Barre de filtres intelligents pour le Command Center
 * Filtres métier orientés action - Optimisé mobile
 */

import { motion, Variants } from 'framer-motion'
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
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

// Animation variants
const buttonVariants: Variants = {
  idle: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 }
}

const badgeVariants: Variants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.8, opacity: 0 }
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
    <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
      {/* Label - hidden on mobile */}
      <div className="hidden sm:flex items-center mb-2">
        <span className="text-sm font-medium text-muted-foreground">
          Filtres intelligents :
        </span>
      </div>
      
      {/* Scrollable filters for mobile */}
      <ScrollArea className="w-full">
        <div className="flex items-center gap-2 pb-2 sm:pb-0">
          <TooltipProvider>
            {filterOptions.map((option, index) => {
              const Icon = filterIcons[option.id]
              const isActive = activeFilter === option.id
              
              return (
                <Tooltip key={option.id}>
                  <TooltipTrigger asChild>
                    <motion.button
                      onClick={() => onFilterChange(option.id)}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium',
                        'transition-all duration-200 border whitespace-nowrap',
                        // Mobile optimization - larger touch targets
                        'min-h-[44px] touch-manipulation',
                        isActive 
                          ? cn(filterVariants[option.id], 'border-current/30 ring-2 ring-current/20')
                          : 'border-transparent hover:border-border bg-background/50 text-muted-foreground hover:text-foreground'
                      )}
                      variants={buttonVariants}
                      initial="idle"
                      whileHover="hover"
                      whileTap="tap"
                      layout
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="hidden sm:inline">{option.label}</span>
                      <motion.div
                        key={option.count}
                        variants={badgeVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                      >
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            'h-5 min-w-5 px-1.5 text-[10px] font-bold',
                            isActive ? 'bg-current/20 text-current' : ''
                          )}
                        >
                          {option.count}
                        </Badge>
                      </motion.div>
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="sm:hidden">
                    <p className="font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.tooltip}</p>
                  </TooltipContent>
                  <TooltipContent side="bottom" className="hidden sm:block">
                    <p>{option.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </TooltipProvider>
        </div>
        <ScrollBar orientation="horizontal" className="sm:hidden" />
      </ScrollArea>
    </div>
  )
}
