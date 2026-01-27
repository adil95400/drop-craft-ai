/**
 * Mini-dashboard ROI temps réel
 * Affiche les métriques de rentabilité clés avec tendances
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, TrendingDown, Minus, DollarSign,
  Percent, Package, ShoppingCart, Target, BarChart3
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface ROIMetric {
  label: string
  value: number
  previousValue?: number
  format: 'currency' | 'percent' | 'number'
  icon: typeof DollarSign
  target?: number
}

interface ROIMiniDashboardProps {
  products: Array<{
    id: string
    price?: number
    cost_price?: number
    stock_quantity?: number
    profit_margin?: number
  }>
  currency?: string
  isLoading?: boolean
}

export function ROIMiniDashboard({
  products,
  currency = '€',
  isLoading = false
}: ROIMiniDashboardProps) {
  // Calculer les métriques ROI
  const metrics = useMemo(() => {
    if (products.length === 0) return null

    // Marge moyenne
    const margins = products
      .map(p => {
        if (p.profit_margin) return p.profit_margin
        if (p.price && p.cost_price && p.price > 0) {
          return ((p.price - p.cost_price) / p.price) * 100
        }
        return null
      })
      .filter((m): m is number => m !== null)

    const avgMargin = margins.length > 0
      ? margins.reduce((a, b) => a + b, 0) / margins.length
      : 0

    // Valeur totale du stock
    const stockValue = products.reduce((sum, p) => {
      const qty = p.stock_quantity || 0
      const price = p.price || 0
      return sum + (qty * price)
    }, 0)

    // Profit potentiel (basé sur la marge et le stock)
    const potentialProfit = products.reduce((sum, p) => {
      const qty = p.stock_quantity || 0
      const price = p.price || 0
      const cost = p.cost_price || price * 0.7 // Estimation si pas de coût
      return sum + (qty * (price - cost))
    }, 0)

    // Produits rentables (marge > 30%)
    const profitableProducts = products.filter(p => {
      const margin = p.profit_margin || 
        (p.price && p.cost_price ? ((p.price - p.cost_price) / p.price) * 100 : 0)
      return margin > 30
    }).length

    // Score de santé ROI (0-100)
    const healthScore = Math.min(100, Math.round(
      (avgMargin > 25 ? 40 : avgMargin * 1.6) +
      (profitableProducts / products.length * 40) +
      (stockValue > 0 ? 20 : 0)
    ))

    return {
      avgMargin,
      stockValue,
      potentialProfit,
      profitableProducts,
      totalProducts: products.length,
      healthScore
    }
  }, [products])

  if (isLoading) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Pilotage ROI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 rounded-lg bg-muted/50 animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) {
    return null
  }

  const formatValue = (value: number, format: 'currency' | 'percent' | 'number') => {
    switch (format) {
      case 'currency':
        return `${value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}${currency}`
      case 'percent':
        return `${value.toFixed(1)}%`
      case 'number':
        return value.toLocaleString('fr-FR')
    }
  }

  const getTrendIcon = (current: number, previous?: number) => {
    if (!previous) return Minus
    if (current > previous * 1.05) return TrendingUp
    if (current < previous * 0.95) return TrendingDown
    return Minus
  }

  const getTrendColor = (current: number, previous?: number, inverse = false) => {
    if (!previous) return 'text-muted-foreground'
    const isUp = current > previous * 1.05
    const isDown = current < previous * 0.95
    if (inverse) {
      if (isUp) return 'text-red-500'
      if (isDown) return 'text-emerald-500'
    } else {
      if (isUp) return 'text-emerald-500'
      if (isDown) return 'text-red-500'
    }
    return 'text-muted-foreground'
  }

  const kpis: ROIMetric[] = [
    {
      label: 'Marge moyenne',
      value: metrics.avgMargin,
      format: 'percent',
      icon: Percent,
      target: 30
    },
    {
      label: 'Valeur stock',
      value: metrics.stockValue,
      format: 'currency',
      icon: Package
    },
    {
      label: 'Profit potentiel',
      value: metrics.potentialProfit,
      format: 'currency',
      icon: DollarSign
    },
    {
      label: 'Produits rentables',
      value: metrics.profitableProducts,
      format: 'number',
      icon: ShoppingCart,
      target: Math.round(metrics.totalProducts * 0.7)
    }
  ]

  return (
    <TooltipProvider>
      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              Pilotage ROI temps réel
            </CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className={cn(
                    'text-xs',
                    metrics.healthScore >= 70 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' 
                      : metrics.healthScore >= 40
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                        : 'bg-red-500/10 border-red-500/30 text-red-600'
                  )}
                >
                  <Target className="h-3 w-3 mr-1" />
                  Santé: {metrics.healthScore}%
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Score de santé ROI basé sur la marge, le stock et la rentabilité</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {kpis.map((kpi, index) => {
              const Icon = kpi.icon
              const TrendIcon = getTrendIcon(kpi.value, kpi.previousValue)
              const progressValue = kpi.target 
                ? Math.min(100, (kpi.value / kpi.target) * 100)
                : undefined
              
              return (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative p-3 rounded-lg bg-background/50 border border-border/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {kpi.previousValue !== undefined && (
                      <TrendIcon className={cn('h-3 w-3', getTrendColor(kpi.value, kpi.previousValue))} />
                    )}
                  </div>
                  
                  <div className="text-lg font-bold">
                    {formatValue(kpi.value, kpi.format)}
                  </div>
                  
                  <div className="text-[10px] text-muted-foreground truncate">
                    {kpi.label}
                  </div>
                  
                  {progressValue !== undefined && (
                    <div className="mt-2">
                      <Progress 
                        value={progressValue} 
                        className="h-1"
                      />
                      <div className="text-[9px] text-muted-foreground mt-0.5">
                        Objectif: {formatValue(kpi.target!, kpi.format)}
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
