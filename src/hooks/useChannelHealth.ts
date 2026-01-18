/**
 * Hook pour la santé des canaux
 * Calcule les métriques réelles depuis channel_sync_logs
 */
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface ChannelHealthMetrics {
  syncRate: number
  errorRate: number
  uptime: number
  avgLatency: number
  lastChecked: string
}

export function useChannelHealth() {
  return useQuery({
    queryKey: ['channel-health'],
    queryFn: async (): Promise<ChannelHealthMetrics> => {
      const { data: logs, error } = await supabase
        .from('channel_sync_logs')
        .select('status, duration_ms, items_succeeded, items_failed, completed_at')
        .order('started_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error fetching sync logs:', error)
        return getDefaultMetrics()
      }

      if (!logs || logs.length === 0) {
        return getDefaultMetrics()
      }

      const total = logs.length
      const successful = logs.filter(l => l.status === 'completed').length
      const failed = logs.filter(l => l.status === 'failed').length
      
      const durations = logs
        .filter(l => l.duration_ms && l.duration_ms > 0)
        .map(l => l.duration_ms!)
      
      const avgDuration = durations.length > 0 
        ? durations.reduce((a, b) => a + b, 0) / durations.length 
        : 0

      // Calculate uptime based on success rate in last 24h
      const recentLogs = logs.slice(0, 20)
      const recentSuccessful = recentLogs.filter(l => l.status === 'completed').length
      const uptime = recentLogs.length > 0 
        ? Math.round((recentSuccessful / recentLogs.length) * 100)
        : 100

      return {
        syncRate: total > 0 ? Math.round((successful / total) * 100) : 100,
        errorRate: total > 0 ? Math.round((failed / total) * 100) : 0,
        uptime,
        avgLatency: Math.round(avgDuration / 1000), // Convert to seconds
        lastChecked: new Date().toISOString()
      }
    },
    staleTime: 60000,
    refetchInterval: 60000
  })
}

function getDefaultMetrics(): ChannelHealthMetrics {
  return {
    syncRate: 100,
    errorRate: 0,
    uptime: 100,
    avgLatency: 0,
    lastChecked: new Date().toISOString()
  }
}
