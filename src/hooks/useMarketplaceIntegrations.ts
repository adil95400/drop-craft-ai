import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MarketplaceIntegration {
  id: string;
  platform: string;
  platform_name: string;
  connection_status: string;
  is_active: boolean;
  store_url: string | null;
  store_id: string | null;
  last_sync_at: string | null;
  sync_frequency: string | null;
  auto_sync_enabled: boolean | null;
  created_at: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  amazon: 'Amazon',
  ebay: 'eBay',
  etsy: 'Etsy',
  tiktok: 'TikTok Shop',
  shopify: 'Shopify',
  woocommerce: 'WooCommerce',
  cdiscount: 'Cdiscount',
  allegro: 'Allegro',
  manomano: 'ManoMano',
};

export function useMarketplaceIntegrations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['marketplace-integrations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('integrations')
        .select('id, platform, platform_name, connection_status, is_active, store_url, store_id, last_sync_at, sync_frequency, auto_sync_enabled, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as MarketplaceIntegration[];
    },
    enabled: !!user?.id,
  });

  const connectPlatform = useMutation({
    mutationFn: async ({ platform, credentials }: { platform: string; credentials: Record<string, string> }) => {
      if (!user?.id) throw new Error('Non authentifié');
      const { data, error } = await supabase
        .from('integrations')
        .insert({
          user_id: user.id,
          platform,
          platform_name: PLATFORM_LABELS[platform] || platform,
          connection_status: 'connected',
          is_active: true,
          store_url: credentials.shop_url || credentials.store_url || null,
          store_id: credentials.seller_id || credentials.shop_id || null,
          config: { credentials_provided: true },
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { platform }) => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-integrations'] });
      toast.success(`${PLATFORM_LABELS[platform] || platform} connecté !`);
    },
    onError: (e: Error) => toast.error(`Erreur : ${e.message}`),
  });

  const disconnectPlatform = useMutation({
    mutationFn: async (integrationId: string) => {
      const { error } = await supabase
        .from('integrations')
        .update({ connection_status: 'disconnected', is_active: false })
        .eq('id', integrationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-integrations'] });
      toast.success('Plateforme déconnectée');
    },
  });

  const syncPlatform = useMutation({
    mutationFn: async (integrationId: string) => {
      const { error } = await supabase
        .from('integrations')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', integrationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-integrations'] });
      toast.success('Synchronisation lancée');
    },
  });

  const connected = integrations.filter(i => i.connection_status === 'connected' && i.is_active);
  const disconnected = integrations.filter(i => i.connection_status !== 'connected' || !i.is_active);

  return {
    integrations,
    connected,
    disconnected,
    isLoading,
    connectPlatform: connectPlatform.mutateAsync,
    disconnectPlatform: disconnectPlatform.mutate,
    syncPlatform: syncPlatform.mutate,
    isConnecting: connectPlatform.isPending,
  };
}
