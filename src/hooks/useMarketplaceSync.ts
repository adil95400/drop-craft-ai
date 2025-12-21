import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export type MarketplaceConnection = {
  id: string;
  platform: string;
  platform_name?: string;
  store_name?: string;
  connection_status?: string;
  is_active?: boolean;
  credentials?: Record<string, any>;
  last_sync_at?: string;
  created_at?: string;
  updated_at?: string;
}

export type SyncLog = {
  id: string;
  status?: string;
  sync_type?: string;
  started_at?: string;
  completed_at?: string;
  success_items?: number;
  error_items?: number;
  created_at?: string;
}

export function useMarketplaceSync() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: connections = [], isLoading: isLoadingConnections } = useQuery({
    queryKey: ['marketplace-connections', user?.id],
    queryFn: async (): Promise<MarketplaceConnection[]> => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(item => ({
        id: item.id,
        platform: item.platform,
        platform_name: item.platform_name,
        store_name: item.platform_name,
        connection_status: item.connection_status,
        is_active: item.is_active,
        last_sync_at: item.last_sync_at,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
    },
    enabled: !!user,
  });

  const { data: syncStats } = useQuery({
    queryKey: ['marketplace-sync-stats', user?.id],
    queryFn: async () => {
      return {
        totalConnections: connections.length,
        activeConnections: connections.filter(c => c.is_active).length,
        lastSync: connections[0]?.last_sync_at || null
      };
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const createConnectionMutation = useMutation({
    mutationFn: async ({
      platform,
      storeName,
      credentials,
    }: {
      platform: string;
      storeName: string;
      credentials: Record<string, any>;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('integrations')
        .insert([{
          user_id: user.id,
          platform: platform,
          platform_name: storeName,
          connection_status: 'connected',
          is_active: true
        } as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-connections'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-sync-stats'] });
      toast.success('Connexion marketplace créée avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la création: ${error.message}`);
    },
  });

  const updateConnectionMutation = useMutation({
    mutationFn: async ({
      connectionId,
      updates,
    }: {
      connectionId: string;
      updates: Partial<MarketplaceConnection>;
    }) => {
      const { data, error } = await supabase
        .from('integrations')
        .update(updates as any)
        .eq('id', connectionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-connections'] });
      toast.success('Connexion mise à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteConnectionMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-connections'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-sync-stats'] });
      toast.success('Connexion supprimée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const syncProductsMutation = useMutation({
    mutationFn: async ({
      connectionId,
      productIds,
    }: {
      connectionId: string;
      productIds: string[];
    }) => {
      // Simulate sync
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        status: 'completed',
        success_items: productIds.length,
        error_items: 0
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-sync-logs'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-sync-stats'] });
      queryClient.invalidateQueries({ queryKey: ['product-mappings'] });
      
      if (result.status === 'completed') {
        toast.success(`${result.success_items} produits synchronisés avec succès`);
      } else if (result.status === 'partial') {
        toast.warning(`${result.success_items} produits synchronisés, ${result.error_items} erreurs`);
      } else {
        toast.error('Échec de la synchronisation');
      }
    },
    onError: (error: Error) => {
      toast.error(`Erreur de synchronisation: ${error.message}`);
    },
  });

  const syncInventoryMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      // Simulate sync
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        status: 'completed',
        success_items: 10,
        error_items: 0
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-sync-logs'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-sync-stats'] });
      queryClient.invalidateQueries({ queryKey: ['product-mappings'] });
      
      if (result.status === 'completed') {
        toast.success(`Stock synchronisé: ${result.success_items} produits mis à jour`);
      } else {
        toast.error('Échec de la synchronisation du stock');
      }
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const getSyncLogs = (connectionId?: string) =>
    useQuery({
      queryKey: ['marketplace-sync-logs', user?.id, connectionId],
      queryFn: async (): Promise<SyncLog[]> => {
        return [];
      },
      enabled: !!user,
    });

  const getProductMappings = (connectionId: string) =>
    useQuery({
      queryKey: ['product-mappings', connectionId],
      queryFn: async () => {
        return [];
      },
      enabled: !!connectionId,
    });

  return {
    connections,
    isLoadingConnections,
    syncStats,
    createConnection: createConnectionMutation.mutate,
    isCreatingConnection: createConnectionMutation.isPending,
    updateConnection: updateConnectionMutation.mutate,
    deleteConnection: deleteConnectionMutation.mutate,
    syncProducts: syncProductsMutation.mutate,
    isSyncingProducts: syncProductsMutation.isPending,
    syncInventory: syncInventoryMutation.mutate,
    isSyncingInventory: syncInventoryMutation.isPending,
    getSyncLogs,
    getProductMappings,
  };
}
