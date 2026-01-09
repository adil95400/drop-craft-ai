import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export interface ReturnRMA {
  id: string;
  user_id: string;
  order_id?: string;
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
  product_id?: string;
  product_name?: string;
  product_sku?: string;
  quantity: number;
  images?: string[];
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Carrier {
  id: string;
  user_id: string;
  carrier_code: string;
  name: string;
  is_active: boolean;
  config?: Record<string, unknown>;
  tracking_url_template?: string;
  created_at: string;
  updated_at: string;
}

export interface Shipment {
  id: string;
  user_id: string;
  order_id?: string;
  carrier_name: string;
  tracking_number?: string;
  status: string;
  shipping_cost?: number;
  label_url?: string;
  created_at: string;
  updated_at: string;
}

// Carriers
export function useCarriers() {
  return useQuery({
    queryKey: ['fulfillment-carriers'],
    queryFn: async (): Promise<Carrier[]> => {
      const user = await getCurrentUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('carriers')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching carriers:', error);
        return [];
      }
      
      return (data || []) as Carrier[];
    }
  });
}

export function useCreateCarrier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (carrier: Partial<Carrier>) => {
      const user = await getCurrentUser();
      if (!user) throw new Error('Non authentifié');
      
      const { data, error } = await supabase
        .from('carriers')
        .insert([{
          user_id: user.id,
          carrier_code: carrier.carrier_code,
          name: carrier.name,
          is_active: carrier.is_active ?? true,
          config: (carrier.config || {}) as Record<string, string | number | boolean | null>,
          tracking_url_template: carrier.tracking_url_template
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data as Carrier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-carriers'] });
      toast.success('Transporteur ajouté');
    },
    onError: (error: Error) => {
      toast.error('Erreur: ' + error.message);
    }
  });
}

export function useUpdateCarrier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Carrier>) => {
      const user = await getCurrentUser();
      if (!user) throw new Error('Non authentifié');
      
      const { data, error } = await supabase
        .from('carriers')
        .update({
          carrier_code: updates.carrier_code,
          name: updates.name,
          is_active: updates.is_active,
          config: (updates.config || {}) as Record<string, string | number | boolean | null>,
          tracking_url_template: updates.tracking_url_template
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Carrier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-carriers'] });
      toast.success('Transporteur mis à jour');
    },
    onError: (error: Error) => {
      toast.error('Erreur: ' + error.message);
    }
  });
}

export function useDeleteCarrier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const user = await getCurrentUser();
      if (!user) throw new Error('Non authentifié');
      
      const { error } = await supabase
        .from('carriers')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-carriers'] });
      toast.success('Transporteur supprimé');
    },
    onError: (error: Error) => {
      toast.error('Erreur: ' + error.message);
    }
  });
}

// Shipments
export function useShipments(status?: string) {
  return useQuery({
    queryKey: ['fulfillment-shipments', status],
    queryFn: async (): Promise<Shipment[]> => {
      const user = await getCurrentUser();
      if (!user) return [];
      
      let query = supabase
        .from('orders')
        .select('id, user_id, carrier, tracking_number, fulfillment_status, shipping_cost, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('fulfillment_status', status);
      }
      
      const { data, error } = await query;
      if (error) {
        console.error('Shipments error:', error);
        return [];
      }
      
      return (data || []).map((order: Record<string, unknown>) => ({
        id: order.id as string,
        user_id: order.user_id as string,
        order_id: order.id as string,
        carrier_name: (order.carrier as string) || 'Unknown',
        tracking_number: order.tracking_number as string | undefined,
        status: (order.fulfillment_status as string) || 'pending',
        shipping_cost: order.shipping_cost as number | undefined,
        created_at: order.created_at as string,
        updated_at: order.updated_at as string
      }));
    }
  });
}

