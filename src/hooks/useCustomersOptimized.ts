import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { CustomersService } from '@/services/customers.service';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type CustomerUpdate = Database['public']['Tables']['customers']['Update'];

export function useCustomersOptimized(searchTerm?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', user?.id, searchTerm],
    queryFn: () => 
      searchTerm 
        ? CustomersService.searchCustomers(user!.id, searchTerm)
        : CustomersService.getCustomers(user!.id),
    enabled: !!user,
    staleTime: 2 * 60 * 1000
  });

  const { data: stats } = useQuery({
    queryKey: ['customer-stats', user?.id],
    queryFn: () => CustomersService.getCustomerStats(user!.id),
    enabled: !!user
  });

  const createMutation = useMutation({
    mutationFn: (customer: CustomerInsert) => CustomersService.createCustomer(customer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer-stats'] });
      toast.success('Client créé avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la création du client');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: CustomerUpdate }) =>
      CustomersService.updateCustomer(id, user!.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Client mis à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => CustomersService.deleteCustomer(id, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer-stats'] });
      toast.success('Client supprimé');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    }
  });

  return {
    customers,
    stats,
    isLoading,
    createCustomer: createMutation.mutate,
    updateCustomer: updateMutation.mutate,
    deleteCustomer: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending
  };
}

export function useCustomer(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => CustomersService.getCustomer(id, user!.id),
    enabled: !!user && !!id
  });
}
