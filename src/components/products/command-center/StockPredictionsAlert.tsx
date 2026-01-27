/**
 * Alerte prédictions de stock
 * Affiche les alertes de rupture imminente avec recommandations
 */

import { motion } from 'framer-motion'
import { 
  AlertTriangle, Package, TrendingDown, TrendingUp, Clock,
  ChevronRight, Truck, Bell
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { StockAlert } from '@/hooks/useStockPredictions'
import { cn } from '@/lib/utils'

interface StockPredictionsAlertProps {
  alerts: StockAlert[]
  onViewProduct: (productId: string) => void
  onReorder: (productId: string, quantity: number) => void
  maxVisible?: number
  compact?: boolean
}

const urgencyConfig = {
  critical: {
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/50',
    label: 'Critique',
    icon: AlertTriangle
  },
  high: {
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/50',
    label: 'Haute',
    icon: Clock
  },
  medium: {
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/50',
    label: 'Moyenne',
    icon: TrendingDown
  },
  low: {
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/50',
    label: 'Basse',
    icon: Package
  }
}

export function StockPredictionsAlert({
  alerts,
  onViewProduct,
  onReorder,
  maxVisible = 3,
  compact = false
}: StockPredictionsAlertProps) {
  if (alerts.length === 0) return null

  const criticalCount = alerts.filter(a => a.urgency === 'critical').length
  const highCount = alerts.filter(a => a.urgency === 'high').length
  const visibleAlerts = alerts.slice(0, maxVisible)

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border',
          criticalCount > 0 
            ? 'bg-red-500/10 border-red-500/30' 
            : 'bg-orange-500/10 border-orange-500/30'
        )}
      >
        <Bell className={cn(
          'h-5 w-5 animate-pulse',
          criticalCount > 0 ? 'text-red-500' : 'text-orange-500'
        )} />
        <div className="flex-1">
          <p className="text-sm font-medium">
            {criticalCount > 0 
              ? `${criticalCount} rupture${criticalCount > 1 ? 's' : ''} imminente${criticalCount > 1 ? 's' : ''}`
              : `${highCount} alerte${highCount > 1 ? 's' : ''} stock`
            }
          </p>
          <p className="text-xs text-muted-foreground">
            IA prédictive • Réapprovisionnement conseillé
          </p>
        </div>
        <Button size="sm" variant="outline" className="shrink-0">
          Voir
          <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </motion.div>
    )
  }

  return (
    <Alert className={cn(
      'border-2',
      criticalCount > 0 
        ? 'border-red-500/50 bg-red-500/5' 
        : 'border-orange-500/50 bg-orange-500/5'
    )}>
      <AlertTriangle className={cn(
        'h-5 w-5',
        criticalCount > 0 ? 'text-red-500' : 'text-orange-500'
      )} />
      <AlertTitle className="flex items-center gap-2">
        Alertes Stock Prédictives
        <Badge variant="outline" className={cn(
          'text-[10px]',
          criticalCount > 0 
            ? 'bg-red-500/10 border-red-500/30' 
            : 'bg-orange-500/10 border-orange-500/30'
        )}>
          IA
        </Badge>
      </AlertTitle>
      <AlertDescription>
        <p className="text-sm text-muted-foreground mb-3">
          L'IA a détecté {alerts.length} produit{alerts.length > 1 ? 's' : ''} à risque de rupture
          {criticalCount > 0 && ` dont ${criticalCount} critique${criticalCount > 1 ? 's' : ''}`}
        </p>
        
        <ScrollArea className="max-h-[200px]">
          <div className="space-y-2">
            {visibleAlerts.map((alert, index) => {
              const config = urgencyConfig[alert.urgency]
              const Icon = config.icon
              const daysProgress = Math.max(0, Math.min(100, (7 - alert.daysUntilStockout) / 7 * 100))
              
              return (
                <motion.div
                  key={alert.productId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-lg border',
                    config.bgColor,
                    config.borderColor
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                    config.bgColor
                  )}>
                    <Icon className={cn('h-4 w-4', config.color)} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">
                        {alert.daysUntilStockout === 0 
                          ? 'Rupture aujourd\'hui'
                          : `Rupture dans ${alert.daysUntilStockout} jour${alert.daysUntilStockout > 1 ? 's' : ''}`
                        }
                      </span>
                      <Badge variant="outline" className={cn('text-[9px] px-1', config.bgColor)}>
                        {config.label}
                      </Badge>
                    </div>
                    
                    <Progress 
                      value={daysProgress} 
                      className="h-1 mb-1"
                    />
                    
                    <p className="text-[10px] text-muted-foreground truncate">
                      {alert.recommendation}
                      {alert.reorderQuantity > 0 && ` • Commander: ${alert.reorderQuantity} unités`}
                    </p>
                  </div>
                  
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={() => onViewProduct(alert.productId)}
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                    {alert.reorderQuantity > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={() => onReorder(alert.productId, alert.reorderQuantity)}
                      >
                        <Truck className="h-3 w-3 mr-1" />
                        Commander
                      </Button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </ScrollArea>
        
        {alerts.length > maxVisible && (
          <Button variant="ghost" size="sm" className="w-full mt-2 text-xs">
            Voir {alerts.length - maxVisible} autres alertes
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
