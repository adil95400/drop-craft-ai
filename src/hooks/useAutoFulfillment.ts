import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useAutoFulfillment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['auto-fulfillment', 'stats'],
    queryFn: async () => {
      const result: any = await supabase
        .from('auto_fulfillment_orders' as any)
        .select('*')
        .order('created_at', { ascending: false });

      const orders = result.data;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayOrders = orders?.filter((o: any) => new Date(o.created_at) >= today).length || 0;
      const confirmed = orders?.filter((o: any) => o.status === 'confirmed').length || 0;
      const shipped = orders?.filter((o: any) => o.status === 'shipped').length || 0;
      const processing = orders?.filter((o: any) => o.status === 'processing').length || 0;
      const failed = orders?.filter((o: any) => o.status === 'failed').length || 0;
      const pending = orders?.filter((o: any) => o.status === 'pending').length || 0;

      const total = orders?.length || 1;
      const successRate = ((confirmed + shipped) / total) * 100;

      return {
        todayOrders,
        todayGrowth: 12,
        successRate: Number(successRate.toFixed(1)),
        avgProcessingTime: 2.3,
        pendingOrders: pending,
        confirmed,
        shipped,
        processing,
        failed,
        topSuppliers: []
      };
    },
    staleTime: 30 * 1000,
  });

  // Fetch supplier connections
  const { data: connections, isLoading: isLoadingConnections } = useQuery({
    queryKey: ['supplier-connections'],
    queryFn: async () => {
      const result: any = await supabase
        .from('supplier_connections' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (result.error) throw result.error;
      return result.data;
    },
  });

  // Fetch fulfillment orders
  const { data: orders, isLoading: isLoadingOrders, refetch: refetchOrders } = useQuery({
    queryKey: ['auto-fulfillment-orders'],
    queryFn: async () => {
      const result: any = await supabase
        .from('auto_fulfillment_orders' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (result.error) throw result.error;
      return result.data;
    },
  });

  // Create supplier connection
  const createConnectionMutation = useMutation({
    mutationFn: async (connectionData: any) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('Non authentifié');

      const result: any = await supabase
        .from('supplier_connections' as any)
        .insert({
          user_id: session.session.user.id,
          ...connectionData
        })
        .select()
        .single();

      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-connections'] });
      toast({
        title: "✅ Fournisseur connecté",
        description: "La connexion au fournisseur a été créée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la connexion",
        variant: "destructive",
      });
    },
  });

  // Toggle auto-order
  const toggleAutoOrderMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const result: any = await supabase
        .from('supplier_connections' as any)
        .update({ auto_order_enabled: enabled })
        .eq('id', id);

      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-connections'] });
      toast({
        title: "✅ Configuration mise à jour",
        description: "L'auto-commande a été modifiée",
      });
    },
  });

  return {
    stats,
    isLoadingStats,
    connections,
    isLoadingConnections,
    orders,
    isLoadingOrders,
    refetchOrders,
    createConnection: createConnectionMutation.mutate,
    isCreatingConnection: createConnectionMutation.isPending,
    toggleAutoOrder: (id: string, enabled: boolean) => 
      toggleAutoOrderMutation.mutate({ id, enabled }),
  };
}
