import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { PublishProductsService } from '@/services/publishProducts.service';
import { toast } from 'sonner';

export function usePublishProducts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['publish-stats', user?.id],
    queryFn: () => PublishProductsService.getPublishStats(user!.id),
    enabled: !!user,
  });

  const { data: stores = [], isLoading: isLoadingStores } = useQuery({
    queryKey: ['user-stores', user?.id],
    queryFn: () => PublishProductsService.getUserStores(user!.id),
    enabled: !!user,
  });

  const { data: publicationLogs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: ['publication-logs', user?.id],
    queryFn: () => PublishProductsService.getPublicationLogs(user!.id),
    enabled: !!user,
  });

  const { data: scheduledPublications = [], isLoading: isLoadingScheduled } = useQuery({
    queryKey: ['scheduled-publications', user?.id],
    queryFn: () => PublishProductsService.getScheduledPublications(user!.id),
    enabled: !!user,
  });

  const { data: publicationStats } = useQuery({
    queryKey: ['publication-stats', user?.id],
    queryFn: () => PublishProductsService.getPublicationStats(user!.id),
    enabled: !!user,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['publish-stats'] });
    queryClient.invalidateQueries({ queryKey: ['products-unified'] });
    queryClient.invalidateQueries({ queryKey: ['product-store-links'] });
    queryClient.invalidateQueries({ queryKey: ['publication-logs'] });
    queryClient.invalidateQueries({ queryKey: ['scheduled-publications'] });
    queryClient.invalidateQueries({ queryKey: ['publication-stats'] });
  };

  const publishToStoresMutation = useMutation({
    mutationFn: ({ productId, storeIds }: { productId: string; storeIds: string[] }) =>
      PublishProductsService.publishToStores(productId, storeIds),
    onSuccess: (result) => {
      invalidateAll();
      if (result.successCount > 0) toast.success(`Publié sur ${result.successCount} boutique(s)`);
      if (result.failCount > 0) toast.error(`${result.failCount} erreur(s)`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erreur de publication');
    },
  });

  const publishToSocialMutation = useMutation({
    mutationFn: ({ productId, channels, customMessage, scheduleAt }: { 
      productId: string; channels: string[]; customMessage?: string; scheduleAt?: string 
    }) => PublishProductsService.publishToSocial(productId, channels, customMessage, scheduleAt),
    onSuccess: (result) => {
      invalidateAll();
      if (result.scheduled) {
        toast.success(`Publication planifiée sur ${result.count} canal/canaux`);
      } else {
        if (result.successCount > 0) toast.success(`Publié sur ${result.successCount} réseau(x) social/sociaux`);
        if (result.failCount > 0) toast.error(`${result.failCount} erreur(s) de publication sociale`);
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erreur de publication sociale');
    },
  });

  const publishMutation = useMutation({
    mutationFn: (productId: string) =>
      PublishProductsService.publishProduct(productId, user!.id),
    onSuccess: () => {
      invalidateAll();
      toast.success('Produit publié');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la publication');
    },
  });

  const bulkPublishMutation = useMutation({
    mutationFn: (productIds: string[]) =>
      PublishProductsService.bulkPublish(productIds, user!.id),
    onSuccess: (results) => {
      invalidateAll();
      if (results.success.length > 0) toast.success(`${results.success.length} produit(s) publié(s)`);
      if (results.errors.length > 0) toast.error(`${results.errors.length} erreur(s)`);
    },
    onError: () => {
      toast.error('Erreur lors de la publication en masse');
    },
  });

  const syncStockMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      PublishProductsService.syncStock(productId, user!.id, quantity),
    onSuccess: () => {
      invalidateAll();
      toast.success('Stock synchronisé');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erreur de synchronisation');
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: (productId: string) =>
      PublishProductsService.unpublishProduct(productId, user!.id),
    onSuccess: () => {
      invalidateAll();
      toast.success('Produit dépublié');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erreur de dépublication');
    },
  });

  const cancelScheduledMutation = useMutation({
    mutationFn: (publicationId: string) =>
      PublishProductsService.cancelScheduledPublication(publicationId),
    onSuccess: () => {
      invalidateAll();
      toast.success('Publication annulée');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erreur d\'annulation');
    },
  });

  return {
    stats,
    stores,
    publicationLogs,
    scheduledPublications,
    publicationStats,
    isLoadingStats,
    isLoadingStores,
    isLoadingLogs,
    isLoadingScheduled,
    publishProduct: publishMutation.mutate,
    publishToStores: (productId: string, storeIds: string[]) =>
      publishToStoresMutation.mutate({ productId, storeIds }),
    publishToSocial: (productId: string, channels: string[], customMessage?: string, scheduleAt?: string) =>
      publishToSocialMutation.mutate({ productId, channels, customMessage, scheduleAt }),
    bulkPublish: bulkPublishMutation.mutate,
    syncStock: (productId: string, quantity: number) =>
      syncStockMutation.mutate({ productId, quantity }),
    unpublishProduct: unpublishMutation.mutate,
    cancelScheduled: cancelScheduledMutation.mutate,
    isPublishing: publishMutation.isPending || publishToStoresMutation.isPending,
    isPublishingSocial: publishToSocialMutation.isPending,
    isBulkPublishing: bulkPublishMutation.isPending,
    isSyncing: syncStockMutation.isPending,
    isUnpublishing: unpublishMutation.isPending,
  };
}
