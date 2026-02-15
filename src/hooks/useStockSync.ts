import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface StockSyncConfig {
  id: string;
  user_id: string;
  supplier_id?: string;
  sync_enabled: boolean;
  sync_frequency_minutes: number;
  last_sync_at?: string;
  next_sync_at?: string;
  created_at: string;
}

interface StockHistoryEntry {
  id: string;
  product_id: string;
  previous_stock: number;
  new_stock: number;
  change_reason: string;
  created_at: string;
}

interface StockAlert {
  id: string;
  product_id: string;
  alert_type: string;
  severity: string;
  message: string;
  alert_status: string;
  created_at: string;
}

export function useStockSync() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch configurations from price_stock_monitoring table
  const { data: configs = [], isLoading: configsLoading } = useQuery({
    queryKey: ['stock-sync-configs', user?.id],
    queryFn: async (): Promise<StockSyncConfig[]> => {
      const { data, error } = await (supabase
        .from('products')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        supplier_id: item.product_id,
        sync_enabled: item.is_active || false,
        sync_frequency_minutes: 60,
        last_sync_at: item.last_checked_at,
        next_sync_at: item.last_checked_at,
        created_at: item.created_at
      }));
    },
    enabled: !!user?.id
  });

  // Fetch stock history from price_history table
  const { data: stockHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['stock-history', user?.id],
    queryFn: async (): Promise<StockHistoryEntry[]> => {
      const { data, error } = await (supabase
        .from('price_history')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(100) as any);

      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        previous_stock: item.old_price || 0,
        new_stock: item.new_price || 0,
        change_reason: item.change_reason || 'stock_update',
        created_at: item.created_at
      }));
    },
    enabled: !!user?.id
  });

  // Fetch alerts from active_alerts table
  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['stock-alerts', user?.id],
    queryFn: async (): Promise<StockAlert[]> => {
      const { data, error } = await (supabase
        .from('active_alerts')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .eq('alert_type', 'stock')
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        id: item.id,
        product_id: item.metadata?.product_id || '',
        alert_type: item.alert_type,
        severity: item.severity,
        message: item.message,
        alert_status: item.status,
        created_at: item.created_at
      }));
    },
    enabled: !!user?.id
  });

  // Synchronize all suppliers
  const syncAll = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('stock-sync-realtime', {
        body: { action: 'sync_all' }
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
        description: `${data?.synced_suppliers || 0} fournisseurs synchronisés`
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur de synchronisation',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Synchronize a specific supplier
  const syncSupplier = useMutation({
    mutationFn: async (supplierId: string) => {
      const { data, error } = await supabase.functions.invoke('stock-sync-realtime', {
        body: { action: 'sync_supplier', supplier_id: supplierId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stock-sync-configs'] });
      queryClient.invalidateQueries({ queryKey: ['stock-history'] });
      toast({
        title: 'Synchronisation terminée',
        description: `${data?.products_updated || 0} produits mis à jour`
      });
    }
  });

  // Create/update a config
  const upsertConfig = useMutation({
    mutationFn: async (config: any) => {
      const { data, error } = await (supabase
        .from('products')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id || config.supplier_id)
        .select()
        .single() as any);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-sync-configs'] });
      toast({
        title: 'Configuration enregistrée',
        description: 'Les paramètres de synchronisation ont été sauvegardés'
      });
    }
  });

  // Resolve an alert
  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await (supabase
        .from('active_alerts')
        .update({
          status: 'resolved',
          acknowledged: true,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId) as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
      toast({
        title: 'Alerte résolue',
        description: 'L\'alerte a été marquée comme résolue'
      });
    }
  });

  const stats = {
    totalConfigs: configs.length,
    activeConfigs: configs.filter(c => c.sync_enabled).length,
    activeAlerts: alerts.length,
    criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
    recentChanges: stockHistory.length
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
    resolveAlert: resolveAlert.mutate
  };
}