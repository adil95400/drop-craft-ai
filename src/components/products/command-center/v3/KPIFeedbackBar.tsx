/**
 * KPI Feedback Bar V3 - Optimized
 * KPIs repositionnés comme feedback d'action (pas décoration)
 * Utilise les utilitaires centralisés et memo pour performance
 */

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Package, DollarSign, Percent, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { KPI_FEEDBACK_CONFIG } from './labels'
import { AggregatedKPIs } from './utils/calculations'
import { KPIBarSkeleton } from './utils/skeletons'

interface KPIFeedbackBarProps {
  data: AggregatedKPIs
  previousData?: AggregatedKPIs
  isLoading?: boolean
  currency?: string
}

interface KPITrend {
  value: number
  direction: 'up' | 'down'
  positive: boolean
}

interface KPIConfig {
  key: string
  label: string
  value: string | number
  unit: string
  tooltip: string
  icon: typeof TrendingUp
  trend?: KPITrend
  color: string
}

// Memoized KPI Item
const KPIItem = memo(function KPIItem({ 
  label, 
  value, 
  unit, 
  tooltip, 
  icon: Icon, 
  trend, 
  color 
}: Omit<KPIConfig, 'key'>) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div 
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl',
              'bg-muted/30 border border-border/50',
              'hover:bg-muted/50 transition-colors cursor-default'
            )}
            whileHover={{ scale: 1.02 }}
          >
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
              <Icon className="h-5 w-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">{label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold tabular-nums">
                  {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
                </span>
                {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
              </div>
            </div>
            
            {trend && (
              <div className={cn(
                'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md',
                trend.positive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
              )}>
                {trend.direction === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(trend.value).toFixed(1)}%
              </div>
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
})

// Trend calculation helper
function calculateTrend(current: number, previous?: number): KPITrend | undefined {
  if (!previous || previous === 0) return undefined
  const diff = ((current - previous) / previous) * 100
  return {
    value: Math.abs(diff),
    direction: diff >= 0 ? 'up' : 'down',
    positive: diff >= 0
  }
}

export const KPIFeedbackBar = memo(function KPIFeedbackBar({
  data,
  previousData,
  isLoading = false,
  currency = '€'
}: KPIFeedbackBarProps) {
  // Memoize KPI configurations
  const kpis = useMemo((): KPIConfig[] => [
    {
      key: 'avg_margin',
      label: KPI_FEEDBACK_CONFIG.avg_margin.label,
      value: data.avgMargin.toFixed(1),
      unit: KPI_FEEDBACK_CONFIG.avg_margin.unit,
      tooltip: KPI_FEEDBACK_CONFIG.avg_margin.tooltip,
      icon: Percent,
      trend: calculateTrend(data.avgMargin, previousData?.avgMargin),
      color: 'bg-blue-500/10 text-blue-500'
    },
    {
      key: 'stock_value',
      label: KPI_FEEDBACK_CONFIG.stock_value.label,
      value: Math.round(data.stockValue),
      unit: currency,
      tooltip: KPI_FEEDBACK_CONFIG.stock_value.tooltip,
      icon: Package,
      trend: calculateTrend(data.stockValue, previousData?.stockValue),
      color: 'bg-purple-500/10 text-purple-500'
    },
    {
      key: 'potential_profit',
      label: KPI_FEEDBACK_CONFIG.potential_profit.label,
      value: Math.round(data.potentialProfit),
      unit: currency,
      tooltip: KPI_FEEDBACK_CONFIG.potential_profit.tooltip,
      icon: DollarSign,
      trend: calculateTrend(data.potentialProfit, previousData?.potentialProfit),
      color: 'bg-emerald-500/10 text-emerald-500'
    },
    {
      key: 'profitable_products',
      label: KPI_FEEDBACK_CONFIG.profitable_products.label,
      value: `${data.profitableProducts}/${data.totalProducts}`,
      unit: '',
      tooltip: KPI_FEEDBACK_CONFIG.profitable_products.tooltip,
      icon: BarChart3,
      trend: calculateTrend(data.profitableProducts, previousData?.profitableProducts),
      color: 'bg-amber-500/10 text-amber-500'
    }
  ], [data, previousData, currency])
  
  if (isLoading) {
    return <KPIBarSkeleton />
  }
  
  return (
    <motion.div 
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {kpis.map((kpi, index) => (
        <motion.div
          key={kpi.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + index * 0.05 }}
        >
          <KPIItem
            label={kpi.label}
            value={kpi.value}
            unit={kpi.unit}
            tooltip={kpi.tooltip}
            icon={kpi.icon}
            trend={kpi.trend}
            color={kpi.color}
          />
        </motion.div>
      ))}
    </motion.div>
  )
})