export function useCreateShipment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (shipment: Partial<Shipment>) => {
      const user = await getCurrentUser();
      if (!user) throw new Error('Non authentifié');
      
      if (shipment.order_id) {
        const { error } = await supabase
          .from('orders')
          .update({
            carrier: shipment.carrier_name,
            tracking_number: shipment.tracking_number,
            fulfillment_status: 'shipped',
            shipping_cost: shipment.shipping_cost
          })
          .eq('id', shipment.order_id)
          .eq('user_id', user.id);
        
        if (error) throw error;
      }
      
      return shipment as Shipment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-shipments'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Expédition créée');
    },
    onError: (error: Error) => {
      toast.error('Erreur: ' + error.message);
    }
  });
}

// Returns/RMA
export function useReturns(status?: string) {
  return useQuery({
    queryKey: ['returns-rma', status],
    queryFn: async (): Promise<ReturnRMA[]> => {
      const user = await getCurrentUser();
      if (!user) return [];
      
      let query = supabase
        .from('returns_rma')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      if (error) {
        console.error('Returns error:', error);
        return [];
      }
      
      return (data || []) as ReturnRMA[];
    }
  });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (returnData: Partial<ReturnRMA>) => {
      const user = await getCurrentUser();
      if (!user) throw new Error('Non authentifié');
      
      const rmaNumber = `RMA-${Date.now().toString(36).toUpperCase()}`;
      
      const { data, error } = await supabase
        .from('returns_rma')
        .insert([{
          user_id: user.id,
          order_id: returnData.order_id,
          rma_number: rmaNumber,
          status: 'requested',
          reason_category: returnData.reason_category || 'other',
          reason: returnData.reason,
          customer_notes: returnData.customer_notes,
          product_id: returnData.product_id,
          product_name: returnData.product_name,
          product_sku: returnData.product_sku,
          quantity: returnData.quantity || 1,
          refund_amount: returnData.refund_amount,
          refund_method: returnData.refund_method,
          images: returnData.images
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data as ReturnRMA;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns-rma'] });
      toast.success('Demande de retour créée');
    },
    onError: (error: Error) => {
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
        .from('returns_rma')
        .update({
          status: updates.status,
          internal_notes: updates.internal_notes,
          refund_status: updates.refund_status,
          refund_amount: updates.refund_amount,
          return_tracking_number: updates.return_tracking_number,
          return_carrier: updates.return_carrier,
          received_at: updates.received_at,
          inspected_at: updates.inspected_at,
          refunded_at: updates.refunded_at,
          resolved_at: updates.resolved_at
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as ReturnRMA;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns-rma'] });
      toast.success('Retour mis à jour');
    },
    onError: (error: Error) => {
      toast.error('Erreur: ' + error.message);
    }
  });
}

export function useDeleteReturn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const user = await getCurrentUser();
      if (!user) throw new Error('Non authentifié');
      
      const { error } = await supabase
        .from('returns_rma')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns-rma'] });
      toast.success('Retour supprimé');
    },
    onError: (error: Error) => {
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
      
      // Get order stats
      const { data: orders } = await supabase
        .from('orders')
        .select('fulfillment_status, shipping_cost')
        .eq('user_id', user.id);
      
      // Get pending returns count (status = 'requested' or 'pending')
      const { count: pendingReturns } = await supabase
        .from('returns_rma')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['pending', 'requested']);
      
      const totalShipments = orders?.length || 0;
      const inTransit = orders?.filter(o => o.fulfillment_status === 'shipped').length || 0;
      const delivered = orders?.filter(o => o.fulfillment_status === 'delivered').length || 0;
      const totalShippingCost = orders?.reduce((sum, o) => sum + (o.shipping_cost || 0), 0) || 0;
      const deliveryRate = totalShipments ? (delivered / totalShipments) * 100 : 0;
      
      return {
        total_shipments: totalShipments,
        in_transit: inTransit,
        delivered: delivered,
        pending_returns: pendingReturns || 0,
        total_shipping_cost: totalShippingCost,
        delivery_rate: Math.round(deliveryRate * 100) / 100
      };
    }
  });
}
