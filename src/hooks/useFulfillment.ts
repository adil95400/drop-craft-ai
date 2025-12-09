import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Helper to get current user
async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Carriers
export function useCarriers() {
  return useQuery({
    queryKey: ['fulfillment-carriers'],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('fulfillment_carriers')
        .select('*')
        .eq('user_id', user.id)
        .order('carrier_code');
      
      if (error) throw error;
      return data || [];
    }
  });
}

export function useCreateCarrier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (carrier: any) => {
      const user = await getCurrentUser();
      if (!user) throw new Error('Non authentifié');
      
      const { data, error } = await supabase
        .from('fulfillment_carriers')
        .insert([{ 
          carrier_code: carrier.carrier_code || 'other',
          name: carrier.name || carrier.carrier_name || 'Transporteur',
          is_active: carrier.is_active ?? true,
          user_id: user.id 
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-carriers'] });
      toast.success('Transporteur ajouté');
    },
    onError: (error: any) => {
      toast.error('Erreur: ' + error.message);
    }
  });
}

// Shipments
export function useShipments(status?: string) {
  return useQuery({
    queryKey: ['fulfillment-shipments', status],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) return [];
      
      let query = supabase
        .from('fulfillment_shipments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });
}

export function useCreateShipment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (shipment: any) => {
      const user = await getCurrentUser();
      if (!user) throw new Error('Non authentifié');
      
      const { data, error } = await supabase
        .from('fulfillment_shipments')
        .insert({ 
          ...shipment, 
          user_id: user.id,
          carrier_name: shipment.carrier_name || 'Unknown'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-shipments'] });
      toast.success('Expédition créée');
    },
    onError: (error: any) => {
      toast.error('Erreur: ' + error.message);
    }
  });
}

// Returns/RMA - using mock data since returns_rma table doesn't exist in types yet
export function useReturns(status?: string) {
  return useQuery({
    queryKey: ['returns-rma', status],
    queryFn: async () => {
      // Return empty array since table doesn't exist in Supabase types
      return [] as any[];
    }
  });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (returnData: any) => {
      // Mock implementation until table is added to types
      toast.info('Fonctionnalité RMA en cours de développement');
      return { id: crypto.randomUUID(), ...returnData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns-rma'] });
      toast.success('Demande de retour créée');
    },
    onError: (error: any) => {
      toast.error('Erreur: ' + error.message);
    }
  });
}

export function useUpdateReturn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updateData: { id: string; [key: string]: any }) => {
      // Mock implementation until table is added to types
      toast.info('Mise à jour RMA en cours de développement');
      return updateData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns-rma'] });
      toast.success('Retour mis à jour');
    },
    onError: (error: any) => {
      toast.error('Erreur: ' + error.message);
    }
  });
}

// Fulfillment Stats
export function useFulfillmentStats() {
  return useQuery({
    queryKey: ['fulfillment-stats'],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) return {
        total_shipments: 0,
        in_transit: 0,
        delivered: 0,
        pending_returns: 0,
        total_shipping_cost: 0,
        delivery_rate: 0
      };
      
      const [
        { count: totalShipments },
        { count: inTransit },
        { count: delivered },
        { data: shipments }
      ] = await Promise.all([
        supabase.from('fulfillment_shipments').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('fulfillment_shipments').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'in_transit'),
        supabase.from('fulfillment_shipments').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'delivered'),
        supabase.from('fulfillment_shipments').select('shipping_cost').eq('user_id', user.id)
      ]);
      
      const totalShippingCost = shipments?.reduce((sum, s) => sum + ((s as any).shipping_cost || 0), 0) || 0;
      const deliveryRate = totalShipments ? ((delivered || 0) / totalShipments) * 100 : 0;
      
      return {
        total_shipments: totalShipments || 0,
        in_transit: inTransit || 0,
        delivered: delivered || 0,
        pending_returns: 0,
        total_shipping_cost: totalShippingCost,
        delivery_rate: Math.round(deliveryRate * 100) / 100
      };
    }
  });
}
