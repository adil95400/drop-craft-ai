import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SyncLog {
  id: string;
  integration_id: string;
  sync_type: string;
  status: string;
  records_processed: number;
  records_succeeded: number;
  records_failed: number;
  error_message: string;
  sync_data: any;
  started_at: string;
  completed_at: string;
  created_at?: string;
  products_synced?: number;
  orders_synced?: number;
  customers_synced?: number;
  errors?: string[];
}

export function useSyncLogs(integrationId?: string, limit = 20) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch sync logs from activity_logs table
  const { data: logs = [], isLoading, error, refetch } = useQuery({
    queryKey: ['sync_logs', integrationId, limit],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('activity_logs')
        .select('*')
        .eq('entity_type', 'sync')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (integrationId) {
        query = query.eq('entity_id', integrationId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Map activity_logs to SyncLog interface
      return (data || []).map((log: any): SyncLog => {
        const details = (log.details || {}) as any;
        return {
          id: log.id,
          integration_id: log.entity_id || '',
          sync_type: log.action || 'sync',
          status: details.status || 'completed',
          records_processed: details.records_processed || details.total || 0,
          records_succeeded: details.records_succeeded || details.success || 0,
          records_failed: details.records_failed || details.failed || 0,
          error_message: log.description || '',
          sync_data: details,
          started_at: log.created_at,
          completed_at: log.created_at,
          products_synced: details.products || 0,
          orders_synced: details.orders || 0,
          customers_synced: details.customers || 0,
          errors: log.description ? [log.description] : [],
          created_at: log.created_at
        };
      });
    },
    enabled: !!user,
    staleTime: 10000,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('sync-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_logs',
          filter: 'entity_type=eq.sync'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['sync_logs'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, integrationId, queryClient]);

  // Calculate statistics
  const stats = {
    total: logs.length,
    completed: logs.filter(l => l.status === 'completed').length,
    failed: logs.filter(l => l.status === 'failed').length,
    inProgress: logs.filter(l => l.status === 'in_progress').length,
    totalProducts: logs.reduce((sum, l) => sum + (l.products_synced || 0), 0),
    totalOrders: logs.reduce((sum, l) => sum + (l.orders_synced || 0), 0),
    totalCustomers: logs.reduce((sum, l) => sum + (l.customers_synced || 0), 0),
  };

  return {
    logs,
    stats,
    isLoading,
    error,
    refetch,
  };
}
