import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { importExportService } from '@/services/importExportService';
import { toast } from 'sonner';

export function useBulkActions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const bulkDeleteMutation = useMutation({
    mutationFn: (productIds: string[]) => importExportService.bulkDelete(productIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produits supprimés avec succès');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    },
  });

  const bulkUpdateCategoryMutation = useMutation({
    mutationFn: ({ productIds, category }: { productIds: string[]; category: string }) =>
      importExportService.bulkUpdateCategory(productIds, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Catégorie mise à jour avec succès');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    },
  });

  const bulkUpdateStatusMutation = useMutation({
    mutationFn: ({ productIds, status }: { productIds: string[]; status: 'active' | 'inactive' | 'draft' }) =>
      importExportService.bulkUpdateStatus(productIds, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Statut mis à jour avec succès');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    },
  });

  const bulkUpdatePricesMutation = useMutation({
    mutationFn: ({ productIds, multiplier }: { productIds: string[]; multiplier: number }) =>
      importExportService.bulkUpdatePrices(productIds, multiplier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Prix mis à jour avec succès');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour des prix');
    },
  });

  const bulkDuplicateMutation = useMutation({
    mutationFn: (productIds: string[]) => importExportService.bulkDuplicate(productIds, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produits dupliqués avec succès');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la duplication');
    },
  });

  return {
    bulkDelete: bulkDeleteMutation.mutate,
    bulkUpdateCategory: bulkUpdateCategoryMutation.mutate,
    bulkUpdateStatus: bulkUpdateStatusMutation.mutate,
    bulkUpdatePrices: bulkUpdatePricesMutation.mutate,
    bulkDuplicate: bulkDuplicateMutation.mutate,
    isDeleting: bulkDeleteMutation.isPending,
    isUpdatingCategory: bulkUpdateCategoryMutation.isPending,
    isUpdatingStatus: bulkUpdateStatusMutation.isPending,
    isUpdatingPrices: bulkUpdatePricesMutation.isPending,
    isDuplicating: bulkDuplicateMutation.isPending,
  };
}
