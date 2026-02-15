import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface SupplierSyncStatus {
  connectionId: string;
  supplierId: string;
  lastSyncAt: string | null;
  autoSyncEnabled: boolean;
  syncIntervalMinutes: number;
  nextSyncAt: string | null;
}

export interface SupplierAlert {
  id: string;
  supplierId: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  createdAt: string;
  data: any;
}

export function useSupplierSyncMonitor() {
  const queryClient = useQueryClient();

  const { data: syncStatuses = [], isLoading: isLoadingStatuses } = useQuery({
    queryKey: ['supplier-sync-statuses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('premium_supplier_connections')
        .select('id, premium_supplier_id, last_sync_at, sync_enabled, settings, connection_status')
        .eq('connection_status', 'connected');

      if (error) throw error;

      return (data || []).map((conn: any) => {
        const syncIntervalMinutes = (conn.settings as any)?.sync_interval_minutes || 15;
        const nextSync = conn.last_sync_at && conn.sync_enabled
          ? new Date(new Date(conn.last_sync_at).getTime() + syncIntervalMinutes * 60 * 1000).toISOString()
          : null;

        return {
          connectionId: conn.id,
          supplierId: conn.premium_supplier_id,
          lastSyncAt: conn.last_sync_at,
          autoSyncEnabled: conn.sync_enabled ?? false,
          syncIntervalMinutes,
          nextSyncAt: nextSync,
        } as SupplierSyncStatus;
      });
    },
    refetchInterval: 30000,
  });

  const { data: recentAlerts = [], isLoading: isLoadingAlerts } = useQuery({
    queryKey: ['supplier-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map((n: any) => ({
        id: n.id,
        supplierId: n.supplier_id,
        type: n.notification_type,
        severity: n.severity,
        title: n.title,
        message: n.message,
        createdAt: n.created_at,
        data: n.data,
      })) as SupplierAlert[];
    },
    refetchInterval: 30000,
  });

  const { data: recentJobs = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: ['supplier-sync-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('job_type', 'supplier_sync')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 15000,
  });

  const toggleAutoSync = async (connectionId: string, enabled: boolean) => {
    const { error } = await supabase
      .from('premium_supplier_connections')
      .update({ sync_enabled: enabled })
      .eq('id', connectionId);

    if (error) {
      toast.error('Erreur lors de la mise à jour');
      return;
    }

    toast.success(enabled ? 'Sync automatique activée' : 'Sync automatique désactivée');
    queryClient.invalidateQueries({ queryKey: ['supplier-sync-statuses'] });
  };

  const updateSyncInterval = async (connectionId: string, minutes: number) => {
    const { error } = await supabase
      .from('premium_supplier_connections')
      .update({ settings: { sync_interval_minutes: minutes } })
      .eq('id', connectionId);

    if (error) {
      toast.error('Erreur lors de la mise à jour');
      return;
    }

    toast.success(`Intervalle mis à jour: toutes les ${minutes} minutes`);
    queryClient.invalidateQueries({ queryKey: ['supplier-sync-statuses'] });
  };

  const triggerManualSync = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('supplier-sync-cron', {
        body: {},
      });

      if (error) throw error;

      toast.success(`Sync manuelle terminée: ${data?.succeeded || 0} fournisseurs synchronisés`);
      queryClient.invalidateQueries({ queryKey: ['supplier-sync-statuses'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-sync-jobs'] });

      return data;
    } catch (err: any) {
      toast.error(`Erreur: ${err.message}`);
      throw err;
    }
  };

  // Realtime subscription for alerts
  useEffect(() => {
    const channel = supabase
      .channel('supplier-sync-alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'supplier_notifications' },
        (payload) => {
          const n = payload.new as any;
          if (n.severity === 'high') {
            toast.error(n.title, { description: n.message });
          } else {
            toast.warning(n.title, { description: n.message });
          }
          queryClient.invalidateQueries({ queryKey: ['supplier-alerts'] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return {
    syncStatuses,
    recentAlerts,
    recentJobs,
    isLoading: isLoadingStatuses || isLoadingAlerts || isLoadingJobs,
    toggleAutoSync,
    updateSyncInterval,
    triggerManualSync,
  };
}
