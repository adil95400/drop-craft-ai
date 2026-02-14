/**
 * ImportPerformancePanel — KPIs temps réel + Score qualité import
 * Taux de succès, vitesse, throughput, qualité, tendances
 */
import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Zap, Shield, Clock, Activity, Gauge,
  XCircle, ArrowUpRight, ArrowDownRight, Star
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
    
    const avgSpeed = activeImports.length > 0
      ? activeImports.reduce((sum, imp) => {
          const processed = imp.items_processed || imp.processed_rows || 0
          const elapsed = (Date.now() - new Date(imp.created_at).getTime()) / 1000
          return sum + (elapsed > 0 ? processed / elapsed : 0)
        }, 0) / activeImports.length
      : 0

    // Quality score: weighted combination of success rate, completeness, and error rate
    const qualityScore = computeQualityScore(stats, activeImports)

    return {
      successRate,
      failRate,
      avgSpeed: avgSpeed.toFixed(1),
      throughput: stats.successfulJobs,
      activeCount: activeImports.length,
      healthScore: successRate >= 95 ? 'excellent' : successRate >= 80 ? 'good' : successRate >= 60 ? 'fair' : 'poor',
      qualityScore,
      qualityLabel: qualityScore >= 90 ? 'Excellent' : qualityScore >= 70 ? 'Bon' : qualityScore >= 50 ? 'Moyen' : 'Faible',
    }
  }, [stats, activeImports])

  const healthColors = {
    excellent: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/30', label: 'Excellent' },
    good: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/30', label: 'Bon' },
    fair: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/30', label: 'Moyen' },
    poor: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/30', label: 'Faible' },
  }

  const health = healthColors[metrics.healthScore]
  const qualityColor = metrics.qualityScore >= 90 ? 'text-emerald-600' :
    metrics.qualityScore >= 70 ? 'text-blue-600' :
    metrics.qualityScore >= 50 ? 'text-amber-600' : 'text-red-600'
  const qualityBg = metrics.qualityScore >= 90 ? 'bg-emerald-500/10 border-emerald-500/30' :
    metrics.qualityScore >= 70 ? 'bg-blue-500/10 border-blue-500/30' :
    metrics.qualityScore >= 50 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-red-500/10 border-red-500/30'

  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-6 gap-3', className)}>
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

      {/* Quality Score */}
      <Card className={cn('border-2', qualityBg)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Star className={cn('w-5 h-5', qualityColor)} />
            <Badge variant="outline" className={cn('text-[10px]', qualityBg, qualityColor)}>
              {metrics.qualityLabel}
            </Badge>
          </div>
          <p className={cn('text-2xl font-bold', qualityColor)}>{metrics.qualityScore}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Score qualité</p>
          <Progress value={metrics.qualityScore} className="h-1 mt-2" />
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

/** Compute quality score (0-100) based on multiple factors */
function computeQualityScore(stats: ImportStats, activeImports: any[]): number {
  const total = stats.totalMethods || 1
  const successRate = (stats.successfulJobs / total) * 100
  
  // Base score from success rate (weight: 60%)
  let score = successRate * 0.6
  
  // Error rate penalty (weight: 20%)
  const errorRate = (stats.failedJobs / total) * 100
  score += Math.max(0, (100 - errorRate * 2)) * 0.2
  
  // Active job health bonus (weight: 10%)
  const stuckJobs = activeImports.filter(imp => {
    const elapsed = (Date.now() - new Date(imp.created_at).getTime()) / 1000 / 60
    return elapsed > 30 // jobs > 30 min
  }).length
  score += (stuckJobs === 0 ? 100 : Math.max(0, 100 - stuckJobs * 25)) * 0.1
  
  // Volume bonus (weight: 10%)
  const volumeScore = Math.min(100, stats.successfulJobs * 5)
  score += volumeScore * 0.1
  
  return Math.min(100, Math.round(score))
}
