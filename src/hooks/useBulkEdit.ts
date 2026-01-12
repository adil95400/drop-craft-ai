import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BulkEditService, BulkEditItemType, BulkEditResult } from '@/services/bulk-edit.service';
import { toast } from 'sonner';

export function useBulkEdit(itemType: BulkEditItemType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, changes }: { ids: string[]; changes: Record<string, any> }) =>
      BulkEditService.bulkUpdate(itemType, ids, changes),
    onSuccess: (result: BulkEditResult) => {
      // Invalidate relevant queries based on item type
      const queryKeyMap: Record<BulkEditItemType, string[]> = {
        products: ['products', 'products-unified'],
        orders: ['orders', 'orders-unified'],
        customers: ['customers', 'customers-unified'],
        campaigns: ['ad-campaigns', 'campaigns']
      };
      
      queryKeyMap[itemType].forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });

      if (result.success > 0) {
        toast.success(`${result.success} élément(s) modifié(s) avec succès`);
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} élément(s) n'ont pas pu être modifiés`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la modification: ${error.message}`);
    }
  });
}
