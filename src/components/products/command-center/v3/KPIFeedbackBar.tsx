/**
 * KPI Feedback Bar V3
 * KPIs repositionnés comme feedback d'action (pas décoration)
 * Max 4 KPIs visibles par défaut
 */

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

interface KPIData {
  avgMargin: number
  stockValue: number
  potentialProfit: number
  profitableProducts: number
  totalProducts: number
}

interface KPIFeedbackBarProps {
  data: KPIData
  previousData?: KPIData
  isLoading?: boolean
  currency?: string
}

interface KPIItemProps {
  label: string
  value: string | number
  unit: string
  tooltip: string
  icon: typeof TrendingUp
  trend?: {
    value: number
    direction: 'up' | 'down'
    positive: boolean
  }
  color: string
}

function KPIItem({ label, value, unit, tooltip, icon: Icon, trend, color }: KPIItemProps) {
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
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              color
            )}>
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
                trend.positive 
                  ? 'bg-emerald-500/10 text-emerald-600' 
                  : 'bg-red-500/10 text-red-600'
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
}

export function KPIFeedbackBar({
  data,
  previousData,
  isLoading = false,
  currency = '€'
}: KPIFeedbackBarProps) {
  // Calculer les tendances si données précédentes disponibles
  const calculateTrend = (current: number, previous?: number): KPIItemProps['trend'] => {
    if (!previous || previous === 0) return undefined
    const diff = ((current - previous) / previous) * 100
    return {
      value: Math.abs(diff),
      direction: diff >= 0 ? 'up' as const : 'down' as const,
      positive: diff >= 0
    }
  }
  
  const kpis: Array<KPIItemProps & { key: string }> = [
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
  ]
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div 
            key={i} 
            className="h-[72px] rounded-xl bg-muted/30 animate-pulse"
          />
        ))}
      </div>
    )
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
          <KPIItem {...kpi} />
        </motion.div>
      ))}
    </motion.div>
  )
}
