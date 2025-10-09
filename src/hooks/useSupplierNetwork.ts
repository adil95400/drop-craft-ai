import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierNetworkService } from '@/services/SupplierNetworkService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useSupplierNetwork() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: networks, isLoading: networksLoading } = useQuery({
    queryKey: ['supplier-networks', user?.id],
    queryFn: () => supplierNetworkService.getSupplierNetworks(user!.id),
    enabled: !!user?.id
  });

  const { data: catalogProducts, isLoading: catalogLoading } = useQuery({
    queryKey: ['supplier-catalog'],
    queryFn: () => supplierNetworkService.getCatalogProducts({ limit: 100 }),
    staleTime: 1000 * 60 * 5
  });

  const { data: importHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['import-history', user?.id],
    queryFn: () => supplierNetworkService.getImportHistory(user!.id),
    enabled: !!user?.id
  });

  const connectNetworkMutation = useMutation({
    mutationFn: ({ networkId, networkName, credentials }: any) =>
      supplierNetworkService.connectNetwork(user!.id, networkId, networkName, credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-networks'] });
      toast.success('Network connected successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to connect network: ${error.message}`);
    }
  });

  const syncCatalogMutation = useMutation({
    mutationFn: (networkId: string) =>
      supplierNetworkService.syncCatalog(networkId, user!.id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-networks'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-catalog'] });
      toast.success(`Synced ${data.products_synced} products from ${data.network_name}`);
    },
    onError: (error: Error) => {
      toast.error(`Sync failed: ${error.message}`);
    }
  });

  const quickImportMutation = useMutation({
    mutationFn: ({ catalogProductId, customizations }: any) =>
      supplierNetworkService.quickImportProduct(user!.id, catalogProductId, customizations),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-history'] });
      queryClient.invalidateQueries({ queryKey: ['imported-products'] });
      toast.success('Product imported successfully');
    },
    onError: (error: Error) => {
      toast.error(`Import failed: ${error.message}`);
    }
  });

  return {
    networks,
    networksLoading,
    catalogProducts,
    catalogLoading,
    importHistory,
    historyLoading,
    connectNetwork: connectNetworkMutation.mutate,
    syncCatalog: syncCatalogMutation.mutate,
    quickImport: quickImportMutation.mutate,
    isConnecting: connectNetworkMutation.isPending,
    isSyncing: syncCatalogMutation.isPending,
    isImporting: quickImportMutation.isPending
  };
}
