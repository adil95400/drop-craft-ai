import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TrackingUpdate {
  id: string;
  order_id: string;
  tracking_number: string;
  carrier: string;
  status: string;
  created_at: string;
  order?: any;
}

export function useTrackingSync() {
  const queryClient = useQueryClient();

  // Use orders table for tracking data
  const { data: trackingData, isLoading } = useQuery({
    queryKey: ['tracking-auto-updates'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .not('tracking_number', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Transform to tracking updates format
      return (data || []).map((order: any): TrackingUpdate => ({
        id: order.id,
        order_id: order.id,
        tracking_number: order.tracking_number || '',
        carrier: order.carrier || '',
        status: order.fulfillment_status || 'pending',
        created_at: order.updated_at || order.created_at,
        order
      }));
    },
    refetchInterval: 30000
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
      toast.success(`${data?.synced || 0} numéros de tracking synchronisés`);
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
