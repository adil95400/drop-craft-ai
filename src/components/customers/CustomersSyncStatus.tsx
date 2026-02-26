/**
 * CustomersSyncStatus - Indicateur de synchronisation des clients avec les boutiques
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Store, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Users,
  Loader2,
  ChevronDown,
  ChevronUp,
  Link2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'
import { useIntegrationsUnified } from '@/hooks/unified/useIntegrationsUnified'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'

interface SyncChannel {
  id: string
  name: string
  platform: string
  status: 'synced' | 'syncing' | 'error' | 'pending'
  customerCount: number
  lastSync: Date | null
  icon?: React.ReactNode
}

export function CustomersSyncStatus() {
  const { connectedIntegrations, isLoading: integrationsLoading } = useIntegrationsUnified()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isExpanded, setIsExpanded] = useState(false)
  const [syncingChannels, setSyncingChannels] = useState<Set<string>>(new Set())

  // Transform integrations to sync channels
  const syncChannels: SyncChannel[] = connectedIntegrations.map(integration => ({
    id: integration.id,
    name: integration.platform_name || integration.platform,
    platform: integration.platform,
    status: syncingChannels.has(integration.id) 
      ? 'syncing' 
      : integration.connection_status === 'connected' ? 'synced' : 'pending',
    customerCount: 0, // Will be enriched with real data
    lastSync: integration.last_sync_at ? new Date(integration.last_sync_at) : null,
  }))

  const handleSyncChannel = async (channelId: string, platform: string) => {
    setSyncingChannels(prev => new Set(prev).add(channelId))
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-customers-to-channels', {
        body: { 
          integration_id: channelId,
          platform,
          direction: 'import'
        }
      })

      if (error) throw error

      toast({
        title: 'Synchronisation réussie',
        description: `${data?.results?.imported || 0} clients importés depuis ${platform}`
      })

      // Refresh customers list
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customers-unified'] })
    } catch (error: any) {
      toast({
        title: 'Erreur de synchronisation',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setSyncingChannels(prev => {
        const next = new Set(prev)
        next.delete(channelId)
        return next
      })
    }
  }

  const handleSyncAll = async () => {
    for (const channel of syncChannels) {
      await handleSyncChannel(channel.id, channel.platform)
    }
  }

  const getStatusColor = (status: SyncChannel['status']) => {
    switch (status) {
      case 'synced': return 'bg-green-500'
      case 'syncing': return 'bg-blue-500 animate-pulse'
      case 'error': return 'bg-red-500'
      default: return 'bg-amber-500'
    }
  }

  const getStatusIcon = (status: SyncChannel['status']) => {
    switch (status) {
      case 'synced': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'syncing': return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-amber-600" />
    }
  }

  if (integrationsLoading) {
    return (
      <Card className="border-0 shadow-sm bg-background/50 backdrop-blur-sm">
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (syncChannels.length === 0) {
    return (
      <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Link2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Aucune boutique connectée</p>
                <p className="text-xs text-muted-foreground">
                  Connectez une boutique pour synchroniser vos clients
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="/stores-channels">Connecter une boutique</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalSynced = syncChannels.filter(c => c.status === 'synced').length
  const isSyncingAny = syncChannels.some(c => c.status === 'syncing')

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className={cn(
        "border-0 shadow-sm overflow-hidden transition-all",
        "bg-gradient-to-r from-background to-background/80 backdrop-blur-sm"
      )}>
        <CardContent className="p-0">
          {/* Header */}
          <div 
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                  <Store className="h-5 w-5 text-primary" />
                </div>
                <span className={cn(
                  "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background",
                  isSyncingAny ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
                )} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">Synchronisation boutiques</span>
                  <Badge variant="secondary" className="text-xs font-medium">
                    {totalSynced}/{syncChannels.length} actives
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isSyncingAny ? 'Synchronisation en cours...' : 'Clients synchronisés avec vos boutiques'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSyncAll()
                }}
                disabled={isSyncingAny}
                className="gap-2"
              >
                <RefreshCw className={cn("h-4 w-4", isSyncingAny && "animate-spin")} />
                Tout synchroniser
              </Button>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Expanded Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="px-4 pb-4 pt-0 border-t border-border/50">
                  <div className="grid gap-3 mt-4">
                    {syncChannels.map((channel) => (
                      <div
                        key={channel.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg",
                          "bg-muted/30 hover:bg-muted/50 transition-colors"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            getStatusColor(channel.status)
                          )} />
                          <div>
                            <p className="font-medium text-sm">{channel.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {channel.lastSync && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(channel.lastSync, { addSuffix: true, locale: getDateFnsLocale() })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(channel.status)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSyncChannel(channel.id, channel.platform)}
                            disabled={channel.status === 'syncing'}
                          >
                            <RefreshCw className={cn(
                              "h-3.5 w-3.5",
                              channel.status === 'syncing' && "animate-spin"
                            )} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}
