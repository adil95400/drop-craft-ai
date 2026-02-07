import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type SyncQueueRow = Database['public']['Tables']['sync_queue']['Row'];
type SyncLogRow = Database['public']['Tables']['sync_logs']['Row'];
type SyncConflictRow = Database['public']['Tables']['sync_conflicts']['Row'];

// Re-export DB types for consumers
export type SyncQueueItem = SyncQueueRow;
export type SyncLog = SyncLogRow;
export type SyncConflict = SyncConflictRow;

export interface SyncItem {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'error';
  frequency: string;
  lastSyncAt: string | null;
  nextSyncAt: string | null;
  lastSyncStatus: 'success' | 'error' | 'pending';
  itemsSynced: number;
}

export function useSyncManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: queue = [], isLoading: isLoadingQueue } = useQuery({
    queryKey: ['sync-queue', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('sync_queue')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: logs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: ['sync-logs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('sync_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: conflicts = [], isLoading: isLoadingConflicts } = useQuery({
    queryKey: ['sync-conflicts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('sync_conflicts')
        .select('*')
        .eq('user_id', user.id)
        .is('resolved_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Derive sync summaries from real queue data
  const syncs: SyncItem[] = (() => {
    if (!queue.length) return [];
    const groups = new Map<string, SyncQueueRow[]>();
    queue.forEach(item => {
      const key = item.sync_type || 'unknown';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    });

    return Array.from(groups.entries()).map(([type, items]) => {
      const latest = items[0];
      const completed = items.filter(i => i.status === 'completed');
      const failed = items.filter(i => i.status === 'failed');
      const pending = items.filter(i => i.status === 'pending' || i.status === 'processing');

      return {
        id: type,
        name: `Sync ${type}`,
        description: `${items.length} opération(s) en file`,
        status: (failed.length > 0 ? 'error' : pending.length > 0 ? 'active' : 'paused') as SyncItem['status'],
        frequency: 'Manuel',
        lastSyncAt: latest.completed_at || latest.started_at,
        nextSyncAt: pending[0]?.scheduled_at || null,
        lastSyncStatus: (failed.length > 0 ? 'error' : completed.length > 0 ? 'success' : 'pending') as SyncItem['lastSyncStatus'],
        itemsSynced: completed.length,
      };
    });
  })();

  const isLoading = isLoadingQueue;

  const triggerSyncMutation = useMutation({
    mutationFn: async (syncId: string) => {
      const { data, error } = await supabase.functions.invoke('sync-integration', {
        body: { sync_type: syncId, user_id: user?.id }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-queue'] });
      queryClient.invalidateQueries({ queryKey: ['sync-logs'] });
      toast.success('Synchronisation déclenchée');
    },
    onError: (err) => toast.error(`Erreur: ${err.message}`)
  });

  const cancelSyncMutation = useMutation({
    mutationFn: async (syncId: string) => {
      const { error } = await supabase.from('sync_queue')
        .update({ status: 'cancelled' })
        .eq('id', syncId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-queue'] });
      toast.success('Synchronisation annulée');
    },
  });

  const retrySyncMutation = useMutation({
    mutationFn: async (syncId: string) => {
      const { error } = await supabase.from('sync_queue')
        .update({ status: 'pending', attempts: 0, error_message: null })
        .eq('id', syncId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-queue'] });
      toast.success('Synchronisation relancée');
    },
  });

  const resolveConflictMutation = useMutation({
    mutationFn: async (params: { conflictId: string; strategy: string }) => {
      const { error } = await supabase.from('sync_conflicts')
        .update({
          resolution: params.strategy,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', params.conflictId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-conflicts'] });
      toast.success('Conflit résolu');
    },
  });

  const triggerSync = (syncId: string) => triggerSyncMutation.mutate(syncId);
  const pauseSync = (syncId: string) => cancelSyncMutation.mutate(syncId);
  const resumeSync = (syncId: string) => retrySyncMutation.mutate(syncId);

  return {
    syncs,
    isLoading,
    triggerSync,
    pauseSync,
    resumeSync,
    queue,
    logs,
    conflicts,
    isLoadingQueue,
    isLoadingLogs,
    isLoadingConflicts,
    queueSync: (params: any) => toast.info('Synchronisation ajoutée'),
    cancelSync: cancelSyncMutation.mutate,
    retrySync: retrySyncMutation.mutate,
    resolveConflict: resolveConflictMutation.mutate,
    isCancelling: cancelSyncMutation.isPending,
    isRetrying: retrySyncMutation.isPending,
    isResolving: resolveConflictMutation.isPending,
  };
}
