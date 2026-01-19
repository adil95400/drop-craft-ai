import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TrackingEvent {
  timestamp: string;
  location: string;
  status: string;
  description: string;
}

export interface TrackingInfo {
  id: string;
  orderId: string;
  orderNumber: string;
  trackingNumber: string;
  carrier: string;
  carrierCode: string;
  status: 'pending' | 'info_received' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'expired';
  statusDescription: string;
  events: TrackingEvent[];
  estimatedDelivery: string | null;
  customerName: string;
  customerEmail: string;
  lastUpdate: string;
  createdAt: string;
}

export interface TrackingStats {
  total: number;
  pending: number;
  inTransit: number;
  outForDelivery: number;
  delivered: number;
  exception: number;
  deliveryRate: number;
  avgDeliveryDays: number;
}

export function useRealtimeTracking() {
  const queryClient = useQueryClient();

  // Fetch all tracking data from orders
  const { data: trackingData, isLoading, error } = useQuery({
    queryKey: ['realtime-tracking'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          tracking_number,
          carrier,
          delivery_status,
          fulfillment_status,
          tracking_events,
          estimated_delivery_date,
          customer_name,
          customer_email,
          last_tracking_update,
          created_at,
          delivered_at
        `)
        .eq('user_id', user.id)
        .not('tracking_number', 'is', null)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      return (data || []).map((order: any): TrackingInfo => ({
        id: order.id,
        orderId: order.id,
        orderNumber: order.order_number || order.id.slice(0, 8).toUpperCase(),
        trackingNumber: order.tracking_number || '',
        carrier: order.carrier || 'Unknown',
        carrierCode: '',
        status: mapDeliveryStatus(order.delivery_status),
        statusDescription: getStatusDescription(order.delivery_status),
        events: order.tracking_events || [],
        estimatedDelivery: order.estimated_delivery_date,
        customerName: order.customer_name || 'N/A',
        customerEmail: order.customer_email || '',
        lastUpdate: order.last_tracking_update || order.created_at,
        createdAt: order.created_at
      }));
    },
    refetchInterval: 60000 // Refetch every minute
  });

  // Calculate stats
  const stats: TrackingStats = {
    total: trackingData?.length || 0,
    pending: trackingData?.filter(t => t.status === 'pending' || t.status === 'info_received').length || 0,
    inTransit: trackingData?.filter(t => t.status === 'in_transit').length || 0,
    outForDelivery: trackingData?.filter(t => t.status === 'out_for_delivery').length || 0,
    delivered: trackingData?.filter(t => t.status === 'delivered').length || 0,
    exception: trackingData?.filter(t => t.status === 'exception' || t.status === 'expired').length || 0,
    deliveryRate: trackingData?.length 
      ? Math.round((trackingData.filter(t => t.status === 'delivered').length / trackingData.length) * 100) 
      : 0,
    avgDeliveryDays: 0 // Would need delivered_at to calculate
  };

  // Sync single tracking
  const syncSingle = useMutation({
    mutationFn: async (trackingNumber: string) => {
      const { data, error } = await supabase.functions.invoke('carrier-tracking-realtime', {
        body: { 
          action: 'track_single',
          trackingNumbers: [trackingNumber]
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['realtime-tracking'] });
      if (data.success) {
        toast.success(`Tracking ${data.tracking?.trackingNumber} mis à jour`);
      } else {
        toast.error(data.error || 'Erreur de tracking');
      }
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  // Sync all tracking
  const syncAll = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase.functions.invoke('carrier-tracking-realtime', {
        body: { 
          action: 'sync_all',
          userId: user.id
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['realtime-tracking'] });
      toast.success(`${data.synced || 0} tracking(s) synchronisé(s)`);
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  // Detect carrier
  const detectCarrier = useMutation({
    mutationFn: async (trackingNumber: string) => {
      const { data, error } = await supabase.functions.invoke('carrier-tracking-realtime', {
        body: { 
          action: 'get_carrier',
          trackingNumbers: [trackingNumber]
        }
      });

      if (error) throw error;
      return data;
    }
  });

  // Register for webhooks
  const registerWebhook = useMutation({
    mutationFn: async (trackingNumbers: string[]) => {
      const { data, error } = await supabase.functions.invoke('carrier-tracking-realtime', {
        body: { 
          action: 'register_webhook',
          trackingNumbers
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data.registered || 0} tracking(s) enregistré(s) pour les notifications`);
    }
  });

  return {
    trackingData: trackingData || [],
    stats,
    isLoading,
    error,
    syncSingle: syncSingle.mutate,
    syncAll: syncAll.mutate,
    detectCarrier: detectCarrier.mutateAsync,
    registerWebhook: registerWebhook.mutate,
    isSyncing: syncAll.isPending,
    isSyncingSingle: syncSingle.isPending
  };
}

function mapDeliveryStatus(status: string): TrackingInfo['status'] {
  const statusMap: Record<string, TrackingInfo['status']> = {
    'pending': 'pending',
    'info_received': 'info_received',
    'in_transit': 'in_transit',
    'out_for_delivery': 'out_for_delivery',
    'delivered': 'delivered',
    'failed': 'exception',
    'exception': 'exception',
    'expired': 'expired'
  };
  return statusMap[status] || 'pending';
}

function getStatusDescription(status: string): string {
  const descriptions: Record<string, string> = {
    'pending': 'En attente de prise en charge',
    'info_received': 'Information reçue',
    'in_transit': 'En transit',
    'out_for_delivery': 'En cours de livraison',
    'delivered': 'Livré',
    'failed': 'Échec de livraison',
    'exception': 'Problème signalé',
    'expired': 'Tracking expiré'
  };
  return descriptions[status] || 'Statut inconnu';
}
