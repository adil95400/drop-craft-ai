import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Helper to get current user
async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Types
export interface ReturnRMA {
  id: string;
  user_id: string;
  order_id?: string;
  shipment_id?: string;
  rma_number: string;
  status: string;
  reason_category: string;
  reason?: string;
  customer_notes?: string;
  internal_notes?: string;
  refund_amount?: number;
  refund_method?: string;
  refund_status?: string;
  return_label_url?: string;
  return_tracking_number?: string;
  return_carrier?: string;
  received_at?: string;
  inspected_at?: string;
  refunded_at?: string;
  requested_at: string;
  resolved_at?: string;
  resolved_by?: string;
  product_id?: string;
  product_name?: string;
  product_sku?: string;
  quantity: number;
  images?: string[];
  metadata?: any;
  created_at: string;
  updated_at: string;
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

// Returns/RMA - using real returns_rma table
export function useReturns(status?: string) {
  return useQuery({
    queryKey: ['returns-rma', status],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) return [] as ReturnRMA[];
      
      // Use raw query to access new table before types regenerate
      let query = supabase
        .from('returns_rma' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('requested_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      if (error) {
        console.warn('Returns RMA table error:', error);
        return [] as ReturnRMA[];
      }
      return (data as unknown as ReturnRMA[]) || [];
    }
  });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (returnData: Partial<ReturnRMA>) => {
      const user = await getCurrentUser();
      if (!user) throw new Error('Non authentifié');
      
      const { data, error } = await supabase
        .from('returns_rma' as any)
        .insert({
          user_id: user.id,
          rma_number: '', // Will be auto-generated by database trigger
          status: 'pending',
          reason_category: returnData.reason_category || 'other',
          reason: returnData.reason,
          customer_notes: returnData.customer_notes,
          order_id: returnData.order_id,
          product_id: returnData.product_id,
          product_name: returnData.product_name,
          product_sku: returnData.product_sku,
          quantity: returnData.quantity || 1,
          refund_amount: returnData.refund_amount || 0,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as ReturnRMA;
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
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<ReturnRMA>) => {
      const user = await getCurrentUser();
      if (!user) throw new Error('Non authentifié');
      
      const { data, error } = await supabase
        .from('returns_rma' as any)
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as ReturnRMA;
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
        { count: pendingReturns },
        { data: shipments }
      ] = await Promise.all([
        supabase.from('fulfillment_shipments').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('fulfillment_shipments').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'in_transit'),
        supabase.from('fulfillment_shipments').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'delivered'),
        supabase.from('returns_rma' as any).select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'pending'),
        supabase.from('fulfillment_shipments').select('shipping_cost').eq('user_id', user.id)
      ]);
      
      const totalShippingCost = shipments?.reduce((sum, s) => sum + ((s as any).shipping_cost || 0), 0) || 0;
      const deliveryRate = totalShipments ? ((delivered || 0) / totalShipments) * 100 : 0;
      
      return {
        total_shipments: totalShipments || 0,
        in_transit: inTransit || 0,
        delivered: delivered || 0,
        pending_returns: pendingReturns || 0,
        total_shipping_cost: totalShippingCost,
        delivery_rate: Math.round(deliveryRate * 100) / 100
      };
    }
  });
}
