/**
 * Command Center V3 - Phase 3: Predictive Alerts Panel - Optimized
 * Shows stock-out predictions and urgent business alerts
 */

import { memo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Clock, 
  Package,
  DollarSign,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { PredictiveAlert } from './usePredictiveInsights'
import { PanelSkeleton, EmptyState } from './utils/skeletons'
import { formatCurrency } from './utils/calculations'

interface PredictiveAlertsPanelProps {
  alerts: PredictiveAlert[]
  onAlertAction: (alert: PredictiveAlert) => void
  onViewAll: () => void
  maxAlerts?: number
  isLoading?: boolean
}

const alertTypeConfig = {
  stockout: { icon: Package, color: 'text-destructive', bgColor: 'bg-destructive/10', label: 'Rupture' },
  margin_decline: { icon: TrendingDown, color: 'text-warning', bgColor: 'bg-warning/10', label: 'Marge' },
  opportunity: { icon: Sparkles, color: 'text-success', bgColor: 'bg-success/10', label: 'Opportunité' },
  trend_up: { icon: TrendingUp, color: 'text-info', bgColor: 'bg-info/10', label: 'Tendance ↑' },
  trend_down: { icon: TrendingDown, color: 'text-warning', bgColor: 'bg-warning/10', label: 'Tendance ↓' }
} as const

const urgencyConfig = {
  critical: { badge: 'destructive' as const, pulse: true },
  high: { badge: 'destructive' as const, pulse: false },
  medium: { badge: 'secondary' as const, pulse: false },
  low: { badge: 'outline' as const, pulse: false }
} as const

// Memoized alert row component
const AlertRow = memo(function AlertRow({
  alert,
  index,
  onAction
}: {
  alert: PredictiveAlert
  index: number
  onAction: (alert: PredictiveAlert) => void
}) {
  const typeConf = alertTypeConfig[alert.type]
  const urgConf = urgencyConfig[alert.urgency]
  const Icon = typeConf.icon

  const handleClick = useCallback(() => onAction(alert), [alert, onAction])

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "relative rounded-lg border border-border/50 p-3 hover:bg-muted/50 transition-colors group",
        urgConf.pulse && "ring-1 ring-destructive/20"
      )}
    >
      {urgConf.pulse && (
        <span className="absolute top-2 right-2 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
        </span>
      )}

      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg shrink-0", typeConf.bgColor)}>
          <Icon className={cn("h-4 w-4", typeConf.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">{alert.title}</span>
            <Badge variant={urgConf.badge} className="text-[10px] px-1.5 py-0">
              {typeConf.label}
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
            {alert.productName}
          </p>

          <div className="flex items-center justify-between">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <DollarSign className="h-3 w-3" />
                    <span>Impact: {formatCurrency(alert.potentialImpact)}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{alert.recommendation}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleClick}
            >
              {alert.actionLabel}
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
})

export const PredictiveAlertsPanel = memo(function PredictiveAlertsPanel({
  alerts,
  onAlertAction,
  onViewAll,
  maxAlerts = 5,
  isLoading = false
}: PredictiveAlertsPanelProps) {
  const visibleAlerts = alerts.slice(0, maxAlerts)
  const hasMore = alerts.length > maxAlerts

  if (isLoading) {
    return <PanelSkeleton rows={3} />
  }

  if (alerts.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Aucune alerte urgente"
        description="Votre catalogue est bien optimisé, continuez ainsi !"
        variant="success"
      />
    )
  }

  return (
    <motion.div 
      className="rounded-xl border border-border/50 bg-card/50 overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <AlertTriangle className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Alertes Prédictives</h3>
            <p className="text-xs text-muted-foreground">
              {alerts.length} alerte{alerts.length > 1 ? 's' : ''} détectée{alerts.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Temps réel
        </Badge>
      </div>

      <ScrollArea className="max-h-[320px]">
        <div className="p-2 space-y-2">
          <AnimatePresence mode="popLayout">
            {visibleAlerts.map((alert, index) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                index={index}
                onAction={onAlertAction}
              />
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {hasMore && (
        <div className="p-3 border-t border-border/50 bg-muted/20">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={onViewAll}
          >
            Voir les {alerts.length - maxAlerts} autres alertes
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      )}
    </motion.div>
  )
})
