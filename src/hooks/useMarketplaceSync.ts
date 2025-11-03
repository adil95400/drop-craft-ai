import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { marketplaceSyncService, type MarketplaceConnection } from '@/services/marketplaceSync.service';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
    queryFn: () => marketplaceSyncService.getConnections(user!.id),
    enabled: !!user,
  });

  const { data: syncStats } = useQuery({
    queryKey: ['marketplace-sync-stats', user?.id],
    queryFn: () => marketplaceSyncService.getSyncStats(user!.id),
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const createConnectionMutation = useMutation({
    mutationFn: ({
      platform,
      storeName,
      credentials,
    }: {
      platform: MarketplaceConnection['platform'];
      storeName: string;
      credentials: Record<string, any>;
    }) => marketplaceSyncService.createConnection(user!.id, platform, storeName, credentials),
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
    mutationFn: ({
      connectionId,
      updates,
    }: {
      connectionId: string;
      updates: Partial<MarketplaceConnection>;
    }) => marketplaceSyncService.updateConnection(connectionId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-connections'] });
      toast.success('Connexion mise à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteConnectionMutation = useMutation({
    mutationFn: (connectionId: string) => marketplaceSyncService.deleteConnection(connectionId),
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
    mutationFn: ({
      connectionId,
      productIds,
    }: {
      connectionId: string;
      productIds: string[];
    }) => marketplaceSyncService.syncProductsToMarketplace(connectionId, productIds, user!.id),
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
    mutationFn: (connectionId: string) =>
      marketplaceSyncService.syncInventoryToMarketplace(connectionId, user!.id),
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
      queryFn: () => marketplaceSyncService.getSyncLogs(user!.id, connectionId),
      enabled: !!user,
    });

  const getProductMappings = (connectionId: string) =>
    useQuery({
      queryKey: ['product-mappings', connectionId],
      queryFn: () => marketplaceSyncService.getProductMappings(connectionId),
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
