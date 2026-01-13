/**
 * ChannableChannelHealth - Indicateur de santé des canaux style Channable
 * Score de santé visuel avec breakdown détaillé
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  CheckCircle2, AlertTriangle, XCircle, HelpCircle,
  Zap, Clock, Shield, Database
} from 'lucide-react'

interface HealthMetric {
  id: string
  label: string
  score: number
  maxScore: number
  status: 'good' | 'warning' | 'critical'
  description?: string
}

interface ChannableChannelHealthProps {
  metrics: HealthMetric[]
  overallScore?: number
  channelName?: string
  lastChecked?: string
  className?: string
  compact?: boolean
}

const STATUS_CONFIG = {
  good: { color: 'text-green-500', bg: 'bg-green-500', icon: CheckCircle2 },
  warning: { color: 'text-amber-500', bg: 'bg-amber-500', icon: AlertTriangle },
  critical: { color: 'text-red-500', bg: 'bg-red-500', icon: XCircle },
}

export function ChannableChannelHealth({
  metrics,
  overallScore,
  channelName,
  lastChecked,
  className,
  compact = false
}: ChannableChannelHealthProps) {
  const calculatedScore = useMemo(() => {
    if (overallScore !== undefined) return overallScore
    const totalScore = metrics.reduce((acc, m) => acc + m.score, 0)
    const maxScore = metrics.reduce((acc, m) => acc + m.maxScore, 0)
    return Math.round((totalScore / maxScore) * 100)
  }, [metrics, overallScore])

  const overallStatus = useMemo(() => {
    if (calculatedScore >= 80) return 'good'
    if (calculatedScore >= 50) return 'warning'
    return 'critical'
  }, [calculatedScore])

  const statusConfig = STATUS_CONFIG[overallStatus]
  const StatusIcon = statusConfig.icon

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-help",
              overallStatus === 'good' && "border-green-500/30 bg-green-500/10",
              overallStatus === 'warning' && "border-amber-500/30 bg-amber-500/10",
              overallStatus === 'critical' && "border-red-500/30 bg-red-500/10",
              className
            )}>
              <StatusIcon className={cn("h-4 w-4", statusConfig.color)} />
              <span className={cn("font-semibold text-sm", statusConfig.color)}>
                {calculatedScore}%
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-2">
              <p className="font-medium">Santé du canal: {calculatedScore}%</p>
              <div className="space-y-1">
                {metrics.slice(0, 4).map(m => (
                  <div key={m.id} className="flex items-center justify-between text-xs">
                    <span>{m.label}</span>
                    <span className={cn(
                      "font-medium",
                      m.status === 'good' && "text-green-500",
                      m.status === 'warning' && "text-amber-500",
                      m.status === 'critical' && "text-red-500"
                    )}>
                      {m.score}/{m.maxScore}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            {channelName ? `Santé: ${channelName}` : 'Santé du canal'}
          </CardTitle>
          {lastChecked && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Mis à jour il y a 5min
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="flex items-center gap-4">
          <div className={cn(
            "relative w-20 h-20 rounded-full flex items-center justify-center",
            "bg-gradient-to-br from-background to-muted border-4",
            overallStatus === 'good' && "border-green-500/50",
            overallStatus === 'warning' && "border-amber-500/50",
            overallStatus === 'critical' && "border-red-500/50"
          )}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center"
            >
              <span className={cn("text-2xl font-bold", statusConfig.color)}>
                {calculatedScore}
              </span>
              <span className="text-xs text-muted-foreground block">/ 100</span>
            </motion.div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <StatusIcon className={cn("h-5 w-5", statusConfig.color)} />
              <span className={cn("font-semibold", statusConfig.color)}>
                {overallStatus === 'good' && 'Excellent'}
                {overallStatus === 'warning' && 'Attention requise'}
                {overallStatus === 'critical' && 'Action urgente'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {overallStatus === 'good' && 'Votre canal fonctionne parfaitement.'}
              {overallStatus === 'warning' && 'Quelques points à améliorer.'}
              {overallStatus === 'critical' && 'Des problèmes critiques détectés.'}
            </p>
          </div>
        </div>

        {/* Metrics Breakdown */}
        <div className="space-y-3">
          {metrics.map((metric, index) => {
            const metricStatus = STATUS_CONFIG[metric.status]
            const MetricIcon = metricStatus.icon
            const percentage = (metric.score / metric.maxScore) * 100

            return (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="space-y-1.5"
              >
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <MetricIcon className={cn("h-3.5 w-3.5", metricStatus.color)} />
                    <span className="font-medium">{metric.label}</span>
                    {metric.description && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs text-xs">{metric.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <span className={cn("font-semibold", metricStatus.color)}>
                    {metric.score}/{metric.maxScore}
                  </span>
                </div>
                <div className="relative">
                  <Progress 
                    value={percentage} 
                    className={cn(
                      "h-2",
                      "[&>div]:transition-all [&>div]:duration-500"
                    )}
                  />
                  <div 
                    className={cn(
                      "absolute top-0 h-2 rounded-full transition-all duration-500",
                      metricStatus.bg
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Default health metrics for channels
export const DEFAULT_CHANNEL_HEALTH_METRICS: HealthMetric[] = [
  {
    id: 'connection',
    label: 'Connexion',
    score: 10,
    maxScore: 10,
    status: 'good',
    description: 'État de la connexion API'
  },
  {
    id: 'sync',
    label: 'Synchronisation',
    score: 8,
    maxScore: 10,
    status: 'good',
    description: 'Fréquence et succès des syncs'
  },
  {
    id: 'data-quality',
    label: 'Qualité données',
    score: 6,
    maxScore: 10,
    status: 'warning',
    description: 'Complétude et cohérence des données'
  },
  {
    id: 'performance',
    label: 'Performance',
    score: 9,
    maxScore: 10,
    status: 'good',
    description: 'Temps de réponse et débit'
  },
]
