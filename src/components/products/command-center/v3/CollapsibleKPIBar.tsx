/**
 * Collapsible KPI Bar V3
 * KPIs comme feedback post-action, pas comme zone d'analyse
 * Replié par défaut, visible après action ou sur demande
 */

import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, TrendingUp, TrendingDown, Package, DollarSign, Percent, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { KPI_FEEDBACK_CONFIG } from './labels'
import { AggregatedKPIs } from './utils/calculations'

interface CollapsibleKPIBarProps {
  data: AggregatedKPIs
  previousData?: AggregatedKPIs
  isLoading?: boolean
  currency?: string
  defaultExpanded?: boolean
  highlightedKPI?: 'avg_margin' | 'stock_value' | 'potential_profit' | 'profitable_products'
}

interface KPITrend {
  value: number
  direction: 'up' | 'down'
  positive: boolean
}

function calculateTrend(current: number, previous?: number): KPITrend | undefined {
  if (!previous || previous === 0) return undefined
  const diff = ((current - previous) / previous) * 100
  return {
    value: Math.abs(diff),
    direction: diff >= 0 ? 'up' : 'down',
    positive: diff >= 0
  }
}

const KPIMini = memo(function KPIMini({ 
  label, 
  value, 
  unit,
  icon: Icon,
  color,
  trend,
  isHighlighted
}: {
  label: string
  value: string | number
  unit: string
  icon: typeof TrendingUp
  color: string
  trend?: KPITrend
  isHighlighted?: boolean
}) {
  return (
    <motion.div 
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg transition-all',
        isHighlighted 
          ? 'bg-primary/10 border border-primary/30 ring-2 ring-primary/20' 
          : 'bg-muted/20 hover:bg-muted/40'
      )}
      whileHover={{ scale: 1.02 }}
      layout
    >
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', color)}>
        <Icon className="h-4 w-4" />
      </div>
      
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground truncate">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-bold tabular-nums">
            {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
          </span>
          {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
        </div>
      </div>
      
      {trend && (
        <div className={cn(
          'flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded',
          trend.positive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
        )}>
          {trend.direction === 'up' ? (
            <TrendingUp className="h-2.5 w-2.5" />
          ) : (
            <TrendingDown className="h-2.5 w-2.5" />
          )}
          {Math.abs(trend.value).toFixed(0)}%
        </div>
      )}
    </motion.div>
  )
})

export const CollapsibleKPIBar = memo(function CollapsibleKPIBar({
  data,
  previousData,
  isLoading = false,
  currency = '€',
  defaultExpanded = false,
  highlightedKPI
}: CollapsibleKPIBarProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  
  const kpis = [
    {
      key: 'avg_margin',
      label: KPI_FEEDBACK_CONFIG.avg_margin.label,
      value: data.avgMargin.toFixed(1),
      unit: KPI_FEEDBACK_CONFIG.avg_margin.unit,
      icon: Percent,
      trend: calculateTrend(data.avgMargin, previousData?.avgMargin),
      color: 'bg-blue-500/10 text-blue-500'
    },
    {
      key: 'stock_value',
      label: KPI_FEEDBACK_CONFIG.stock_value.label,
      value: Math.round(data.stockValue),
      unit: currency,
      icon: Package,
      trend: calculateTrend(data.stockValue, previousData?.stockValue),
      color: 'bg-purple-500/10 text-purple-500'
    },
    {
      key: 'potential_profit',
      label: KPI_FEEDBACK_CONFIG.potential_profit.label,
      value: Math.round(data.potentialProfit),
      unit: currency,
      icon: DollarSign,
      trend: calculateTrend(data.potentialProfit, previousData?.potentialProfit),
      color: 'bg-emerald-500/10 text-emerald-500'
    },
    {
      key: 'profitable_products',
      label: KPI_FEEDBACK_CONFIG.profitable_products.label,
      value: `${data.profitableProducts}/${data.totalProducts}`,
      unit: '',
      icon: BarChart3,
      trend: calculateTrend(data.profitableProducts, previousData?.profitableProducts),
      color: 'bg-amber-500/10 text-amber-500'
    }
  ]
  
  // Compact summary when collapsed
  const summaryKPI = kpis.find(k => k.key === 'potential_profit') || kpis[0]
  
  return (
    <div className="relative">
      {/* Collapsed State - Minimal */}
      <AnimatePresence mode="wait">
        {!isExpanded && (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between p-2 rounded-xl bg-muted/20 border border-border/30"
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">KPIs Business</span>
              <span className="text-sm font-bold text-emerald-500">
                {Math.round(data.potentialProfit).toLocaleString('fr-FR')}€
              </span>
              <span className="text-xs text-muted-foreground">profit potentiel</span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="gap-1 text-xs h-7"
            >
              Détails
              <ChevronDown className="h-3 w-3" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Expanded State - Full KPIs */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  Feedback Business
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="gap-1 text-xs h-7"
              >
                Réduire
                <ChevronDown className="h-3 w-3 rotate-180" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {kpis.map((kpi, index) => (
                <motion.div
                  key={kpi.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <KPIMini
                            {...kpi}
                            isHighlighted={highlightedKPI === kpi.key}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{KPI_FEEDBACK_CONFIG[kpi.key as keyof typeof KPI_FEEDBACK_CONFIG]?.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})
