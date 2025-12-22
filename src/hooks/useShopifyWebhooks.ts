import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ShopifyWebhook {
  id: string;
  user_id: string;
  integration_id: string;
  webhook_id: string;
  topic: string;
  address: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebhookEvent {
  id: string;
  integration_id: string;
  platform: string;
  event_type: string;
  webhook_data: any;
  processed: boolean;
  processed_at: string | null;
  error_message: string | null;
  created_at: string;
}

export function useShopifyWebhooks(integrationId?: string) {
  const queryClient = useQueryClient();

  // Fetch webhooks via edge function since no shopify_webhooks table exists
  const { data: webhooks = [], isLoading, refetch } = useQuery({
    queryKey: ['shopify-webhooks', integrationId],
    queryFn: async (): Promise<ShopifyWebhook[]> => {
      if (!integrationId) return [];

      // Use edge function to get webhooks from Shopify API
      const { data, error } = await supabase.functions.invoke('shopify-webhook-manager', {
        body: {
          action: 'list',
          integration_id: integrationId
        }
      });

      if (error) throw error;
      return (data?.webhooks || []) as ShopifyWebhook[];
    },
    enabled: !!integrationId,
  });

  // Fetch webhook events from activity_logs
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['webhook-events', integrationId],
    queryFn: async (): Promise<WebhookEvent[]> => {
      if (!integrationId) return [];

      const { data, error } = await (supabase
        .from('activity_logs')
        .select('*')
        .eq('entity_type', 'webhook')
        .eq('entity_id', integrationId)
        .order('created_at', { ascending: false })
        .limit(50) as any);

      if (error) throw error;
      
      return (data || []).map((log: any) => ({
        id: log.id,
        integration_id: integrationId,
        platform: 'shopify',
        event_type: log.action,
        webhook_data: log.details,
        processed: true,
        processed_at: log.created_at,
        error_message: null,
        created_at: log.created_at
      }));
    },
    enabled: !!integrationId,
  });

  // Register webhooks mutation
  const registerWebhooksMutation = useMutation({
    mutationFn: async ({ integrationId, topics }: { integrationId: string; topics: string[] }) => {
      const { data, error } = await supabase.functions.invoke('shopify-webhook-manager', {
        body: {
          action: 'register',
          integration_id: integrationId,
          topics
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shopify-webhooks'] });
      const registered = data.data?.registered || [];
      const successful = registered.filter((r: any) => r.status === 'registered').length;
      const failed = registered.filter((r: any) => r.status === 'error').length;
      
      if (successful > 0) {
        toast.success(`${successful} webhook(s) enregistré(s) avec succès`);
      }
      if (failed > 0) {
        toast.error(`${failed} webhook(s) ont échoué`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de l'enregistrement: ${error.message}`);
    }
  });

  // Unregister webhooks mutation
  const unregisterWebhooksMutation = useMutation({
    mutationFn: async ({ integrationId, topics }: { integrationId: string; topics: string[] }) => {
      const { data, error } = await supabase.functions.invoke('shopify-webhook-manager', {
        body: {
          action: 'unregister',
          integration_id: integrationId,
          topics
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopify-webhooks'] });
      toast.success('Webhook(s) supprimé(s) avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    }
  });

  // Sync webhooks mutation
  const syncWebhooksMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const { data, error } = await supabase.functions.invoke('shopify-webhook-manager', {
        body: {
          action: 'sync',
          integration_id: integrationId
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shopify-webhooks'] });
      const synced = data.data?.synced || [];
      const removed = data.data?.removed || [];
      toast.success(`Synchronisation terminée: ${synced.length} ajouté(s), ${removed.length} supprimé(s)`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la synchronisation: ${error.message}`);
    }
  });

  return {
    webhooks,
    events,
    isLoading,
    eventsLoading,
    refetch,
    registerWebhooks: registerWebhooksMutation.mutate,
    unregisterWebhooks: unregisterWebhooksMutation.mutate,
    syncWebhooks: syncWebhooksMutation.mutate,
    isRegistering: registerWebhooksMutation.isPending,
    isUnregistering: unregisterWebhooksMutation.isPending,
    isSyncing: syncWebhooksMutation.isPending,
  };
}