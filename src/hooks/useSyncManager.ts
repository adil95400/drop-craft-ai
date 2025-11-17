import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Export type definitions for sync entities
export interface SyncQueueItem {
  id: string;
  user_id: string;
  store_id: string | null;
  sync_type: string;
  entity_type: string;
  entity_id: string | null;
  operation: string;
  priority: number;
  status: string;
  retry_count: number;
  max_retries: number;
  error_message: string | null;
  payload: any;
  scheduled_at: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SyncLog {
  id: string;
  user_id: string;
  store_id: string | null;
  sync_type: string;
  operation: string;
  entity_type: string | null;
  entity_id: string | null;
  status: string;
  duration_ms: number | null;
  message: string;
  error_details: any;
  metadata: any;
  created_at: string;
}

export interface SyncConflict {
  id: string;
  user_id: string;
  store_id: string | null;
  entity_type: string;
  entity_id: string;
  conflict_type: string;
  local_data: any;
  remote_data: any;
  resolution_strategy: string | null;
  resolved_at: string | null;
  resolved_data: any;
  created_at: string;
  updated_at: string;
}

export function useSyncManager() {
  const queryClient = useQueryClient();

  // Fetch sync queue
  const {
    data: queue = [],
    isLoading: isLoadingQueue,
  } = useQuery({
    queryKey: ['sync-queue'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('sync_queue')
        .select('*')
        .order('priority', { ascending: true })
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      return (data || []) as SyncQueueItem[];
    },
  });

  // Fetch sync logs
  const {
    data: logs = [],
    isLoading: isLoadingLogs,
  } = useQuery({
    queryKey: ['sync-logs'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as SyncLog[];
    },
  });

  // Fetch sync conflicts
  const {
    data: conflicts = [],
    isLoading: isLoadingConflicts,
  } = useQuery({
    queryKey: ['sync-conflicts'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('sync_conflicts')
        .select('*')
        .is('resolved_at', null)
        .order('created_at', { ascending: false});

      if (error) throw error;
      return (data || []) as SyncConflict[];
    },
  });

  // Queue a new sync
  const queueSync = useMutation({
    mutationFn: async (params: {
      storeId: string;
      syncType: string;
      entityType: string;
      operation: string;
      priority?: number;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await (supabase as any).from('sync_queue').insert({
        user_id: user.user.id,
        store_id: params.storeId,
        sync_type: params.syncType,
        entity_type: params.entityType,
        operation: params.operation,
        priority: params.priority || 5,
        status: 'pending',
        retry_count: 0,
        max_retries: 3,
        payload: {},
        scheduled_at: new Date().toISOString(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-queue'] });
      toast.success('Synchronisation ajoutée à la file d\'attente');
    },
    onError: () => {
      toast.error('Erreur lors de l\'ajout de la synchronisation');
    },
  });

  // Cancel a sync job
  const cancelSync = useMutation({
    mutationFn: async (syncId: string) => {
      const { error } = await (supabase as any)
        .from('sync_queue')
        .update({ status: 'cancelled' })
        .eq('id', syncId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-queue'] });
      toast.success('Synchronisation annulée');
    },
    onError: () => {
      toast.error('Erreur lors de l\'annulation');
    },
  });

  // Retry a failed sync
  const retrySync = useMutation({
    mutationFn: async (syncId: string) => {
      const { error } = await (supabase as any)
        .from('sync_queue')
        .update({
          status: 'pending',
          error_message: null,
          scheduled_at: new Date().toISOString(),
        })
        .eq('id', syncId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-queue'] });
      toast.success('Synchronisation relancée');
    },
    onError: () => {
      toast.error('Erreur lors de la relance');
    },
  });

  // Resolve a conflict
  const resolveConflict = useMutation({
    mutationFn: async (params: { conflictId: string; strategy: string }) => {
      const conflict = conflicts.find((c) => c.id === params.conflictId);
      if (!conflict) throw new Error('Conflict not found');

      let resolvedData;
      switch (params.strategy) {
        case 'local_wins':
          resolvedData = conflict.local_data;
          break;
        case 'remote_wins':
          resolvedData = conflict.remote_data;
          break;
        case 'merge':
          resolvedData = { ...conflict.remote_data, ...conflict.local_data };
          break;
        default:
          throw new Error('Invalid strategy');
      }

      const { error } = await (supabase as any)
        .from('sync_conflicts')
        .update({
          resolution_strategy: params.strategy,
          resolved_data: resolvedData,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', params.conflictId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-conflicts'] });
      toast.success('Conflit résolu');
    },
    onError: () => {
      toast.error('Erreur lors de la résolution du conflit');
    },
  });

  return {
    queue,
    logs,
    conflicts,
    isLoadingQueue,
    isLoadingLogs,
    isLoadingConflicts,
    queueSync,
    cancelSync: cancelSync.mutate,
    retrySync: retrySync.mutate,
    resolveConflict: resolveConflict.mutate,
    isCancelling: cancelSync.isPending,
    isRetrying: retrySync.isPending,
    isResolving: resolveConflict.isPending,
  };
}
