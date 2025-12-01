import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface FulfillmentShipment {
  id: string;
  user_id: string;
  order_id: string;
  carrier_id: string;
  tracking_number: string;
  status: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export function useFulfillmentShipments(filters?: {
  status?: string;
  orderId?: string;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: shipments, isLoading, refetch } = useQuery({
    queryKey: ['fulfillment-shipments', user?.id, filters],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('fulfillment_shipments')
        .select('*, carrier:fulfillment_carriers(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.orderId) {
        query = query.eq('order_id', filters.orderId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as (FulfillmentShipment & { carrier: any })[];
    },
    enabled: !!user,
  });

  const createShipmentMutation = useMutation({
    mutationFn: async (params: {
      orderId: string;
      carrierId: string;
      shippingAddress: any;
      weight: number;
      dimensions?: any;
      autoGenerateLabel?: boolean;
    }) => {
      const { data, error } = await supabase.functions.invoke('shipment-create', {
        body: params
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-shipments'] });
      toast({
        title: '✅ Expédition créée',
        description: 'L\'expédition a été créée avec succès',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer l\'expédition',
        variant: 'destructive',
      });
    },
  });

  const syncTrackingMutation = useMutation({
    mutationFn: async (shipmentId: string) => {
      const { data, error } = await supabase.functions.invoke('carrier-tracking-fetch', {
        body: { shipment_id: shipmentId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-shipments'] });
      toast({
        title: '✅ Tracking mis à jour',
        description: 'Les informations de suivi ont été synchronisées',
      });
    },
  });

  const generateLabelsMutation = useMutation({
    mutationFn: async (shipmentIds: string[]) => {
      const { data, error } = await supabase.functions.invoke('label-generate-real', {
        body: { shipment_ids: shipmentIds, format: 'pdf' }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-shipments'] });
      toast({
        title: '✅ Étiquettes générées',
        description: `${data.count} étiquette(s) ont été générées`,
      });
    },
  });

  const selectCarrierAutoMutation = useMutation({
    mutationFn: async (params: {
      destinationCountry: string;
      weight: number;
      dimensions?: any;
      criteria?: 'cheapest' | 'fastest' | 'preferred';
    }) => {
      const { data, error } = await supabase.functions.invoke('carrier-select-auto', {
        body: params
      });

      if (error) throw error;
      return data;
    },
  });

  return {
    shipments: shipments || [],
    isLoading,
    refetch,
    createShipment: createShipmentMutation.mutate,
    isCreating: createShipmentMutation.isPending,
    syncTracking: syncTrackingMutation.mutate,
    isSyncing: syncTrackingMutation.isPending,
    generateLabels: generateLabelsMutation.mutate,
    isGenerating: generateLabelsMutation.isPending,
    selectCarrierAuto: selectCarrierAutoMutation.mutate,
    isSelecting: selectCarrierAutoMutation.isPending,
  };
}