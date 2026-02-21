/**
 * useStockSync — Stock synchronization hook with Realtime subscriptions
 * Connects to stock_sync_configs, stock_history, stock_alerts tables
 * Subscribes to Realtime changes on supplier_products for live stock updates
 */
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface StockSyncConfig {
  id: string;
  user_id: string;
  supplier_id: string;
  sync_enabled: boolean;
  sync_frequency_minutes: number;
  low_stock_threshold: number;
  out_of_stock_action: 'pause' | 'notify' | 'hide';
  last_sync_at: string | null;
  next_sync_at: string | null;
  total_syncs: number;
  failed_syncs: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  supplier_name?: string;
  supplier_platform?: string;
}

interface StockHistoryEntry {
  id: string;
  product_id: string;
  product_source: string;
  previous_quantity: number;
  new_quantity: number;
  change_amount: number;
  change_reason: string;
  supplier_id: string | null;
  created_at: string;
}

interface StockAlert {
  id: string;
  product_id: string;
  alert_type: string;
  severity: string;
  message: string;
  status: string;
  created_at: string;
}

export function useStockSync() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // ─── Realtime subscription for supplier_products stock changes ───
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('stock-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'supplier_products',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const oldStock = (payload.old as any)?.stock_quantity;
          const newStock = (payload.new as any)?.stock_quantity;
          const productName = (payload.new as any)?.name || 'Produit';

          if (oldStock !== newStock) {
            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: ['stock-history'] });
            queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
            queryClient.invalidateQueries({ queryKey: ['product-suppliers'] });

            // Show toast for significant changes
            if (newStock === 0) {
              toast({
                title: '⚠️ Rupture de stock',
                description: `${productName} est en rupture de stock`,
                variant: 'destructive',
              });
            } else if (newStock <= 5 && oldStock > 5) {
              toast({
                title: '📉 Stock bas',
                description: `${productName}: ${newStock} unités restantes`,
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stock_history',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['stock-history'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, toast]);

  // ─── Fetch sync configs ───
  const { data: configs = [], isLoading: configsLoading } = useQuery({
    queryKey: ['stock-sync-configs', user?.id],
    queryFn: async (): Promise<StockSyncConfig[]> => {
      const { data, error } = await (supabase
        .from('stock_sync_configs' as any)
        .select('*, suppliers(name, platform)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        supplier_id: item.supplier_id,
        sync_enabled: item.sync_enabled,
        sync_frequency_minutes: item.sync_frequency_minutes,
        low_stock_threshold: item.low_stock_threshold,
        out_of_stock_action: item.out_of_stock_action,
        last_sync_at: item.last_sync_at,
        next_sync_at: item.next_sync_at,
        total_syncs: item.total_syncs,
        failed_syncs: item.failed_syncs,
        last_error: item.last_error,
        created_at: item.created_at,
        updated_at: item.updated_at,
        supplier_name: item.suppliers?.name,
        supplier_platform: item.suppliers?.platform,
      }));
    },
    enabled: !!user?.id,
  });

  // ─── Fetch stock history ───
  const { data: stockHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['stock-history', user?.id],
    queryFn: async (): Promise<StockHistoryEntry[]> => {
      const { data, error } = await (supabase
        .from('stock_history' as any)
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(100) as any);

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product_source: item.product_source,
        previous_quantity: item.previous_quantity,
        new_quantity: item.new_quantity,
        change_amount: item.change_amount,
        change_reason: item.change_reason,
        supplier_id: item.supplier_id,
        created_at: item.created_at,
      }));
    },
    enabled: !!user?.id,
  });

  // ─── Fetch stock alerts ───
  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['stock-alerts', user?.id],
    queryFn: async (): Promise<StockAlert[]> => {
      const { data, error } = await (supabase
        .from('stock_alerts' as any)
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        alert_type: item.alert_type,
        severity: item.severity,
        message: item.message,
        status: item.status,
        created_at: item.created_at,
      }));
    },
    enabled: !!user?.id,
  });

  // ─── Sync all suppliers ───
  const syncAll = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('stock-sync-realtime', {
        body: { action: 'sync_all' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stock-sync-configs'] });
      queryClient.invalidateQueries({ queryKey: ['stock-history'] });
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
      toast({
        title: 'Synchronisation terminée',
        description: `${data?.synced_suppliers || 0} fournisseurs synchronisés`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur de synchronisation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // ─── Sync single supplier ───
  const syncSupplier = useMutation({
    mutationFn: async (supplierId: string) => {
      const { data, error } = await supabase.functions.invoke('stock-sync-realtime', {
        body: { action: 'sync_supplier', supplier_id: supplierId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stock-sync-configs'] });
      queryClient.invalidateQueries({ queryKey: ['stock-history'] });
      toast({
        title: 'Synchronisation terminée',
        description: `${data?.products_updated || 0} produits mis à jour`,
      });
    },
  });

  // ─── Update sync config ───
  const upsertConfig = useMutation({
    mutationFn: async (config: Partial<StockSyncConfig> & { supplier_id: string }) => {
      const { data, error } = await supabase.functions.invoke('stock-sync-realtime', {
        body: {
          action: 'update_config',
          config_id: config.id,
          sync_enabled: config.sync_enabled,
          sync_frequency_minutes: config.sync_frequency_minutes,
          low_stock_threshold: config.low_stock_threshold,
          out_of_stock_action: config.out_of_stock_action,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-sync-configs'] });
      toast({
        title: 'Configuration enregistrée',
        description: 'Les paramètres de synchronisation ont été sauvegardés',
      });
    },
  });

  // ─── Resolve alert ───
  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await (supabase
        .from('stock_alerts' as any)
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', alertId)
        .eq('user_id', user!.id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
      toast({
        title: 'Alerte résolue',
        description: "L'alerte a été marquée comme résolue",
      });
    },
  });

  const stats = {
    totalConfigs: configs.length,
    activeConfigs: configs.filter((c) => c.sync_enabled).length,
    activeAlerts: alerts.length,
    criticalAlerts: alerts.filter((a) => a.severity === 'critical' || a.severity === 'high').length,
    recentChanges: stockHistory.length,
  };

  return {
    configs,
    stockHistory,
    alerts,
    stats,
    isLoading: configsLoading || historyLoading || alertsLoading,
    syncAll: syncAll.mutate,
    isSyncingAll: syncAll.isPending,
    syncSupplier: syncSupplier.mutate,
    isSyncingSupplier: syncSupplier.isPending,
    upsertConfig: upsertConfig.mutate,
    resolveAlert: resolveAlert.mutate,
  };
}
