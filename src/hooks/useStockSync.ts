import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useStockSync() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // Récupérer les configurations de sync
  const { data: configs = [], isLoading: configsLoading } = useQuery({
    queryKey: ['stock-sync-configs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_sync_configs')
        .select('*, suppliers(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Récupérer l'historique des changements de stock
  const { data: stockHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['stock-history', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_history')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Récupérer les alertes actives
  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['stock-alerts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_alerts')
        .select('*')
        .eq('user_id', user!.id)
        .eq('alert_status', 'active')
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Synchroniser tous les fournisseurs
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
        description: `${data.synced_suppliers} fournisseurs synchronisés`
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

  // Synchroniser un fournisseur spécifique
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
        description: `${data.products_updated} produits mis à jour`
      });
    }
  });

  // Créer/mettre à jour une config
  const upsertConfig = useMutation({
    mutationFn: async (config: any) => {
      const { data, error } = await supabase
        .from('stock_sync_configs')
        .upsert({
          ...config,
          user_id: user!.id,
          next_sync_at: new Date(Date.now() + (config.sync_frequency_minutes * 60 * 1000)).toISOString()
        })
        .select()
        .single();

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

  // Résoudre une alerte
  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('stock_alerts')
        .update({
          alert_status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

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
