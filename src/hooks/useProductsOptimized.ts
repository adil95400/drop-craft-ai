import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { ProductsService } from '@/services/products.service';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type ProductInsert = Database['public']['Tables']['imported_products']['Insert'];
type ProductUpdate = Database['public']['Tables']['imported_products']['Update'];

export function useProductsOptimized() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products', user?.id],
    queryFn: () => ProductsService.getProducts(user!.id),
    enabled: !!user,
    staleTime: 2 * 60 * 1000
  });

  const { data: stats } = useQuery({
    queryKey: ['product-stats', user?.id],
    queryFn: () => ProductsService.getProductStats(user!.id),
    enabled: !!user
  });

  const createMutation = useMutation({
    mutationFn: (product: ProductInsert) => ProductsService.createProduct(product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-stats'] });
      toast.success('Produit créé avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la création du produit');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: ProductUpdate }) =>
      ProductsService.updateProduct(id, user!.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produit mis à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ProductsService.deleteProduct(id, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-stats'] });
      toast.success('Produit supprimé');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    }
  });

  const optimizeMutation = useMutation({
    mutationFn: (id: string) => ProductsService.optimizeProduct(id, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produit optimisé par IA');
    },
    onError: () => {
      toast.error('Erreur lors de l\'optimisation');
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => ProductsService.bulkDelete(ids, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-stats'] });
      toast.success('Produits supprimés');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    }
  });

  const bulkUpdateStatusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: string }) =>
      ProductsService.bulkUpdateStatus(ids, user!.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Statuts mis à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    }
  });

  return {
    products,
    stats,
    isLoading,
    error,
    createProduct: createMutation.mutate,
    updateProduct: updateMutation.mutate,
    deleteProduct: deleteMutation.mutate,
    optimizeProduct: optimizeMutation.mutate,
    bulkDelete: bulkDeleteMutation.mutate,
    bulkUpdateStatus: bulkUpdateStatusMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}

export function useProductOptimized(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['product', id],
    queryFn: () => ProductsService.getProduct(id, user!.id),
    enabled: !!user && !!id
  });
}
