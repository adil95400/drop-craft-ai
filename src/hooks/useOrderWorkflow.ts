import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WorkflowStats {
  today_processed: number;
  total_processed: number;
  pending_orders: number;
  awaiting_tracking: number;
}

export const useOrderWorkflow = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const processNewOrder = useMutation({
    mutationFn: async (orderId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('order-workflow-processor', {
        body: { 
          action: 'process_new_order',
          orderId,
          userId: user.id
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-stats'] });
      toast({ title: 'Succès', description: 'Commande traitée automatiquement' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  const placeSupplierOrder = useMutation({
    mutationFn: async (orderId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('order-workflow-processor', {
        body: { 
          action: 'place_supplier_order',
          orderId,
          userId: user.id
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ 
        title: 'Commande fournisseur', 
        description: `ID: ${data.supplier_order_id}` 
      });
    }
  });

  const fetchTracking = useMutation({
    mutationFn: async (orderId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('order-workflow-processor', {
        body: { 
          action: 'fetch_tracking',
          orderId,
          userId: user.id
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      if (data.tracking_number) {
        toast({ 
          title: 'Tracking récupéré', 
          description: `${data.carrier}: ${data.tracking_number}` 
        });
      }
    }
  });

  const syncAllTracking = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('order-workflow-processor', {
        body: { 
          action: 'sync_tracking_batch',
          userId: user.id
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ 
        title: 'Synchronisation terminée', 
        description: `${data.synced} trackings mis à jour` 
      });
    }
  });

  const retryFailed = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('order-workflow-processor', {
        body: { 
          action: 'retry_failed',
          userId: user.id
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ 
        title: 'Réessais effectués', 
        description: `${data.retried} commandes retraitées` 
      });
    }
  });

  const useWorkflowStats = () => useQuery({
    queryKey: ['workflow-stats'],
    queryFn: async (): Promise<WorkflowStats> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('order-workflow-processor', {
        body: { 
          action: 'get_workflow_stats',
          userId: user.id
        }
      });
      if (error) throw error;
      return data.stats;
    },
    refetchInterval: 30000 // Refresh every 30s
  });

  return {
    processNewOrder,
    placeSupplierOrder,
    fetchTracking,
    syncAllTracking,
    retryFailed,
    useWorkflowStats,
    isLoading: processNewOrder.isPending || 
               placeSupplierOrder.isPending || 
               fetchTracking.isPending ||
               syncAllTracking.isPending
  };
};
