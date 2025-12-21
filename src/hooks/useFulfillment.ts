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

export interface Carrier {
  id: string;
  user_id: string;
  carrier_code: string;
  name: string;
  is_active: boolean;
  config?: any;
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

// Carriers - use orders table as fallback
export function useCarriers() {
  return useQuery({
    queryKey: ['fulfillment-carriers'],
    queryFn: async (): Promise<Carrier[]> => {
      const user = await getCurrentUser();
      if (!user) return [];
      
      // Return mock carriers since table doesn't exist
      return [
        { id: '1', user_id: user.id, carrier_code: 'dhl', name: 'DHL', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '2', user_id: user.id, carrier_code: 'ups', name: 'UPS', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '3', user_id: user.id, carrier_code: 'fedex', name: 'FedEx', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ];
    }
  });
}

export function useCreateCarrier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (carrier: Partial<Carrier>) => {
      // Mock implementation
      toast.info('Carrier management coming soon');
      return carrier as Carrier;
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

// Shipments - use orders table
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
      
      return (data || []).map((order: any) => ({
        id: order.id,
        user_id: order.user_id,
        order_id: order.id,
        carrier_name: order.carrier || 'Unknown',
        tracking_number: order.tracking_number,
        status: order.fulfillment_status || 'pending',
        shipping_cost: order.shipping_cost,
        created_at: order.created_at,
        updated_at: order.updated_at
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
      
      // Update order with shipping info
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
    onError: (error: any) => {
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
      
      // Return empty array - table may not exist
      return [];
    }
  });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (returnData: Partial<ReturnRMA>) => {
      toast.info('Return management coming soon');
      return returnData as ReturnRMA;
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
      toast.info('Return management coming soon');
      return { id, ...updates } as ReturnRMA;
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
      
      const { data: orders, error } = await supabase
        .from('orders')
        .select('fulfillment_status, shipping_cost')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Stats error:', error);
        return {
          total_shipments: 0,
          in_transit: 0,
          delivered: 0,
          pending_returns: 0,
          total_shipping_cost: 0,
          delivery_rate: 0
        };
      }
      
      const totalShipments = orders?.length || 0;
      const inTransit = orders?.filter(o => o.fulfillment_status === 'shipped').length || 0;
      const delivered = orders?.filter(o => o.fulfillment_status === 'delivered').length || 0;
      const totalShippingCost = orders?.reduce((sum, o) => sum + (o.shipping_cost || 0), 0) || 0;
      const deliveryRate = totalShipments ? (delivered / totalShipments) * 100 : 0;
      
      return {
        total_shipments: totalShipments,
        in_transit: inTransit,
        delivered: delivered,
        pending_returns: 0,
        total_shipping_cost: totalShippingCost,
        delivery_rate: Math.round(deliveryRate * 100) / 100
      };
    }
  });
}
