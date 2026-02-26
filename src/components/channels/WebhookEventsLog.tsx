/**
 * Journal des événements webhook en temps réel
 * Affiche les événements reçus avec filtrage et détails
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import {
  Webhook, Search, RefreshCw, Filter, Clock, 
  CheckCircle2, AlertCircle, Package, ShoppingCart,
  Database, Zap, Eye, ChevronRight, Wifi
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'
import { useChannelWebhooks } from '@/hooks/useChannelWebhooks'

interface WebhookEvent {
  id: string
  platform: string
  event_type: string
  integration_id: string
  payload: Record<string, unknown>
  processed: boolean
  created_at: string
}

interface WebhookEventsLogProps {
  channelId?: string
  limit?: number
  showRealtime?: boolean
}

const eventTypeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  product_create: { icon: <Package className="h-4 w-4" />, color: 'bg-blue-500', label: 'Produit créé' },
  product_update: { icon: <Package className="h-4 w-4" />, color: 'bg-blue-400', label: 'Produit mis à jour' },
  product_delete: { icon: <Package className="h-4 w-4" />, color: 'bg-red-500', label: 'Produit supprimé' },
  order_create: { icon: <ShoppingCart className="h-4 w-4" />, color: 'bg-green-500', label: 'Commande créée' },
  order_update: { icon: <ShoppingCart className="h-4 w-4" />, color: 'bg-green-400', label: 'Commande mise à jour' },
  order_fulfill: { icon: <ShoppingCart className="h-4 w-4" />, color: 'bg-purple-500', label: 'Commande expédiée' },
  order_cancel: { icon: <ShoppingCart className="h-4 w-4" />, color: 'bg-orange-500', label: 'Commande annulée' },
  inventory_update: { icon: <Database className="h-4 w-4" />, color: 'bg-purple-400', label: 'Stock mis à jour' },
  sync_update: { icon: <Zap className="h-4 w-4" />, color: 'bg-yellow-500', label: 'Sync' },
}

export function WebhookEventsLog({ 
  channelId, 
  limit = 50,
  showRealtime = true 
}: WebhookEventsLogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [eventFilter, setEventFilter] = useState<string>('all')
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null)

  // Real-time webhook listener
  const { isConnected, lastEvent, eventCount } = useChannelWebhooks({
    channelId,
    enableNotifications: false
  })

  // Fetch webhook events from database
  const { data: events, isLoading, refetch } = useQuery({
    queryKey: ['webhook-events', channelId, eventFilter],
    queryFn: async () => {
      let query = supabase
        .from('webhook_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (channelId) {
        query = query.eq('integration_id', channelId)
      }

      if (eventFilter !== 'all') {
        query = query.ilike('event_type', `${eventFilter}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching webhook events:', error)
        return []
      }

      // Map webhook_data to payload for compatibility
      return (data || []).map(item => ({
        ...item,
        payload: item.webhook_data || {}
      })) as unknown as WebhookEvent[]
    },
    refetchInterval: 30000 // Refresh every 30s
  })

  // Filter events by search
  const filteredEvents = events?.filter(event => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      event.event_type.toLowerCase().includes(searchLower) ||
      event.platform.toLowerCase().includes(searchLower) ||
      JSON.stringify(event.payload).toLowerCase().includes(searchLower)
    )
  }) || []

  const getEventConfig = (eventType: string) => {
    const normalized = eventType.toLowerCase().replace('_', '_')
    return eventTypeConfig[normalized] || {
      icon: <Zap className="h-4 w-4" />,
      color: 'bg-gray-500',
      label: eventType
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Webhook className="h-4 w-4" />
              Événements Webhook
            </CardTitle>
            {showRealtime && isConnected && (
              <Badge variant="outline" className="gap-1 text-green-600 border-green-500/30">
                <Wifi className="h-3 w-3" />
                Live
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrer par type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les événements</SelectItem>
              <SelectItem value="product">Produits</SelectItem>
              <SelectItem value="order">Commandes</SelectItem>
              <SelectItem value="inventory">Inventaire</SelectItem>
              <SelectItem value="sync">Synchronisation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {/* Stats bar */}
        <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
          <span>{filteredEvents.length} événement(s)</span>
          {eventCount > 0 && (
            <span className="text-green-600">+{eventCount} en temps réel</span>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {/* Real-time last event */}
            {showRealtime && lastEvent && (
              <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/5 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500 text-white">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{lastEvent.type}</span>
                      <Badge variant="outline" className="text-xs">
                        {lastEvent.platform}
                      </Badge>
                      <Badge className="bg-green-500 text-white text-xs">LIVE</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">À l'instant</p>
                  </div>
                </div>
              </div>
            )}

            {/* Events list */}
            {filteredEvents.map((event) => {
              const config = getEventConfig(event.event_type)
              
              return (
                <Sheet key={event.id}>
                  <SheetTrigger asChild>
                    <div
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
                        !event.processed && "border-l-2 border-l-primary"
                      )}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg text-white", config.color)}>
                          {config.icon}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{config.label}</span>
                            <Badge variant="outline" className="text-xs">
                              {event.platform}
                            </Badge>
                            {event.processed ? (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            ) : (
                              <Clock className="h-3 w-3 text-orange-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(event.created_at), { 
                              addSuffix: true, 
                              locale: getDateFnsLocale() 
                            })}
                          </p>
                        </div>
                        
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </SheetTrigger>
                  
                  <SheetContent className="overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2">
                        <div className={cn("p-2 rounded-lg text-white", config.color)}>
                          {config.icon}
                        </div>
                        {config.label}
                      </SheetTitle>
                    </SheetHeader>
                    
                    <div className="mt-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Plateforme</p>
                          <p className="font-medium">{event.platform}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Type</p>
                          <p className="font-medium">{event.event_type}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p className="font-medium">
                            {new Date(event.created_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Statut</p>
                          <Badge variant={event.processed ? "default" : "secondary"}>
                            {event.processed ? 'Traité' : 'En attente'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground text-sm mb-2">Payload</p>
                        <pre className="p-3 rounded-lg bg-muted text-xs overflow-auto max-h-[300px]">
                          {JSON.stringify(event.payload, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              )
            })}

            {filteredEvents.length === 0 && !isLoading && (
              <div className="text-center py-12 text-muted-foreground">
                <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun événement webhook</p>
                <p className="text-sm">Les événements apparaîtront ici en temps réel</p>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export default WebhookEventsLog
