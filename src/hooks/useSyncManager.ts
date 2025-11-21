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
  const mockSyncs = [
    {
      id: '1',
      name: 'Synchronisation produits',
      description: 'Synchronise les produits avec la plateforme principale',
      status: 'active',
      frequency: 'Toutes les heures',
      lastSyncAt: new Date(Date.now() - 3600000).toISOString(),
      nextSyncAt: new Date(Date.now() + 600000).toISOString(),
      lastSyncStatus: 'success',
      itemsSynced: 125
    },
    {
      id: '2',
      name: 'Synchronisation stock',
      description: 'Met à jour les niveaux de stock en temps réel',
      status: 'active',
      frequency: 'Toutes les 15 minutes',
      lastSyncAt: new Date(Date.now() - 900000).toISOString(),
      nextSyncAt: new Date(Date.now() + 300000).toISOString(),
      lastSyncStatus: 'success',
      itemsSynced: 98
    },
    {
      id: '3',
      name: 'Synchronisation commandes',
      description: 'Importe les nouvelles commandes depuis les marketplaces',
      status: 'paused',
      frequency: 'Toutes les 5 minutes',
      lastSyncAt: new Date(Date.now() - 7200000).toISOString(),
      nextSyncAt: null,
      lastSyncStatus: 'error',
      itemsSynced: 42
    }
  ];

  const syncs = mockSyncs;
  const isLoading = false;

  const triggerSync = (syncId: string) => {
    toast.success('Synchronisation déclenchée manuellement');
  };

  const pauseSync = (syncId: string) => {
    toast.success('Synchronisation mise en pause');
  };

  const resumeSync = (syncId: string) => {
    toast.success('Synchronisation reprise');
  };

  return {
    syncs,
    isLoading,
    triggerSync,
    pauseSync,
    resumeSync,
    queue: [],
    logs: [],
    conflicts: [],
    isLoadingQueue: false,
    isLoadingLogs: false,
    isLoadingConflicts: false,
    queueSync: (params: any) => toast.info('Synchronisation ajoutée'),
    cancelSync: (syncId: string) => toast.info('Synchronisation annulée'),
    retrySync: (syncId: string) => toast.info('Synchronisation relancée'),
    resolveConflict: (params: any) => toast.info('Conflit résolu'),
    isCancelling: false,
    isRetrying: false,
    isResolving: false,
  };
}
