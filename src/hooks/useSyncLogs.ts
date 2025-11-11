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

  // Fetch sync logs
  const { data: logs = [], isLoading, error, refetch } = useQuery({
    queryKey: ['sync_logs', integrationId, limit],
    queryFn: async () => {
      let query = supabase
        .from('sync_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);

      if (integrationId) {
        query = query.eq('integration_id', integrationId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Map database fields to our interface
      return (data || []).map(log => ({
        ...log,
        products_synced: (log.sync_data as any)?.products || log.records_succeeded || 0,
        orders_synced: (log.sync_data as any)?.orders || 0,
        customers_synced: (log.sync_data as any)?.customers || 0,
        errors: log.error_message ? [log.error_message] : [],
        created_at: log.started_at || log.completed_at
      })) as SyncLog[];
    },
    enabled: !!user,
    staleTime: 10000, // 10 seconds
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
          table: 'sync_logs',
          filter: integrationId ? `integration_id=eq.${integrationId}` : undefined
        },
        (payload) => {
          console.log('Sync log change:', payload);
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
