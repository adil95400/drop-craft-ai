/**
 * ChannableSyncTimeline - Timeline de synchronisation style Channable
 * Affiche l'historique des syncs avec statuts visuels
 */

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2, XCircle, Clock, AlertTriangle,
  RefreshCw, Package, ShoppingCart, ChevronRight,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'

export interface SyncEvent {
  id: string
  type: 'products' | 'orders' | 'inventory' | 'prices' | 'full'
  status: 'success' | 'error' | 'warning' | 'pending' | 'in_progress'
  timestamp: string
  duration_ms?: number
  items_processed?: number
  items_failed?: number
  message?: string
  details?: {
    created?: number
    updated?: number
    deleted?: number
    skipped?: number
  }
}

interface ChannableSyncTimelineProps {
  events: SyncEvent[]
  maxItems?: number
  onViewDetails?: (event: SyncEvent) => void
  onRetrySync?: (event: SyncEvent) => void
  className?: string
}

const TYPE_CONFIG = {
  products: { label: 'Produits', icon: Package, color: 'text-blue-500' },
  orders: { label: 'Commandes', icon: ShoppingCart, color: 'text-green-500' },
  inventory: { label: 'Stock', icon: ArrowDownRight, color: 'text-orange-500' },
  prices: { label: 'Prix', icon: ArrowUpRight, color: 'text-purple-500' },
  full: { label: 'Complète', icon: RefreshCw, color: 'text-primary' },
}

const STATUS_CONFIG = {
  success: { 
    icon: CheckCircle2, 
    color: 'text-green-500 bg-green-500/10',
    badge: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30'
  },
  error: { 
    icon: XCircle, 
    color: 'text-red-500 bg-red-500/10',
    badge: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30'
  },
  warning: { 
    icon: AlertTriangle, 
    color: 'text-amber-500 bg-amber-500/10',
    badge: 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30'
  },
  pending: { 
    icon: Clock, 
    color: 'text-muted-foreground bg-muted',
    badge: 'bg-muted text-muted-foreground'
  },
  in_progress: { 
    icon: RefreshCw, 
    color: 'text-blue-500 bg-blue-500/10',
    badge: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30'
  },
}

export function ChannableSyncTimeline({
  events,
  maxItems = 10,
  onViewDetails,
  onRetrySync,
  className
}: ChannableSyncTimelineProps) {
  const displayedEvents = events.slice(0, maxItems)

  if (events.length === 0) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Aucune synchronisation récente</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-1", className)}>
      {displayedEvents.map((event, index) => {
        const typeConfig = TYPE_CONFIG[event.type]
        const statusConfig = STATUS_CONFIG[event.status]
        const TypeIcon = typeConfig.icon
        const StatusIcon = statusConfig.icon

        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "group relative flex items-start gap-3 p-3 rounded-lg transition-colors",
              "hover:bg-muted/50 cursor-pointer"
            )}
            onClick={() => onViewDetails?.(event)}
          >
            {/* Timeline Line */}
            {index < displayedEvents.length - 1 && (
              <div className="absolute left-[23px] top-12 bottom-0 w-0.5 bg-border" />
            )}

            {/* Status Icon */}
            <div className={cn(
              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
              statusConfig.color
            )}>
              <StatusIcon className={cn(
                "h-4 w-4",
                event.status === 'in_progress' && "animate-spin"
              )} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{typeConfig.label}</span>
                <Badge variant="outline" className={cn("text-xs", statusConfig.badge)}>
                  {event.status === 'success' && 'Succès'}
                  {event.status === 'error' && 'Erreur'}
                  {event.status === 'warning' && 'Avertissement'}
                  {event.status === 'pending' && 'En attente'}
                  {event.status === 'in_progress' && 'En cours'}
                </Badge>
              </div>

              {/* Stats */}
              {event.items_processed !== undefined && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1">
                  <span>{event.items_processed} traités</span>
                  {event.items_failed !== undefined && event.items_failed > 0 && (
                    <span className="text-red-500">{event.items_failed} échoués</span>
                  )}
                  {event.duration_ms && (
                    <span>{(event.duration_ms / 1000).toFixed(1)}s</span>
                  )}
                </div>
              )}

              {/* Details */}
              {event.details && (
                <div className="flex items-center gap-2 text-xs">
                  {event.details.created !== undefined && event.details.created > 0 && (
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-950">
                      +{event.details.created}
                    </Badge>
                  )}
                  {event.details.updated !== undefined && event.details.updated > 0 && (
                    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950">
                      ↻{event.details.updated}
                    </Badge>
                  )}
                  {event.details.deleted !== undefined && event.details.deleted > 0 && (
                    <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 dark:bg-red-950">
                      -{event.details.deleted}
                    </Badge>
                  )}
                </div>
              )}

              {/* Message */}
              {event.message && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {event.message}
                </p>
              )}

              {/* Timestamp */}
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(event.timestamp), { 
                  addSuffix: true, 
                  locale: getDateFnsLocale() 
                })}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {event.status === 'error' && onRetrySync && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRetrySync(event)
                  }}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </motion.div>
        )
      })}

      {events.length > maxItems && (
        <Button variant="ghost" className="w-full text-muted-foreground">
          Voir {events.length - maxItems} autres synchronisations
        </Button>
      )}
    </div>
  )
}
