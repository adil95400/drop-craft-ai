import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface FulfillmentCarrier {
  id: string;
  user_id: string;
  carrier_name: string;
  carrier_code: string;
  api_endpoint: string | null;
  api_key_encrypted: string | null;
  account_number: string | null;
  credentials: Record<string, any>;
  supported_countries: string[];
  default_for_country: string | null;
  pricing_rules: any[];
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface FulfillmentShipment {
  id: string;
  user_id: string;
  order_id: string | null;
  carrier_id: string | null;
  tracking_number: string | null;
  label_url: string | null;
  label_format: string;
  weight_kg: number | null;
  dimensions: Record<string, any> | null;
  shipping_address: Record<string, any>;
  return_address: Record<string, any> | null;
  status: string;
  tracking_events: any[];
  shipping_cost: number | null;
  insurance_cost: number | null;
  total_cost: number | null;
  estimated_delivery_date: string | null;
  actual_delivery_date: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  carrier?: FulfillmentCarrier;
}

export interface ReturnRMA {
  id: string;
  user_id: string;
  order_id: string | null;
  shipment_id: string | null;
  rma_number: string;
  status: string;
  reason: string;
  reason_category: string | null;
  customer_notes: string | null;
  internal_notes: string | null;
  items: any[];
  return_label_url: string | null;
  return_tracking_number: string | null;
  refund_amount: number | null;
  refund_method: string | null;
  refund_processed_at: string | null;
  requested_at: string;
  approved_at: string | null;
  received_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Carriers
export function useCarriers() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['fulfillment-carriers', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fulfillment_carriers')
        .select('*')
        .eq('user_id', user?.id)
        .order('carrier_name');
      
      if (error) throw error;
      return data as FulfillmentCarrier[];
    },
    enabled: !!user?.id
  });
}

export function useCreateCarrier() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (carrier: Partial<FulfillmentCarrier>) => {
      const { data, error } = await supabase
        .from('fulfillment_carriers')
        .insert({ ...carrier, user_id: user?.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-carriers'] });
      toast.success('Transporteur ajouté');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    }
  });
}

export function useUpdateCarrier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FulfillmentCarrier> & { id: string }) => {
      const { data, error } = await supabase
        .from('fulfillment_carriers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-carriers'] });
      toast.success('Transporteur mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    }
  });
}

export function useDeleteCarrier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fulfillment_carriers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-carriers'] });
      toast.success('Transporteur supprimé');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    }
  });
}

// Shipments
export function useShipments(status?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['fulfillment-shipments', user?.id, status],
    queryFn: async () => {
      let query = supabase
        .from('fulfillment_shipments')
        .select(`
          *,
          carrier:fulfillment_carriers(*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as FulfillmentShipment[];
    },
    enabled: !!user?.id
  });
}

export function useCreateShipment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (shipment: Partial<FulfillmentShipment>) => {
      const { data, error } = await supabase
        .from('fulfillment_shipments')
        .insert({ ...shipment, user_id: user?.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-shipments'] });
      toast.success('Expédition créée');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    }
  });
}

export function useUpdateShipment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FulfillmentShipment> & { id: string }) => {
      const { data, error } = await supabase
        .from('fulfillment_shipments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-shipments'] });
      toast.success('Expédition mise à jour');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    }
  });
}

// Returns/RMA
export function useReturns(status?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['returns-rma', user?.id, status],
    queryFn: async () => {
      let query = supabase
        .from('returns_rma')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ReturnRMA[];
    },
    enabled: !!user?.id
  });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (returnData: Partial<ReturnRMA>) => {
      const rmaNumber = `RMA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const { data, error } = await supabase
        .from('returns_rma')
        .insert({ 
          ...returnData, 
          user_id: user?.id,
          rma_number: rmaNumber
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns-rma'] });
      toast.success('Demande de retour créée');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    }
  });
}

export function useUpdateReturn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ReturnRMA> & { id: string }) => {
      const { data, error } = await supabase
        .from('returns_rma')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns-rma'] });
      toast.success('Retour mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    }
  });
}

// Fulfillment Stats
export function useFulfillmentStats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['fulfillment-stats', user?.id],
    queryFn: async () => {
      const [
        { count: totalShipments },
        { count: inTransit },
        { count: delivered },
        { count: pendingReturns },
        { data: shipments }
      ] = await Promise.all([
        supabase.from('fulfillment_shipments').select('*', { count: 'exact', head: true }).eq('user_id', user?.id),
        supabase.from('fulfillment_shipments').select('*', { count: 'exact', head: true }).eq('user_id', user?.id).eq('status', 'in_transit'),
        supabase.from('fulfillment_shipments').select('*', { count: 'exact', head: true }).eq('user_id', user?.id).eq('status', 'delivered'),
        supabase.from('returns_rma').select('*', { count: 'exact', head: true }).eq('user_id', user?.id).in('status', ['requested', 'approved', 'shipped_back']),
        supabase.from('fulfillment_shipments').select('total_cost, status').eq('user_id', user?.id)
      ]);
      
      const totalShippingCost = shipments?.reduce((sum, s) => sum + (s.total_cost || 0), 0) || 0;
      const deliveryRate = totalShipments ? ((delivered || 0) / totalShipments) * 100 : 0;
      
      return {
        total_shipments: totalShipments || 0,
        in_transit: inTransit || 0,
        delivered: delivered || 0,
        pending_returns: pendingReturns || 0,
        total_shipping_cost: totalShippingCost,
        delivery_rate: Math.round(deliveryRate * 100) / 100
      };
    },
    enabled: !!user?.id
  });
}
