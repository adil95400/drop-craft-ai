/**
 * useEventOutbox — Monitor and interact with the event outbox
 * Provides realtime subscription to outbox events and stats
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface OutboxEvent {
  id: string;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  user_id: string;
  payload: Record<string, any> | null;
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  status: string | null;
  retry_count: number | null;
  max_retries: number | null;
  priority: number | null;
  correlation_id: string | null;
  created_at: string | null;
  processed_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

export function useEventOutbox(options?: { limit?: number; status?: string }) {
  const queryClient = useQueryClient();
  const limit = options?.limit ?? 50;

  const query = useQuery({
    queryKey: ['event-outbox', options?.status, limit],
    queryFn: async () => {
      let q = supabase.from('event_outbox')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (options?.status) {
        q = q.eq('status', options.status);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as OutboxEvent[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('event-outbox-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'event_outbox',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['event-outbox'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}

export function useEventBusStats() {
  return useQuery({
    queryKey: ['event-bus-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('event-bus-processor', {
        body: { action: 'stats' },
      });
      if (error) throw error;
      return data as {
        outbox: { total: number; by_status: Record<string, number>; by_event_type: Record<string, number> };
      };
    },
    refetchInterval: 30000,
  });
}

export function useRetryDeadLetters() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('event-bus-processor', {
        body: { action: 'dlq_retry' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-outbox'] });
      queryClient.invalidateQueries({ queryKey: ['event-bus-stats'] });
    },
  });
}

export function useCleanupOutbox() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (days: number = 7) => {
      const { data, error } = await supabase.functions.invoke('event-bus-processor', {
        body: { action: 'cleanup', days },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-outbox'] });
      queryClient.invalidateQueries({ queryKey: ['event-bus-stats'] });
    },
  });
}

export function useProcessEventBus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('event-bus-processor', {
        body: { action: 'process_queue' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-outbox'] });
      queryClient.invalidateQueries({ queryKey: ['event-bus-stats'] });
    },
  });
}
