/**
 * ImportPerformancePanel — KPIs temps réel du moteur d'import
 * Taux de succès, vitesse, throughput, tendances
 */
import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Zap, TrendingUp, Shield, Clock, Activity, Gauge,
  CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImportStats {
  totalMethods: number
  successfulJobs: number
  failedJobs: number
  pendingJobs: number
}

interface ImportPerformancePanelProps {
  stats: ImportStats
  activeImports: any[]
  className?: string
}

export function ImportPerformancePanel({ stats, activeImports, className }: ImportPerformancePanelProps) {
  const metrics = useMemo(() => {
    const total = stats.totalMethods || 1
    const successRate = Math.round((stats.successfulJobs / total) * 100)
    const failRate = Math.round((stats.failedJobs / total) * 100)
    
    // Simulated avg speed based on active imports
    const avgSpeed = activeImports.length > 0
      ? activeImports.reduce((sum, imp) => {
          const processed = imp.items_processed || imp.processed_rows || 0
          const elapsed = (Date.now() - new Date(imp.created_at).getTime()) / 1000
          return sum + (elapsed > 0 ? processed / elapsed : 0)
        }, 0) / activeImports.length
      : 0

    return {
      successRate,
      failRate,
      avgSpeed: avgSpeed.toFixed(1),
      throughput: stats.successfulJobs,
      activeCount: activeImports.length,
      healthScore: successRate >= 95 ? 'excellent' : successRate >= 80 ? 'good' : successRate >= 60 ? 'fair' : 'poor',
    }
  }, [stats, activeImports])

  const healthColors = {
    excellent: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/30', label: 'Excellent' },
    good: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/30', label: 'Bon' },
    fair: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/30', label: 'Moyen' },
    poor: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/30', label: 'Faible' },
  }

  const health = healthColors[metrics.healthScore]

  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-5 gap-3', className)}>
      {/* Health Score */}
      <Card className={cn('border-2', health.border)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Shield className={cn('w-5 h-5', health.text)} />
            <Badge variant="outline" className={cn('text-[10px]', health.bg, health.text)}>
              {health.label}
            </Badge>
          </div>
          <p className={cn('text-2xl font-bold', health.text)}>{metrics.successRate}%</p>
          <p className="text-xs text-muted-foreground mt-0.5">Taux de succès</p>
          <Progress value={metrics.successRate} className="h-1 mt-2" />
        </CardContent>
      </Card>

      {/* Speed */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Gauge className="w-5 h-5 text-primary" />
            {metrics.activeCount > 0 && (
              <div className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-primary animate-pulse" />
                <span className="text-[10px] text-primary font-medium">LIVE</span>
              </div>
            )}
          </div>
          <p className="text-2xl font-bold">{metrics.avgSpeed}</p>
          <p className="text-xs text-muted-foreground mt-0.5">produits/sec</p>
        </CardContent>
      </Card>

      {/* Throughput */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold">{metrics.throughput.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Produits importés</p>
        </CardContent>
      </Card>

      {/* Active */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold">{metrics.activeCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Imports actifs</p>
        </CardContent>
      </Card>

      {/* Errors */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="w-5 h-5 text-destructive" />
            {metrics.failRate > 10 && (
              <ArrowDownRight className="w-4 h-4 text-destructive" />
            )}
          </div>
          <p className="text-2xl font-bold">{stats.failedJobs}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Échecs ({metrics.failRate}%)</p>
        </CardContent>
      </Card>
    </div>
  )
}
