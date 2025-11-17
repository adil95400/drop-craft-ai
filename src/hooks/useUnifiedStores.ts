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

  // Fetch all user stores
  const { data: stores, isLoading, error } = useQuery({
    queryKey: ['unified-stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores' as any)
        .select('*')
        .order('is_main', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Store[];
    },
  });

  // Fetch store statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['store-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_consolidated_stats' as any)
        .select('*');

      if (error) throw error;
      return data as unknown as StoreStats[];
    },
  });

  // Create new store
  const createStore = useMutation({
    mutationFn: async (storeData: Partial<Store>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('stores' as any)
        .insert({
          user_id: user.id,
          ...storeData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-stores'] });
      queryClient.invalidateQueries({ queryKey: ['store-stats'] });
      toast.success('Boutique créée avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Update store
  const updateStore = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Store> & { id: string }) => {
      const { data, error } = await supabase
        .from('stores' as any)
        .update(updates)
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
        .from('stores' as any)
        .delete()
        .eq('id', storeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-stores'] });
      queryClient.invalidateQueries({ queryKey: ['store-stats'] });
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
        .from('stores' as any)
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
