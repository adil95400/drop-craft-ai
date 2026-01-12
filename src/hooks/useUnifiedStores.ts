import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Store {
  id: string;
  user_id: string;
  name: string;
  domain: string | null;
  country: string;
  currency: string;
  timezone: string;
  logo_url: string | null;
  is_main: boolean;
  is_active: boolean;
  store_type: 'primary' | 'secondary' | 'marketplace';
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface StoreStats {
  store_id: string;
  store_name: string;
  domain: string | null;
  is_active: boolean;
  total_integrations: number;
  active_integrations: number;
  integrations_summary: Array<{
    platform: string;
    status: string;
    last_sync: string | null;
  }>;
}

export function useUnifiedStores() {
  const queryClient = useQueryClient();

  // Fetch all user stores from integrations table
  const { data: stores, isLoading, error } = useQuery({
    queryKey: ['unified-stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform integrations to Store format
      // Use config column (Json) for additional store info
      return (data || []).map(integration => {
        const config = integration.config && typeof integration.config === 'object' 
          ? integration.config as Record<string, any>
          : {};
        
        return {
          id: integration.id,
          user_id: integration.user_id,
          name: config.name || integration.platform_name || integration.platform || 'Boutique',
          domain: integration.store_url || config.shop_domain || config.platform_url || null,
          country: config.country || 'FR',
          currency: config.currency || 'EUR',
          timezone: config.timezone || 'Europe/Paris',
          logo_url: config.logo_url || null,
          is_main: config.is_main || false,
          is_active: integration.is_active ?? true,
          store_type: (config.store_type || 'primary') as 'primary' | 'secondary' | 'marketplace',
          settings: config || {},
          created_at: integration.created_at || new Date().toISOString(),
          updated_at: integration.updated_at || new Date().toISOString(),
        };
      }) as Store[];
    },
  });

  // Fetch store statistics from integrations
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['store-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*');

      if (error) throw error;
      
      // Transform to StoreStats format
      return (data || []).map(integration => {
        const config = integration.config && typeof integration.config === 'object' 
          ? integration.config as Record<string, any>
          : {};
        
        return {
          store_id: integration.id,
          store_name: config.name || integration.platform_name || integration.platform || 'Boutique',
          domain: integration.store_url || config.shop_domain || null,
          is_active: integration.is_active ?? true,
          total_integrations: 1,
          active_integrations: integration.connection_status === 'connected' ? 1 : 0,
          integrations_summary: [{
            platform: integration.platform_name || integration.platform,
            status: integration.connection_status || 'unknown',
            last_sync: integration.last_sync_at
          }]
        };
      }) as StoreStats[];
    },
  });

  // Create new store - redirect to connect page instead
  const createStore = useMutation({
    mutationFn: async (storeData: Partial<Store>) => {
      toast.info('Redirection vers la page de connexion...');
      window.location.href = '/stores-channels/connect';
      return null;
    },
    onSuccess: () => {
      // Handled by redirect
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Update store
  const updateStore = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Store> & { id: string }) => {
      const { data, error } = await supabase
        .from('integrations')
        .update({
          is_active: updates.is_active,
          config: {
            ...updates.settings,
            name: updates.name
          }
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-stores'] });
      queryClient.invalidateQueries({ queryKey: ['store-stats'] });
      toast.success('Boutique mise à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Delete store
  const deleteStore = useMutation({
    mutationFn: async (storeId: string) => {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', storeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-stores'] });
      queryClient.invalidateQueries({ queryKey: ['store-stats'] });
      queryClient.invalidateQueries({ queryKey: ['store-integrations'] });
      toast.success('Boutique supprimée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Toggle store active status
  const toggleStoreActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('integrations')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['unified-stores'] });
      queryClient.invalidateQueries({ queryKey: ['store-stats'] });
      queryClient.invalidateQueries({ queryKey: ['store-integrations'] });
      toast.success(variables.is_active ? 'Boutique activée' : 'Boutique désactivée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return {
    stores: stores || [],
    stats: stats || [],
    isLoading,
    isLoadingStats,
    error,
    createStore: createStore.mutate,
    updateStore: updateStore.mutate,
    deleteStore: deleteStore.mutate,
    toggleStoreActive: toggleStoreActive.mutate,
    isCreating: createStore.isPending,
    isUpdating: updateStore.isPending,
    isDeleting: deleteStore.isPending,
  };
}
