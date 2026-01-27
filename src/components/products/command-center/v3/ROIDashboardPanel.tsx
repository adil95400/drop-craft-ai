/**
 * Command Center V3 - Phase 3: ROI Dashboard Panel
 * Real-time ROI metrics and projections
 */

import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Target,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ROIMetrics } from './usePredictiveInsights'

interface ROIDashboardPanelProps {
  metrics: ROIMetrics
  currency?: string
  isLoading?: boolean
}

export function ROIDashboardPanel({
  metrics,
  currency = '€',
  isLoading = false
}: ROIDashboardPanelProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-5 rounded bg-muted animate-pulse" />
          <div className="h-5 w-32 rounded bg-muted animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const TrendIcon = metrics.roiTrend === 'up' 
    ? TrendingUp 
    : metrics.roiTrend === 'down' 
      ? TrendingDown 
      : Minus

  const trendColor = metrics.roiTrend === 'up'
    ? 'text-emerald-600 dark:text-emerald-400'
    : metrics.roiTrend === 'down'
      ? 'text-destructive'
      : 'text-muted-foreground'

  const roiProgress = Math.min(100, Math.max(0, (metrics.currentROI / 50) * 100))

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
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">ROI Temps Réel</h3>
            <p className="text-xs text-muted-foreground">
              Performances et projections
            </p>
          </div>
        </div>
        <div className={cn("flex items-center gap-1", trendColor)}>
          <TrendIcon className="h-4 w-4" />
          <span className="text-sm font-medium">
            {metrics.roiTrend === 'up' ? '+' : metrics.roiTrend === 'down' ? '-' : ''}
            {Math.abs(metrics.projectedROI - metrics.currentROI).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Main ROI Display */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">ROI Actuel</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">
                {metrics.currentROI.toFixed(1)}%
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm text-muted-foreground cursor-help">
                      → {metrics.projectedROI.toFixed(1)}%
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>ROI projeté après optimisation</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-1">Objectif</p>
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-lg font-semibold">50%</span>
            </div>
          </div>
        </div>
        <Progress value={roiProgress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">
          {roiProgress < 40 
            ? 'Marge d\'amélioration significative' 
            : roiProgress < 80 
              ? 'Performance correcte, optimisation possible'
              : 'Excellent niveau de rentabilité'}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-px bg-border/50">
        <MetricCard
          icon={DollarSign}
          label="Valeur du stock"
          value={formatCurrency(metrics.totalStockValue)}
          subtext="Prix de vente total"
          variant="default"
        />
        <MetricCard
          icon={ArrowUpRight}
          label="CA projeté (30j)"
          value={formatCurrency(metrics.projectedRevenue30d)}
          subtext="Estimation basée sur rotation"
          variant="success"
        />
        <MetricCard
          icon={Sparkles}
          label="Gain potentiel"
          value={`+${formatCurrency(metrics.potentialGainWithOptimization)}`}
          subtext="Avec optimisation IA"
          variant="primary"
        />
        <MetricCard
          icon={AlertTriangle}
          label="CA à risque"
          value={formatCurrency(metrics.atRiskRevenue)}
          subtext="Produits en rupture prévue"
          variant={metrics.atRiskRevenue > 0 ? 'warning' : 'default'}
        />
      </div>
    </motion.div>
  )
}

interface MetricCardProps {
  icon: typeof DollarSign
  label: string
  value: string
  subtext: string
  variant: 'default' | 'success' | 'warning' | 'primary'
}

function MetricCard({ icon: Icon, label, value, subtext, variant }: MetricCardProps) {
  const variantStyles = {
    default: 'bg-card/50',
    success: 'bg-emerald-500/5',
    warning: 'bg-orange-500/5',
    primary: 'bg-primary/5'
  }

  const iconStyles = {
    default: 'text-muted-foreground',
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-orange-600 dark:text-orange-400',
    primary: 'text-primary'
  }

  return (
    <div className={cn("p-4", variantStyles[variant])}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("h-4 w-4", iconStyles[variant])} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-1">{subtext}</p>
    </div>
  )
}

function formatCurrency(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M€`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K€`
  return `${value.toFixed(0)}€`
}
