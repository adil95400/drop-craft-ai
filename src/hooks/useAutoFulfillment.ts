import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';

async function callFulfillmentEngine(action: string, body: Record<string, any> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Non authentifié');

  const resp = await supabase.functions.invoke('auto-fulfillment-engine', {
    body: { action, ...body },
  });

  if (resp.error) throw new Error(resp.error.message || 'Fulfillment engine error');
  return resp.data;
}

export function useAutoFulfillment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ─── Stats ─────────────────────────────────────────────────────────
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['auto-fulfillment', 'stats'],
    queryFn: () => callFulfillmentEngine('get_stats'),
    staleTime: 30_000,
    select: (data) => ({
      todayOrders: data?.todayOrders || 0,
      successRate: data?.successRate || 0,
      avgProcessingTime: data?.avgProcessingTime || 0,
      pendingOrders: data?.pendingOrders || 0,
      processing: data?.processing || 0,
      completed: data?.completed || 0,
      failed: data?.failed || 0,
      unsyncedTracking: data?.unsyncedTracking || 0,
      bySupplier: data?.bySupplier || {},
      topSuppliers: [],
    }),
  });

  // ─── Orders from auto_order_queue ──────────────────────────────────
  const { data: orders, isLoading: isLoadingOrders, refetch: refetchOrders } = useQuery({
    queryKey: ['auto-fulfillment-orders'],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('auto_order_queue') as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []).map((o: any) => ({
        ...o,
        // Flatten payload for display
        supplier_name: o.supplier_type,
        supplier_cost: o.payload?.total_cost || 0,
        shopify_order_id: o.payload?.order_number || null,
        items_count: o.payload?.items?.length || 0,
      }));
    },
  });

  // ─── Supplier connections ──────────────────────────────────────────
  const { data: connections, isLoading: isLoadingConnections } = useQuery({
    queryKey: ['supplier-connections'],
    queryFn: async () => {
      const { data } = await (supabase
        .from('supplier_credentials_vault') as any)
        .select('id, supplier_slug, connection_status, created_at')
        .eq('connection_status', 'connected');

      return data || [];
    },
  });

  // ─── Process single order ──────────────────────────────────────────
  const processOrderMutation = useMutation({
    mutationFn: (orderId: string) => callFulfillmentEngine('process_order', { order_id: orderId }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['auto-fulfillment'] });
      queryClient.invalidateQueries({ queryKey: ['auto-fulfillment-orders'] });
      sonnerToast.success(`Commande envoyée au fournisseur (${data.supplier})`, {
        description: `${data.items_count} article(s) — ID: ${data.queue_id?.slice(0, 8)}`,
      });
    },
    onError: (err: Error) => sonnerToast.error(`Erreur fulfillment: ${err.message}`),
  });

  // ─── Process all pending ───────────────────────────────────────────
  const processPendingMutation = useMutation({
    mutationFn: () => callFulfillmentEngine('process_pending'),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['auto-fulfillment'] });
      queryClient.invalidateQueries({ queryKey: ['auto-fulfillment-orders'] });
      sonnerToast.success(`${data.processed} commande(s) traitée(s)`);
    },
    onError: (err: Error) => sonnerToast.error(`Erreur: ${err.message}`),
  });

  // ─── Retry failed ─────────────────────────────────────────────────
  const retryFailedMutation = useMutation({
    mutationFn: (queueIds?: string[]) => callFulfillmentEngine('retry_failed', queueIds ? { queue_ids: queueIds } : {}),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['auto-fulfillment'] });
      queryClient.invalidateQueries({ queryKey: ['auto-fulfillment-orders'] });
      sonnerToast.success(`${data.retried} commande(s) relancée(s)`);
    },
    onError: (err: Error) => sonnerToast.error(`Erreur retry: ${err.message}`),
  });

  // ─── Sync tracking to Shopify ──────────────────────────────────────
  const syncTrackingMutation = useMutation({
    mutationFn: () => callFulfillmentEngine('sync_tracking'),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['auto-fulfillment'] });
      if (data.synced > 0) {
        sonnerToast.success(`${data.synced} tracking(s) synchronisé(s) vers Shopify`);
      } else {
        sonnerToast.info('Aucun tracking à synchroniser');
      }
    },
    onError: (err: Error) => sonnerToast.error(`Erreur sync: ${err.message}`),
  });

  // ─── Toggle auto-order (for rules) ─────────────────────────────────
  const toggleAutoOrder = (id: string, enabled: boolean) => {
    supabase
      .from('auto_order_rules' as any)
      .update({ is_active: enabled })
      .eq('id', id)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['auto-fulfillment'] });
        toast({
          title: enabled ? '✅ Auto-commande activée' : 'Auto-commande désactivée',
        });
      });
  };

  return {
    stats,
    isLoadingStats,
    connections,
    isLoadingConnections,
    orders,
    isLoadingOrders,
    refetchOrders,
    toggleAutoOrder,
    // Actions
    processOrder: processOrderMutation.mutate,
    isProcessingOrder: processOrderMutation.isPending,
    processPending: processPendingMutation.mutate,
    isProcessingPending: processPendingMutation.isPending,
    retryFailed: retryFailedMutation.mutate,
    isRetrying: retryFailedMutation.isPending,
    syncTracking: syncTrackingMutation.mutate,
    isSyncingTracking: syncTrackingMutation.isPending,
  };
}
