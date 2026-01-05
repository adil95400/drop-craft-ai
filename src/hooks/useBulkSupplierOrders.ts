/**
 * Bulk Supplier Orders Hooks
 * React Query hooks pour les commandes groupées multi-fournisseurs
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  BulkOrdersService, 
  CreateBulkOrderInput, 
  AddItemInput,
  BulkOrder,
  BulkOrderItem
} from '@/services/BulkOrdersService';

// ========== ORDERS ==========

export function useBulkSupplierOrders(status?: string) {
  return useQuery({
    queryKey: ['bulk-supplier-orders', status],
    queryFn: () => BulkOrdersService.getOrders(status),
    staleTime: 30 * 1000,
  });
}

export function useBulkSupplierOrder(orderId: string) {
  return useQuery({
    queryKey: ['bulk-supplier-order', orderId],
    queryFn: () => BulkOrdersService.getOrder(orderId),
    enabled: !!orderId,
    staleTime: 30 * 1000,
  });
}

export function useCreateBulkSupplierOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBulkOrderInput) => 
      BulkOrdersService.createOrder(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulk-supplier-orders'] });
      queryClient.invalidateQueries({ queryKey: ['bulk-supplier-orders-stats'] });
      toast.success('Commande groupée créée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdateBulkSupplierOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, updates }: { orderId: string; updates: Partial<CreateBulkOrderInput & { status: string }> }) => 
      BulkOrdersService.updateOrder(orderId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bulk-supplier-orders'] });
      queryClient.invalidateQueries({ queryKey: ['bulk-supplier-order', data.id] });
      toast.success('Commande mise à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDeleteBulkSupplierOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => BulkOrdersService.deleteOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulk-supplier-orders'] });
      queryClient.invalidateQueries({ queryKey: ['bulk-supplier-orders-stats'] });
      toast.success('Commande supprimée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useSubmitBulkSupplierOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => BulkOrdersService.submitOrder(orderId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bulk-supplier-orders'] });
      queryClient.invalidateQueries({ queryKey: ['bulk-supplier-order', data.id] });
      queryClient.invalidateQueries({ queryKey: ['bulk-supplier-orders-stats'] });
      toast.success('Commande soumise avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// ========== ITEMS ==========

export function useAddBulkSupplierOrderItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddItemInput) => BulkOrdersService.addItem(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bulk-supplier-order', data.bulk_order_id] });
      queryClient.invalidateQueries({ queryKey: ['bulk-supplier-orders'] });
      toast.success('Produit ajouté');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useAddBulkSupplierOrderItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: AddItemInput[]) => BulkOrdersService.addBulkItems(items),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bulk-supplier-orders'] });
      data.forEach(item => {
        queryClient.invalidateQueries({ queryKey: ['bulk-supplier-order', item.bulk_order_id] });
      });
      toast.success(`${data.length} produits ajoutés`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdateBulkSupplierOrderItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, updates }: { itemId: string; updates: Partial<AddItemInput> }) => 
      BulkOrdersService.updateItem(itemId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bulk-supplier-order', data.bulk_order_id] });
      queryClient.invalidateQueries({ queryKey: ['bulk-supplier-orders'] });
      toast.success('Produit mis à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useRemoveBulkSupplierOrderItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => BulkOrdersService.removeItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulk-supplier-orders'] });
      toast.success('Produit retiré');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useRemoveBulkSupplierOrderItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemIds: string[]) => BulkOrdersService.removeItems(itemIds),
    onSuccess: (_, itemIds) => {
      queryClient.invalidateQueries({ queryKey: ['bulk-supplier-orders'] });
      toast.success(`${itemIds.length} produits retirés`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// ========== STATS ==========

export function useBulkSupplierOrdersStats() {
  return useQuery({
    queryKey: ['bulk-supplier-orders-stats'],
    queryFn: () => BulkOrdersService.getStats(),
    staleTime: 60 * 1000,
  });
}
