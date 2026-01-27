/**
 * Command Center V3 - Phase 3: Trend Analysis Panel
 * Category trends and market insights
 */

import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  BarChart2,
  ArrowRight,
  Lightbulb
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendAnalysis } from './usePredictiveInsights'

interface TrendAnalysisPanelProps {
  trends: TrendAnalysis[]
  onCategoryClick?: (category: string) => void
  isLoading?: boolean
}

export function TrendAnalysisPanel({
  trends,
  onCategoryClick,
  isLoading = false
}: TrendAnalysisPanelProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-5 rounded bg-muted animate-pulse" />
          <div className="h-5 w-32 rounded bg-muted animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (trends.length === 0) {
    return (
      <motion.div 
        className="rounded-xl border border-border/50 bg-muted/30 p-6 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <BarChart2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Données insuffisantes pour l'analyse des tendances
        </p>
      </motion.div>
    )
  }

  const growingCount = trends.filter(t => t.trend === 'growing').length
  const decliningCount = trends.filter(t => t.trend === 'declining').length

  return (
    <motion.div 
      className="rounded-xl border border-border/50 bg-card/50 overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <BarChart2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Tendances Catégories</h3>
            <p className="text-xs text-muted-foreground">
              Analyse basée sur marges et stocks
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {growingCount > 0 && (
            <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0">
              <TrendingUp className="h-3 w-3 mr-1" />
              {growingCount}
            </Badge>
          )}
          {decliningCount > 0 && (
            <Badge variant="secondary" className="text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400 border-0">
              <TrendingDown className="h-3 w-3 mr-1" />
              {decliningCount}
            </Badge>
          )}
        </div>
      </div>

      {/* Trends List */}
      <div className="divide-y divide-border/50">
        {trends.slice(0, 5).map((trend, index) => (
          <TrendRow
            key={trend.category}
            trend={trend}
            index={index}
            onClick={() => onCategoryClick?.(trend.category)}
          />
        ))}
      </div>

      {/* Insight Footer */}
      <div className="p-3 border-t border-border/50 bg-primary/5">
        <div className="flex items-start gap-2">
          <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            {growingCount > decliningCount
              ? `${growingCount} catégories en croissance, concentrez vos efforts sur celles-ci`
              : decliningCount > growingCount
                ? `${decliningCount} catégories en déclin, revoyez votre stratégie prix`
                : 'Performances équilibrées, maintenez vos efforts actuels'}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

interface TrendRowProps {
  trend: TrendAnalysis
  index: number
  onClick?: () => void
}

function TrendRow({ trend, index, onClick }: TrendRowProps) {
  const trendConfig = {
    growing: {
      icon: TrendingUp,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      label: 'En croissance'
    },
    declining: {
      icon: TrendingDown,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-500/10',
      label: 'En déclin'
    },
    stable: {
      icon: Minus,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
      label: 'Stable'
    }
  }

  const config = trendConfig[trend.trend]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors group cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={cn("p-1.5 rounded-lg", config.bgColor)}>
          <Icon className={cn("h-3.5 w-3.5", config.color)} />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{trend.category}</p>
          <p className="text-xs text-muted-foreground">{config.label}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className={cn(
            "text-sm font-medium",
            trend.changePercent > 0 ? 'text-emerald-600 dark:text-emerald-400' : 
            trend.changePercent < 0 ? 'text-orange-600 dark:text-orange-400' : 
            'text-muted-foreground'
          )}>
            {trend.changePercent > 0 ? '+' : ''}{trend.changePercent.toFixed(1)}%
          </p>
          <p className="text-[10px] text-muted-foreground">vs objectif 20%</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  )
}
