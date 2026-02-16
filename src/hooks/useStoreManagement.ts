import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Store {
  id: string;
  user_id: string;
  name: string;
  platform: string;
  domain: string | null;
  status: string;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export function useStoreManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['stores', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Store[];
    },
    enabled: !!user?.id,
  });

  const addStore = useMutation({
    mutationFn: async (store: { name: string; platform: string; domain?: string }) => {
      if (!user?.id) throw new Error('Non authentifié');
      const { data, error } = await supabase
        .from('stores')
        .insert({ name: store.name, platform: store.platform, domain: store.domain || null, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast.success('Boutique ajoutée !');
    },
    onError: (e: Error) => toast.error(`Erreur : ${e.message}`),
  });

  const updateStore = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Pick<Store, 'name' | 'platform' | 'domain' | 'status'>> }) => {
      const { error } = await supabase
        .from('stores')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast.success('Boutique mise à jour');
    },
  });

  const deleteStore = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('stores').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast.success('Boutique supprimée');
    },
  });

  const primaryStore = stores[0] || null;

  return {
    stores,
    primaryStore,
    isLoading,
    addStore: addStore.mutate,
    updateStore: updateStore.mutate,
    deleteStore: deleteStore.mutate,
    isAdding: addStore.isPending,
  };
}
