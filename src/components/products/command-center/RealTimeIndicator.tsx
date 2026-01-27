/**
 * Indicateur temps réel pour le Command Center
 * Affiche le statut de connexion et les dernières mises à jour
 */

import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, RefreshCw, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useCommandCenterRealtime } from '@/hooks/useCommandCenterRealtime'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface RealTimeIndicatorProps {
  className?: string
  showMetrics?: boolean
}

export function RealTimeIndicator({ 
  className,
  showMetrics = false 
}: RealTimeIndicatorProps) {
  const { metrics, connectionStatus, isConnected } = useCommandCenterRealtime()
  
  const statusConfig = {
    connected: {
      icon: Wifi,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      label: 'Connecté',
      pulse: true,
      spin: false
    },
    connecting: {
      icon: RefreshCw,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      label: 'Connexion...',
      pulse: false,
      spin: true
    },
    disconnected: {
      icon: WifiOff,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/50',
      borderColor: 'border-muted-foreground/30',
      label: 'Hors ligne',
      pulse: false,
      spin: false
    }
  }
  
  const config = statusConfig[connectionStatus]
  const Icon = config.icon
  
  const lastUpdateText = metrics.lastUpdate 
    ? formatDistanceToNow(metrics.lastUpdate, { addSuffix: true, locale: fr })
    : 'Jamais'
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div 
            className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border',
              'transition-colors duration-300',
              config.bgColor,
              config.borderColor,
              className
            )}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {/* Status indicator with pulse */}
            <div className="relative">
              <Icon className={cn(
                'h-3.5 w-3.5',
                config.color,
                config.spin && 'animate-spin'
              )} />
              
              {/* Pulse animation for connected state */}
              {config.pulse && (
                <motion.div
                  className={cn(
                    'absolute inset-0 rounded-full',
                    config.bgColor
                  )}
                  animate={{
                    scale: [1, 1.8, 1],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeOut'
                  }}
                />
              )}
            </div>
            
            <span className={cn('text-xs font-medium', config.color)}>
              {config.label}
            </span>
            
            {/* Metrics badges */}
            {showMetrics && isConnected && (
              <AnimatePresence mode="popLayout">
                {metrics.productsUpdated > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Badge 
                      variant="secondary" 
                      className="h-5 px-1.5 text-[10px] bg-primary/10 text-primary"
                    >
                      +{metrics.productsUpdated}
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1.5">
            <p className="font-medium">Synchronisation temps réel</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Dernière mise à jour: {lastUpdateText}</span>
            </div>
            {isConnected && (
              <div className="text-xs space-y-0.5">
                <p>• {metrics.productsUpdated} produits mis à jour</p>
                <p>• {metrics.ordersCreated} nouvelles commandes</p>
                <p>• {metrics.stockChanges} variations de stock</p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
