/**
 * ChannableActivityFeed - Feed d'activité en temps réel style Channable
 * Affiche les événements récents avec animations
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Activity, Package, ShoppingCart, RefreshCw, AlertCircle,
  CheckCircle2, Zap, Bell, ChevronRight, ExternalLink,
  TrendingUp, TrendingDown, ArrowRight
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale'

export interface ActivityEvent {
  id: string
  type: 'sync' | 'order' | 'product' | 'alert' | 'system'
  action: string
  title: string
  description?: string
  timestamp: string
  metadata?: {
    count?: number
    value?: string
    trend?: 'up' | 'down'
    link?: string
  }
  status?: 'success' | 'error' | 'warning' | 'info'
}

interface ChannableActivityFeedProps {
  events: ActivityEvent[]
  maxItems?: number
  title?: string
  onViewAll?: () => void
  onEventClick?: (event: ActivityEvent) => void
  showTimestamp?: boolean
  className?: string
  realtime?: boolean
}

const TYPE_CONFIG = {
  sync: { icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  order: { icon: ShoppingCart, color: 'text-green-500', bg: 'bg-green-500/10' },
  product: { icon: Package, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  alert: { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  system: { icon: Zap, color: 'text-primary', bg: 'bg-primary/10' },
}

const STATUS_COLORS = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
}

export function ChannableActivityFeed({
  events,
  maxItems = 10,
  title = 'Activité récente',
  onViewAll,
  onEventClick,
  showTimestamp = true,
  className,
  realtime = false
}: ChannableActivityFeedProps) {
  const [displayedEvents, setDisplayedEvents] = useState(events.slice(0, maxItems))
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set())
  const locale = useDateFnsLocale()

  // Update displayed events when props change
  useEffect(() => {
    const newEvents = events.slice(0, maxItems)
    
    if (realtime) {
      // Find new events for highlighting
      const currentIds = new Set(displayedEvents.map(e => e.id))
      const newIds = newEvents.filter(e => !currentIds.has(e.id)).map(e => e.id)
      
      if (newIds.length > 0) {
        setNewEventIds(new Set(newIds))
        // Clear highlight after 3 seconds
        setTimeout(() => setNewEventIds(new Set()), 3000)
      }
    }
    
    setDisplayedEvents(newEvents)
  }, [events, maxItems, realtime])

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            {title}
            {realtime && (
              <Badge variant="outline" className="ml-2 text-xs animate-pulse">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5" />
                Live
              </Badge>
            )}
          </CardTitle>
          {onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll} className="gap-1">
              Voir tout
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[350px]">
          <div className="divide-y">
            <AnimatePresence>
              {displayedEvents.map((event, index) => {
                const config = TYPE_CONFIG[event.type]
                const Icon = config.icon
                const isNew = newEventIds.has(event.id)

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => onEventClick?.(event)}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 transition-colors",
                      onEventClick && "cursor-pointer hover:bg-muted/50",
                      isNew && "bg-primary/5 animate-pulse"
                    )}
                  >
                    {/* Icon */}
                    <div className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                      config.bg
                    )}>
                      <Icon className={cn("h-4 w-4", config.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{event.title}</p>
                        {event.status && (
                          <CheckCircle2 className={cn(
                            "h-3.5 w-3.5 flex-shrink-0",
                            STATUS_COLORS[event.status]
                          )} />
                        )}
                      </div>
                      
                      {event.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {event.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-1">
                        {/* Metadata */}
                        {event.metadata?.count !== undefined && (
                          <Badge variant="secondary" className="text-xs h-5">
                            {event.metadata.count} éléments
                          </Badge>
                        )}
                        {event.metadata?.value && (
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs h-5",
                              event.metadata.trend === 'up' && "text-green-600 border-green-200",
                              event.metadata.trend === 'down' && "text-red-600 border-red-200"
                            )}
                          >
                            {event.metadata.trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
                            {event.metadata.trend === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
                            {event.metadata.value}
                          </Badge>
                        )}
                        
                        {/* Timestamp */}
                        {showTimestamp && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(event.timestamp), {
                              addSuffix: true,
                              locale
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Link */}
                    {event.metadata?.link && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(event.metadata?.link, '_blank')
                        }}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {displayedEvents.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bell className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Aucune activité récente</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// Demo events for testing
export const DEMO_ACTIVITY_EVENTS: ActivityEvent[] = [
  {
    id: '1',
    type: 'order',
    action: 'new_order',
    title: 'Nouvelle commande #12847',
    description: 'Client: Marie Dupont - 3 articles',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    metadata: { value: '€124.50', trend: 'up' },
    status: 'success'
  },
  {
    id: '2',
    type: 'sync',
    action: 'sync_complete',
    title: 'Synchronisation terminée',
    description: 'Shopify → Catalogue',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    metadata: { count: 156 },
    status: 'success'
  },
  {
    id: '3',
    type: 'product',
    action: 'stock_update',
    title: 'Stock mis à jour',
    description: '12 produits réapprovisionnés',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    metadata: { count: 12 },
    status: 'info'
  },
  {
    id: '4',
    type: 'alert',
    action: 'low_stock',
    title: 'Stock faible détecté',
    description: '5 produits sous le seuil minimum',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    metadata: { count: 5 },
    status: 'warning'
  },
  {
    id: '5',
    type: 'system',
    action: 'api_rate_limit',
    title: 'Limite API atteinte',
    description: 'Amazon Seller - Réessai dans 5min',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    status: 'error'
  },
]
