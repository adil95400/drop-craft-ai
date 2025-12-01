import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Return {
  id: string;
  order_id: string;
  reason: string;
  items: any[];
  status: string;
  marketplace: string;
  created_at: string;
  orders?: {
    order_number: string;
    customer_name: string;
    total_amount: number;
  };
}

export interface Dispute {
  id: string;
  order_id: string;
  type: string;
  description: string;
  status: string;
  marketplace: string;
  created_at: string;
  orders?: {
    order_number: string;
    customer_name: string;
    total_amount: number;
  };
}

export function useReturnsDisputes() {
  const queryClient = useQueryClient();

  // Fetch returns
  const { data: returns = [], isLoading: returnsLoading } = useQuery({
    queryKey: ['returns'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('returns-disputes-manager', {
        body: { action: 'list_returns' }
      });
      if (error) throw error;
      return data.returns as Return[];
    }
  });

  // Fetch disputes
  const { data: disputes = [], isLoading: disputesLoading } = useQuery({
    queryKey: ['disputes'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('returns-disputes-manager', {
        body: { action: 'list_disputes' }
      });
      if (error) throw error;
      return data.disputes as Dispute[];
    }
  });

  // Create return
  const createReturn = useMutation({
    mutationFn: async (returnReq: {
      orderId: string;
      reason: string;
      items: any[];
      marketplace?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('returns-disputes-manager', {
        body: { action: 'create_return', ...returnReq }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Demande de retour créée avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  // Create dispute
  const createDispute = useMutation({
    mutationFn: async (disputeReq: {
      orderId: string;
      type: string;
      description: string;
      marketplace: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('returns-disputes-manager', {
        body: { action: 'create_dispute', ...disputeReq }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Litige créé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  // Update return status
  const updateReturnStatus = useMutation({
    mutationFn: async ({ returnId, status, notes }: {
      returnId: string;
      status: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('returns-disputes-manager', {
        body: { action: 'update_return_status', returnId, status, notes }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      toast.success('Statut du retour mis à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  return {
    returns,
    disputes,
    isLoading: returnsLoading || disputesLoading,
    createReturn: createReturn.mutate,
    createDispute: createDispute.mutate,
    updateReturnStatus: updateReturnStatus.mutate,
    isCreatingReturn: createReturn.isPending,
    isCreatingDispute: createDispute.isPending,
    isUpdatingReturn: updateReturnStatus.isPending,
  };
}
