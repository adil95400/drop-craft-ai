/**
 * KPI Feedback Bar V3 - Optimized with Micro-Animations
 * KPIs repositionnés comme feedback d'action (pas décoration)
 * Utilise les utilitaires centralisés et memo pour performance
 * Sprint 3: Added micro-animations for value changes
 */

import { memo, useMemo, useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  highlightedKPI?: string // For triggering highlight animation
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
  numericValue: number
  unit: string
  tooltip: string
  icon: typeof TrendingUp
  trend?: KPITrend
  color: string
}

// Animated value display
const AnimatedValue = memo(function AnimatedValue({ 
  value, 
  previousValue,
  isHighlighted 
}: { 
  value: number
  previousValue?: number
  isHighlighted?: boolean 
}) {
  const [displayValue, setDisplayValue] = useState(value)
  const prevRef = useRef(value)
  
  useEffect(() => {
    if (value === prevRef.current) return
    
    const start = prevRef.current
    const end = value
    const duration = 600
    const startTime = performance.now()
    
    const animate = (time: number) => {
      const elapsed = time - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(start + (end - start) * eased)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setDisplayValue(end)
        prevRef.current = end
      }
    }
    
    requestAnimationFrame(animate)
  }, [value])
  
  return (
    <motion.span
      className="tabular-nums"
      animate={isHighlighted ? { 
        scale: [1, 1.1, 1],
        color: ['inherit', 'hsl(var(--primary))', 'inherit']
      } : {}}
      transition={{ duration: 0.4 }}
    >
      {displayValue.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}
    </motion.span>
  )
})

// Memoized KPI Item with micro-animations
const KPIItem = memo(function KPIItem({ 
  label, 
  value, 
  numericValue,
  unit, 
  tooltip, 
  icon: Icon, 
  trend, 
  color,
  isHighlighted,
  previousNumericValue
}: Omit<KPIConfig, 'key'> & { 
  isHighlighted?: boolean
  previousNumericValue?: number 
}) {
  const hasChanged = previousNumericValue !== undefined && numericValue !== previousNumericValue
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div 
            className={cn(
              'relative flex items-center gap-3 px-4 py-3 rounded-xl overflow-hidden',
              'bg-muted/30 border border-border/50',
              'hover:bg-muted/50 transition-colors cursor-default'
            )}
            whileHover={{ scale: 1.02 }}
            animate={isHighlighted ? { 
              borderColor: ['hsl(var(--border))', 'hsl(var(--primary))', 'hsl(var(--border))']
            } : {}}
            transition={{ duration: 0.6 }}
          >
            {/* Highlight pulse overlay */}
            <AnimatePresence>
              {isHighlighted && (
                <motion.div
                  className="absolute inset-0 bg-primary/10 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.3, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                />
              )}
            </AnimatePresence>
            
            <motion.div 
              className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}
              animate={isHighlighted ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Icon className="h-5 w-5" />
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">{label}</p>
              <div className="flex items-baseline gap-1">
                {typeof value === 'number' ? (
                  <AnimatedValue 
                    value={value} 
                    previousValue={previousNumericValue}
                    isHighlighted={isHighlighted}
                  />
                ) : (
                  <span className="text-lg font-bold tabular-nums">{value}</span>
                )}
                {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
              </div>
            </div>
            
            {trend && (
              <motion.div 
                className={cn(
                  'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md',
                  trend.positive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                )}
                initial={hasChanged ? { scale: 0.8, opacity: 0 } : false}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {trend.direction === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(trend.value).toFixed(1)}%
              </motion.div>
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
  currency = '€',
  highlightedKPI
}: KPIFeedbackBarProps) {
  // Memoize KPI configurations with numeric values for animation
  const kpis = useMemo((): KPIConfig[] => [
    {
      key: 'avg_margin',
      label: KPI_FEEDBACK_CONFIG.avg_margin.label,
      value: parseFloat(data.avgMargin.toFixed(1)),
      numericValue: data.avgMargin,
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
      numericValue: data.stockValue,
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
      numericValue: data.potentialProfit,
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
      numericValue: data.profitableProducts,
      unit: '',
      tooltip: KPI_FEEDBACK_CONFIG.profitable_products.tooltip,
      icon: BarChart3,
      trend: calculateTrend(data.profitableProducts, previousData?.profitableProducts),
      color: 'bg-amber-500/10 text-amber-500'
    }
  ], [data, previousData, currency])
  
  // Get previous numeric values for animations
  const previousValues = useMemo(() => ({
    avg_margin: previousData?.avgMargin,
    stock_value: previousData?.stockValue,
    potential_profit: previousData?.potentialProfit,
    profitable_products: previousData?.profitableProducts
  }), [previousData])
  
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
            numericValue={kpi.numericValue}
            unit={kpi.unit}
            tooltip={kpi.tooltip}
            icon={kpi.icon}
            trend={kpi.trend}
            color={kpi.color}
            isHighlighted={highlightedKPI === kpi.key}
            previousNumericValue={previousValues[kpi.key as keyof typeof previousValues]}
          />
        </motion.div>
      ))}
    </motion.div>
  )
})
