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

  const publishMutation = useMutation({
    mutationFn: (productId: string) =>
      PublishProductsService.publishProduct(productId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['publish-stats'] });
      toast.success('Produit publié dans le catalogue');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors de la publication'
      );
    },
  });

  const bulkPublishMutation = useMutation({
    mutationFn: (productIds: string[]) =>
      PublishProductsService.bulkPublish(productIds, user!.id),
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['publish-stats'] });

      if (results.success.length > 0) {
        toast.success(`${results.success.length} produit(s) publié(s)`);
      }
      if (results.errors.length > 0) {
        toast.error(`${results.errors.length} erreur(s) lors de la publication`);
      }
    },
    onError: () => {
      toast.error('Erreur lors de la publication en masse');
    },
  });

  const syncStockMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      PublishProductsService.syncStock(productId, user!.id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Stock synchronisé');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erreur lors de la synchronisation'
      );
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: (productId: string) =>
      PublishProductsService.unpublishProduct(productId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['publish-stats'] });
      toast.success('Produit dépublié');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors de la dépublication'
      );
    },
  });

  return {
    stats,
    isLoadingStats,
    publishProduct: publishMutation.mutate,
    bulkPublish: bulkPublishMutation.mutate,
    syncStock: (productId: string, quantity: number) => 
      syncStockMutation.mutate({ productId, quantity }),
    unpublishProduct: unpublishMutation.mutate,
    isPublishing: publishMutation.isPending,
    isBulkPublishing: bulkPublishMutation.isPending,
    isSyncing: syncStockMutation.isPending,
    isUnpublishing: unpublishMutation.isPending,
  };
}
