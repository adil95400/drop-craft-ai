/**
 * Unified Sync Hook
 * Gère la synchronisation entre les différentes sources de données
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface SyncConfiguration {
  id: string
  platform: string
  integration_id: string
  is_active: boolean
  sync_direction: string
  sync_products: boolean
  sync_orders: boolean
  sync_customers: boolean
  sync_prices: boolean
  sync_stock: boolean
  sync_tracking: boolean
  sync_interval_minutes?: number
  last_full_sync_at: string | null
  conflict_resolution: string
  user_id: string
  created_at: string
  updated_at?: string
}

export interface SyncQueueItem {
  id: string
  sync_type: string
  entity_type: string
  action: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  priority: number
  retry_count: number
  max_retries: number
  payload: Record<string, any>
  result: Record<string, any> | null
  error_message: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
}

export interface SyncLog {
  id: string
  sync_type: string
  platform: string
  status: 'success' | 'error' | 'partial'
  records_synced: number
  items_succeeded: number
  items_processed: number
  duration_ms: number
  error_message: string | null
  started_at: string
  completed_at: string
  created_at: string
}

export interface SyncStats {
  total_syncs: number
  successful_syncs: number
  failed_syncs: number
  last_sync_at: string | null
  pending: number
  processing: number
  todaySuccess: number
  todayFailed: number
  todayPartial: number
  totalSucceeded: number
  totalProcessed: number
  activeIntegrations: number
  avg_sync_duration_ms: number
}

// Hook pour récupérer les configurations de sync
export function useSyncConfigurations() {
  return useQuery({
    queryKey: ['sync-configurations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('sync_configurations')
        .select('*')
        .eq('user_id', user.id)
        .order('platform')

      if (error) throw error
      return (data || []) as SyncConfiguration[]
    }
  })
}

// Hook pour récupérer la queue de sync
export function useUnifiedSyncQueue() {
  return useQuery({
    queryKey: ['sync-queue'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('sync_queue')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return (data || []).map(item => ({
        ...item,
        action: item.sync_type || 'sync',
        entity_type: item.sync_type || 'products',
        retry_count: item.attempts || 0,
        max_retries: item.max_attempts || 3
      })) as SyncQueueItem[]
    },
    refetchInterval: 5000
  })
}

// Hook pour récupérer les logs de sync
export function useUnifiedSyncLogs(limit = 100) {
  return useQuery({
    queryKey: ['sync-logs', limit],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('sync_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data || []).map(log => ({
        ...log,
        platform: log.sync_type || 'unknown',
        items_succeeded: log.records_synced || 0,
        items_processed: log.records_synced || 0,
        duration_ms: log.completed_at && log.started_at 
          ? new Date(log.completed_at).getTime() - new Date(log.started_at).getTime()
          : 0
      })) as SyncLog[]
    }
  })
}

// Hook pour récupérer les statistiques de sync
export function useSyncStats() {
  return useQuery({
    queryKey: ['sync-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: logs } = await supabase
        .from('sync_logs')
        .select('*')
        .eq('user_id', user.id)

      const { data: queue } = await supabase
        .from('sync_queue')
        .select('*')
        .eq('user_id', user.id)

      const { data: configs } = await supabase
        .from('sync_configurations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)

      const allLogs = logs || []
      const todayLogs = allLogs.filter(l => new Date(l.created_at) >= today)
      const queueItems = queue || []

      return {
        total_syncs: allLogs.length,
        successful_syncs: allLogs.filter(l => l.status === 'success').length,
        failed_syncs: allLogs.filter(l => l.status === 'error').length,
        last_sync_at: allLogs[0]?.created_at || null,
        pending: queueItems.filter(q => q.status === 'pending').length,
        processing: queueItems.filter(q => q.status === 'processing').length,
        todaySuccess: todayLogs.filter(l => l.status === 'success').length,
        todayFailed: todayLogs.filter(l => l.status === 'error').length,
        todayPartial: todayLogs.filter(l => l.status === 'partial').length,
        totalSucceeded: allLogs.reduce((sum, l) => sum + (l.records_synced || 0), 0),
        totalProcessed: allLogs.reduce((sum, l) => sum + (l.records_synced || 0), 0),
        activeIntegrations: configs?.length || 0,
        avg_sync_duration_ms: 0
      } as SyncStats
    }
  })
}

// Hook pour déclencher une synchronisation complète
export function useTriggerFullSync() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (options?: { force_full_sync?: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase.functions.invoke('unified-sync', {
        body: { 
          action: 'full_sync', 
          user_id: user.id,
          force: options?.force_full_sync 
        }
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-queue'] })
      queryClient.invalidateQueries({ queryKey: ['sync-logs'] })
      queryClient.invalidateQueries({ queryKey: ['sync-stats'] })
      toast({
        title: 'Synchronisation lancée',
        description: 'La synchronisation complète a été démarrée.'
      })
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erreur de synchronisation',
        description: error.message
      })
    }
  })
}

// Hook pour déclencher une synchronisation par module
export function useTriggerModuleSync() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (options: { sync_type: string; direction?: string } | string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const syncType = typeof options === 'string' ? options : options.sync_type
      const direction = typeof options === 'string' ? 'both' : (options.direction || 'both')

      const { data, error } = await supabase.functions.invoke('unified-sync', {
        body: { 
          action: 'module_sync', 
          sync_type: syncType,
          direction,
          user_id: user.id 
        }
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-queue'] })
      queryClient.invalidateQueries({ queryKey: ['sync-logs'] })
      queryClient.invalidateQueries({ queryKey: ['sync-stats'] })
      toast({
        title: 'Synchronisation lancée',
        description: 'Le module est en cours de synchronisation.'
      })
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erreur de synchronisation',
        description: error.message
      })
    }
  })
}

// Hook pour annuler un item de la queue
export function useCancelSyncItem() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('sync_queue')
        .update({ status: 'cancelled' })
        .eq('id', itemId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-queue'] })
      toast({
        title: 'Annulé',
        description: 'L\'item de synchronisation a été annulé.'
      })
    }
  })
}

// Hook pour mettre à jour une configuration de sync
export function useUpsertSyncConfiguration() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (config: Partial<SyncConfiguration> & { integration_id: string; platform: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { error } = await supabase
        .from('sync_configurations')
        .upsert({
          ...config,
          user_id: user.id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,integration_id'
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-configurations'] })
      toast({
        title: 'Configuration mise à jour',
        description: 'Les paramètres de synchronisation ont été enregistrés.'
      })
    }
  })
}
