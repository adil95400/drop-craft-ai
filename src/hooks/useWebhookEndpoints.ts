/**
 * useWebhookEndpoints — CRUD hook for inbound webhook endpoints & events
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

export interface WebhookEndpoint {
  id: string;
  user_id: string;
  name: string;
  platform: string;
  secret_key: string;
  event_types: string[];
  is_active: boolean;
  last_triggered_at: string | null;
  trigger_count: number;
  created_at: string;
  updated_at: string;
}

export interface WebhookEvent {
  id: string;
  endpoint_id: string;
  user_id: string;
  platform: string;
  event_type: string;
  payload: Record<string, any>;
  headers: Record<string, any>;
  status: string;
  error_message: string | null;
  processed_at: string | null;
  created_at: string;
}

export function useWebhookEndpoints() {
  const { user } = useUnifiedAuth();
  const qc = useQueryClient();

  const { data: endpoints = [], isLoading } = useQuery({
    queryKey: ['webhook-endpoints', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await (supabase as any)
        .from('webhook_endpoints')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as WebhookEndpoint[];
    },
    enabled: !!user?.id,
  });

  const createEndpoint = useMutation({
    mutationFn: async (input: { name: string; platform: string; event_types?: string[] }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await (supabase as any)
        .from('webhook_endpoints')
        .insert({
          user_id: user.id,
          name: input.name,
          platform: input.platform,
          event_types: input.event_types || [],
          is_active: true,
        })
        .select()
        .single();
      if (error) throw error;
      return data as WebhookEndpoint;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['webhook-endpoints'] });
      toast.success('Endpoint webhook créé');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleEndpoint = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any)
        .from('webhook_endpoints')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['webhook-endpoints'] });
      toast.success('Statut mis à jour');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteEndpoint = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('webhook_endpoints')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['webhook-endpoints'] });
      toast.success('Endpoint supprimé');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { endpoints, isLoading, createEndpoint, toggleEndpoint, deleteEndpoint };
}

export function useWebhookEvents(endpointId?: string) {
  const { user } = useUnifiedAuth();

  return useQuery({
    queryKey: ['webhook-events', user?.id, endpointId],
    queryFn: async () => {
      if (!user?.id) return [];
      let query = (supabase as any)
        .from('webhook_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (endpointId) {
        query = query.eq('endpoint_id', endpointId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as WebhookEvent[];
    },
    enabled: !!user?.id,
    refetchInterval: 15_000,
  });
}
