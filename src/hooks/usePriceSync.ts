import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types for the original price sync
export interface PriceSyncConfig {
  strategy: 'lowest' | 'highest' | 'average' | 'margin_based';
  margin_percent?: number;
  round_to?: number;
}

export interface PriceSyncResult {
  products_synced: number;
  errors: number;
  results: Array<{
    product_id: string;
    sku: string;
    name: string;
    old_price: number;
    new_price: number;
    marketplaces_updated: number;
    error?: string;
  }>;
}

// Types for channel sync
export interface ChannelMapping {
  id: string;
  user_id: string;
  product_id: string;
  product_source_table: string;
  channel_id: string;
  platform: string;
  external_product_id: string;
  external_variant_id: string | null;
  external_sku: string | null;
  current_synced_price: number | null;
  last_synced_at: string | null;
  sync_status: 'pending' | 'synced' | 'error' | 'stale';
  sync_error: string | null;
  created_at: string;
}

export interface PriceSyncQueueItem {
  id: string;
  product_id: string;
  old_price: number | null;
  new_price: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  trigger_source: string;
  channels_to_sync: string[];
  channels_synced: Array<{ channel_id: string; status: string; synced_at: string }>;
  created_at: string;
  completed_at: string | null;
}

export interface PriceSyncLog {
  id: string;
  product_id: string;
  platform: string;
  external_product_id: string;
  old_price: number | null;
  new_price: number;
  status: 'success' | 'error' | 'skipped';
  error_message: string | null;
  duration_ms: number;
  created_at: string;
}

// Original hook
export function usePriceSync() {
  const queryClient = useQueryClient();

  const syncPrices = useMutation({
    mutationFn: async ({ 
      productIds, 
      config 
    }: { 
      productIds?: string[]; 
      config: PriceSyncConfig 
    }) => {
      const { data, error } = await supabase.functions.invoke('price-sync-auto', {
        body: { productIds, config },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data as PriceSyncResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-products'] });
      queryClient.invalidateQueries({ queryKey: ['price-history'] });
      
      if (data.errors > 0) {
        toast.warning(
          `${data.products_synced} produits synchronisés, ${data.errors} erreurs`
        );
      } else {
        toast.success(
          `${data.products_synced} prix synchronisés avec succès`
        );
      }
    },
    onError: (error) => {
      toast.error(`Erreur de synchronisation: ${error.message}`);
    },
  });

  return {
    syncPrices: syncPrices.mutate,
    isSyncing: syncPrices.isPending,
    lastSyncResult: syncPrices.data,
  };
}

// Hook pour les mappings de canaux d'un produit
export function useProductChannelMappings(productId?: string) {
  return useQuery({
    queryKey: ['channel-mappings', productId],
    queryFn: async () => {
      let query = supabase
        .from('product_channel_mappings' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ChannelMapping[];
    },
    enabled: true,
  });
}

// Hook pour la queue de sync
export function usePriceSyncQueue() {
  return useQuery({
    queryKey: ['price-sync-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_sync_queue' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as PriceSyncQueueItem[];
    },
    refetchInterval: 10000,
  });
}

// Hook pour les logs de sync
export function usePriceSyncLogs(limit = 50) {
  return useQuery({
    queryKey: ['price-sync-logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_sync_logs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as PriceSyncLog[];
    },
  });
}

// Hook pour créer un mapping
export function useCreateChannelMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mapping: Partial<ChannelMapping>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('product_channel_mappings' as any)
        .insert([{ ...mapping, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-mappings'] });
      toast.success('Mapping créé');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Hook pour déclencher une sync manuelle
export function useTriggerPriceSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, newPrice, channels }: { productId: string; newPrice: number; channels?: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: queueItem, error: queueError } = await supabase
        .from('price_sync_queue' as any)
        .insert([{
          user_id: user.id,
          product_id: productId,
          new_price: newPrice,
          trigger_source: 'manual',
          channels_to_sync: channels || [],
          priority: 10
        }])
        .select()
        .single();

      if (queueError) throw queueError;

      const { data, error } = await supabase.functions.invoke('sync-prices-to-channels', {
        body: { queue_id: queueItem.id, product_id: productId, new_price: newPrice, user_id: user.id, channels }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['channel-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['price-sync-queue'] });
      queryClient.invalidateQueries({ queryKey: ['price-sync-logs'] });
      
      if (data?.synced > 0) {
        toast.success(`Prix synchronisé sur ${data.synced} canal(aux)`);
      } else {
        toast.info('Aucun canal à synchroniser');
      }
    },
    onError: (error: Error) => {
      toast.error(`Erreur de sync: ${error.message}`);
    },
  });
}

// Hook pour les stats de sync
export function usePriceSyncStats() {
  return useQuery({
    queryKey: ['price-sync-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { totalMappings: 0, syncedCount: 0, errorCount: 0, pendingQueue: 0, successToday: 0, errorsToday: 0 };

      const [mappings, queuePending, logsToday] = await Promise.all([
        supabase.from('product_channel_mappings' as any).select('sync_status').eq('user_id', user.id),
        supabase.from('price_sync_queue' as any).select('*', { count: 'exact' }).eq('user_id', user.id).eq('status', 'pending'),
        supabase.from('price_sync_logs' as any).select('status').eq('user_id', user.id).gte('created_at', new Date(Date.now() - 86400000).toISOString())
      ]);

      const mappingsData = (mappings.data || []) as any[];
      const logsData = (logsToday.data || []) as any[];

      return {
        totalMappings: mappingsData.length,
        syncedCount: mappingsData.filter(m => m.sync_status === 'synced').length,
        errorCount: mappingsData.filter(m => m.sync_status === 'error').length,
        pendingQueue: queuePending.count || 0,
        successToday: logsData.filter(l => l.status === 'success').length,
        errorsToday: logsData.filter(l => l.status === 'error').length
      };
    },
    staleTime: 30000,
  });
}
