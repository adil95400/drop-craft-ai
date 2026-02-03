import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export interface ExtensionActionLog {
  id: string
  user_id: string
  action_type: string
  action_status: 'success' | 'error' | 'pending'
  platform: string | null
  product_title: string | null
  product_url: string | null
  product_id: string | null
  metadata: Record<string, any>
  extension_version: string | null
  created_at: string
}

interface UseExtensionActionLogsOptions {
  limit?: number
  actionType?: string
}

export function useExtensionActionLogs(options: UseExtensionActionLogsOptions = {}) {
  const { user } = useAuth()
  const [logs, setLogs] = useState<ExtensionActionLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const { limit = 50, actionType } = options

  const fetchLogs = async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      let query = supabase
        .from('extension_action_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (actionType) {
        query = query.eq('action_type', actionType)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setLogs((data as ExtensionActionLog[]) || [])
      setError(null)
    } catch (err) {
      console.error('[ExtensionActionLogs] Fetch error:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch logs'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!user?.id) return

    fetchLogs()

    // Subscribe to realtime updates
    const channel = supabase
      .channel('extension-action-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'extension_action_logs',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newLog = payload.new as ExtensionActionLog
          setLogs(prev => [newLog, ...prev.slice(0, limit - 1)])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, limit, actionType])

  // Calculate stats
  const stats = {
    total: logs.length,
    success: logs.filter(l => l.action_status === 'success').length,
    errors: logs.filter(l => l.action_status === 'error').length,
    byType: logs.reduce((acc, log) => {
      acc[log.action_type] = (acc[log.action_type] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    byPlatform: logs.reduce((acc, log) => {
      if (log.platform) {
        acc[log.platform] = (acc[log.platform] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>),
  }

  return {
    logs,
    isLoading,
    error,
    stats,
    refresh: fetchLogs
  }
}
