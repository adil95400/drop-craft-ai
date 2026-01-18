/**
 * Hook pour l'activité des canaux en temps réel
 * Utilise channel_sync_logs avec realtime
 */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface ChannelActivityEvent {
  id: string
  type: 'sync' | 'error' | 'update' | 'connection'
  title: string
  description: string
  timestamp: string
  platform?: string
  status: 'success' | 'error' | 'warning' | 'info'
  metadata?: Record<string, any>
}

export function useChannelActivity() {
  const queryClient = useQueryClient()

  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ['channel-activity'],
    queryFn: async (): Promise<ChannelActivityEvent[]> => {
      // Fetch from channel_sync_logs
      const { data: syncLogs, error: syncError } = await supabase
        .from('channel_sync_logs')
        .select(`
          *,
          channel:sales_channels(name, channel_type)
        `)
        .order('started_at', { ascending: false })
        .limit(20)

      if (syncError) {
        console.error('Error fetching sync logs:', syncError)
      }

      // Fetch recent activity logs related to channels
      const { data: activityLogs, error: actError } = await supabase
        .from('activity_logs')
        .select('*')
        .or('action.like.sync_%,action.like.channel_%,action.like.store_%')
        .order('created_at', { ascending: false })
        .limit(20)

      if (actError) {
        console.error('Error fetching activity logs:', actError)
      }

      // Map sync logs to events
      const syncEvents: ChannelActivityEvent[] = (syncLogs || []).map(log => ({
        id: log.id,
        type: log.status === 'failed' ? 'error' : 'sync',
        title: formatSyncTitle(log.sync_type, log.status),
        description: formatSyncDescription(log),
        timestamp: log.started_at,
        platform: log.channel?.channel_type || 'unknown',
        status: mapSyncStatus(log.status),
        metadata: {
          itemsProcessed: log.items_processed,
          itemsSucceeded: log.items_succeeded,
          itemsFailed: log.items_failed,
          durationMs: log.duration_ms
        }
      }))

      // Map activity logs to events
      const activityEvents: ChannelActivityEvent[] = (activityLogs || []).map(log => ({
        id: log.id,
        type: mapActivityType(log.action),
        title: log.action.replace(/_/g, ' '),
        description: log.description || '',
        timestamp: log.created_at || new Date().toISOString(),
        platform: log.entity_type || undefined,
        status: mapActivitySeverity(log.severity),
        metadata: log.details as Record<string, any> | undefined
      }))

      // Combine and sort by timestamp
      const allEvents = [...syncEvents, ...activityEvents]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 15)

      return allEvents
    },
    staleTime: 30000
  })

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('channel-activity-realtime')
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'channel_sync_logs'
        } as any,
        (payload) => {
          console.log('Realtime sync log update:', payload)
          queryClient.invalidateQueries({ queryKey: ['channel-activity'] })
          queryClient.invalidateQueries({ queryKey: ['channel-health'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return {
    events,
    isLoading,
    error
  }
}

// Helper functions
function formatSyncTitle(syncType: string | null, status: string | null): string {
  const typeLabels: Record<string, string> = {
    full: 'Synchronisation complète',
    incremental: 'Sync incrémentale',
    products: 'Sync produits',
    orders: 'Sync commandes',
    inventory: 'Sync stocks'
  }

  const statusLabels: Record<string, string> = {
    running: 'en cours',
    completed: 'terminée',
    failed: 'échouée'
  }

  const typeLabel = typeLabels[syncType || ''] || 'Synchronisation'
  const statusLabel = statusLabels[status || ''] || ''

  return `${typeLabel} ${statusLabel}`.trim()
}

function formatSyncDescription(log: any): string {
  if (log.status === 'running') {
    return 'Synchronisation en cours...'
  }

  if (log.status === 'failed') {
    return `Échec: ${log.items_failed || 0} erreurs`
  }

  const succeeded = log.items_succeeded || 0
  const processed = log.items_processed || 0
  const duration = log.duration_ms ? `en ${(log.duration_ms / 1000).toFixed(1)}s` : ''

  return `${succeeded}/${processed} éléments ${duration}`.trim()
}

function mapSyncStatus(status: string | null): ChannelActivityEvent['status'] {
  switch (status) {
    case 'completed': return 'success'
    case 'failed': return 'error'
    case 'running': return 'info'
    default: return 'warning'
  }
}

function mapActivityType(action: string): ChannelActivityEvent['type'] {
  if (action.includes('error')) return 'error'
  if (action.includes('connect')) return 'connection'
  if (action.includes('sync')) return 'sync'
  return 'update'
}

function mapActivitySeverity(severity: string | null): ChannelActivityEvent['status'] {
  switch (severity) {
    case 'error': return 'error'
    case 'warning': return 'warning'
    case 'info': return 'info'
    default: return 'success'
  }
}
