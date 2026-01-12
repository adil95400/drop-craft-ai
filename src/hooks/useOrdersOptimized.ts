import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { OrdersService } from '@/services/orders.service';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type OrderInsert = Database['public']['Tables']['orders']['Insert'];
type OrderUpdate = Database['public']['Tables']['orders']['Update'];

export function useOrdersOptimized() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: () => OrdersService.getOrders(user!.id),
    enabled: !!user,
    staleTime: 1 * 60 * 1000
  });

  const { data: stats } = useQuery({
    queryKey: ['order-stats', user?.id],
    queryFn: () => OrdersService.getOrderStats(user!.id),
    enabled: !!user
  });

  const createMutation = useMutation({
    mutationFn: ({ order, items }: { order: OrderInsert; items?: any[] }) =>
      OrdersService.createOrder(order.user_id, order, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-stats'] });
      toast.success('Commande créée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la création de la commande');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: OrderUpdate }) =>
      OrdersService.updateOrder(id, user!.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Commande mise à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      OrdersService.updateOrderStatus(id, user!.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-stats'] });
      toast.success('Statut mis à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => OrdersService.deleteOrder(id, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-stats'] });
      toast.success('Commande supprimée');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    }
  });

  return {
    orders,
    stats,
    isLoading,
    createOrder: createMutation.mutate,
    updateOrder: updateMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    deleteOrder: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending
  };
}

export function useOrder(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['order', id],
    queryFn: () => OrdersService.getOrder(id, user!.id),
    enabled: !!user && !!id
  });
}
