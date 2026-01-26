import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SyncConfiguration {
  id: string;
  user_id: string;
  integration_id: string;
  platform: string;
  sync_products: boolean;
  sync_prices: boolean;
  sync_stock: boolean;
  sync_orders: boolean;
  sync_customers: boolean;
  sync_tracking: boolean;
  sync_reviews: boolean;
  sync_direction: 'import' | 'export' | 'bidirectional';
  sync_frequency: 'realtime' | '5min' | '15min' | 'hourly' | 'daily';
  conflict_resolution: 'shopopti_priority' | 'store_priority' | 'newest_wins';
  is_active: boolean;
  last_full_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UnifiedSyncQueueItem {
  id: string;
  user_id: string;
  sync_type: string;
  entity_type: string;
  entity_id: string;
  action: string;
  channels: any[];
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  retry_count: number;
  max_retries: number;
  error_message: string | null;
  scheduled_at: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface UnifiedSyncLog {
  id: string;
  user_id: string;
  queue_id: string | null;
  sync_type: string;
  platform: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  status: 'success' | 'failed' | 'partial' | 'skipped';
  items_processed: number;
  items_succeeded: number;
  items_failed: number;
  duration_ms: number | null;
  error_details: any;
  metadata: any;
  created_at: string;
}

// Hook pour les configurations de sync
export function useSyncConfigurations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sync-configurations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('sync_configurations')
        .select(`
          *,
          integrations:integration_id (
            id, platform, store_url, is_active, connection_status
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as (SyncConfiguration & { integrations: any })[];
    },
    enabled: !!user?.id,
  });
}

// Hook pour la queue de sync
export function useUnifiedSyncQueue() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unified-sync-queue', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('unified_sync_queue')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'processing'])
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as unknown as UnifiedSyncQueueItem[];
    },
    enabled: !!user?.id,
    refetchInterval: 5000,
  });
}

// Hook pour les logs de sync
export function useUnifiedSyncLogs(limit = 50) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unified-sync-logs', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('unified_sync_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as unknown as UnifiedSyncLog[];
    },
    enabled: !!user?.id,
  });
}

// Hook pour les statistiques de sync
export function useSyncStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sync-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get queue stats
      const { data: queueData } = await supabase
        .from('unified_sync_queue')
        .select('status')
        .eq('user_id', user.id);

      // Get today's logs
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: logsData } = await supabase
        .from('unified_sync_logs')
        .select('status, items_processed, items_succeeded, items_failed')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());

      // Get active integrations count
      const { data: integrationsData } = await supabase
        .from('integrations')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      const queue = queueData || [];
      const logs = logsData || [];

      return {
        pending: queue.filter(q => q.status === 'pending').length,
        processing: queue.filter(q => q.status === 'processing').length,
        todaySuccess: logs.filter(l => l.status === 'success').length,
        todayFailed: logs.filter(l => l.status === 'failed').length,
        todayPartial: logs.filter(l => l.status === 'partial').length,
        totalProcessed: logs.reduce((sum, l) => sum + (l.items_processed || 0), 0),
        totalSucceeded: logs.reduce((sum, l) => sum + (l.items_succeeded || 0), 0),
        activeIntegrations: integrationsData?.length || 0,
      };
    },
    enabled: !!user?.id,
    refetchInterval: 10000,
  });
}

// Mutation pour créer/mettre à jour une configuration de sync
export function useUpsertSyncConfiguration() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (config: Partial<SyncConfiguration> & { integration_id: string; platform: string }) => {
      if (!user?.id) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('sync_configurations')
        .upsert({
          user_id: user.id,
          ...config,
        }, {
          onConflict: 'user_id,integration_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-configurations'] });
      toast.success('Configuration de synchronisation mise à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Mutation pour lancer une sync complète
export function useTriggerFullSync() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (options?: { 
      sync_types?: string[]; 
      platforms?: string[];
      force_full_sync?: boolean;
    }) => {
      if (!user?.id) throw new Error('Non authentifié');

      const { data, error } = await supabase.functions.invoke('unified-sync-orchestrator', {
        body: {
          user_id: user.id,
          ...options,
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['unified-sync-queue'] });
      queryClient.invalidateQueries({ queryKey: ['unified-sync-logs'] });
      queryClient.invalidateQueries({ queryKey: ['sync-stats'] });
      toast.success(`Synchronisation lancée: ${data?.results?.length || 0} intégrations`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur de synchronisation: ${error.message}`);
    },
  });
}

// Mutation pour sync un module spécifique
export function useTriggerModuleSync() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      sync_type, 
      integration_id,
      platform,
      direction 
    }: { 
      sync_type: 'products' | 'prices' | 'stock' | 'orders' | 'customers' | 'tracking';
      integration_id?: string;
      platform?: string;
      direction?: 'import' | 'export' | 'bidirectional';
    }) => {
      if (!user?.id) throw new Error('Non authentifié');

      const functionMap: Record<string, string> = {
        'products': 'channel-sync-bidirectional',
        'prices': 'process-price-sync-queue',
        'stock': 'sync-stock-to-channels',
        'orders': 'sync-orders-to-channels',
        'customers': 'sync-customers-to-channels',
        'tracking': 'sync-tracking-to-channels',
      };

      const { data, error } = await supabase.functions.invoke(functionMap[sync_type], {
        body: {
          user_id: user.id,
          integration_id,
          platform,
          direction: direction || 'bidirectional',
          sync_type,
        }
      });

      if (error) throw error;
      
      // Handle case where function returns success but with no data to sync
      if (data && !data.success && data.error) {
        throw new Error(data.error);
      }
      
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['unified-sync-queue'] });
      queryClient.invalidateQueries({ queryKey: ['unified-sync-logs'] });
      queryClient.invalidateQueries({ queryKey: ['sync-stats'] });
      
      const moduleNames: Record<string, string> = {
        products: 'Produits',
        prices: 'Prix',
        stock: 'Stock',
        orders: 'Commandes',
        customers: 'Clients',
        tracking: 'Tracking',
      };
      
      toast.success(`Sync ${moduleNames[variables.sync_type]} terminée`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Mutation pour annuler un item de la queue
export function useCancelSyncItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('unified_sync_queue')
        .update({ status: 'cancelled' })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-sync-queue'] });
      toast.success('Synchronisation annulée');
    },
  });
}
