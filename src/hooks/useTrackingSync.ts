import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useTrackingSync() {
  const queryClient = useQueryClient();

  const { data: trackingData, isLoading } = useQuery({
    queryKey: ['tracking-auto-updates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracking_auto_updates')
        .select('*, order:orders(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000 // Auto-refresh every 30s
  });

  const syncAll = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('tracking-auto-sync', {
        body: { action: 'sync_all' }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tracking-auto-updates'] });
      toast.success(`${data.synced} numéros de tracking synchronisés`);
    }
  });

  const enableAutoTracking = useMutation({
    mutationFn: async ({ orderId, trackingNumber, carrier }: any) => {
      const { data, error } = await supabase.functions.invoke('tracking-auto-sync', {
        body: { 
          action: 'enable_auto_tracking', 
          order_id: orderId,
          tracking_number: trackingNumber,
          carrier
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-auto-updates'] });
      toast.success('Tracking automatique activé');
    }
  });

  return {
    trackingData,
    isLoading,
    syncAll: syncAll.mutate,
    enableAutoTracking: enableAutoTracking.mutate,
    isSyncing: syncAll.isPending
  };
}
