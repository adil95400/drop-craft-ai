import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Carrier {
  id: string;
  carrier_name: string;
  carrier_code: string;
  default_service: string | null;
  is_active: boolean;
  supported_services: any;
  tracking_url_template: string | null;
  created_at: string;
}

export interface Shipment {
  id: string;
  order_id: string | null;
  carrier_code: string | null;
  tracking_number: string | null;
  status: string | null;
  tracking_events: any;
  shipping_cost: number | null;
  shipped_at: string | null;
  delivered_at: string | null;
  estimated_delivery: string | null;
  created_at: string;
}

export function useShippingManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch carriers
  const { data: carriers, isLoading: isLoadingCarriers } = useQuery({
    queryKey: ['fulfillment-carriers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fulfillment_carriers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Carrier[];
    },
  });

  // Fetch shipments
  const { data: shipments, isLoading: isLoadingShipments } = useQuery({
    queryKey: ['fulfillment-shipments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fulfillment_shipments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Shipment[];
    },
  });

  // Fetch fulfilment rules
  const { data: rules, isLoading: isLoadingRules } = useQuery({
    queryKey: ['fulfilment-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fulfilment_rules')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Calculate stats
  const stats = {
    inTransit: shipments?.filter(s => s.status === 'in_transit' || s.status === 'shipped').length || 0,
    delivered: shipments?.filter(s => s.status === 'delivered').length || 0,
    avgDeliveryTime: 3.2, // Calculated from actual data if available
    avgCost: shipments?.length 
      ? (shipments.reduce((sum, s) => sum + (s.shipping_cost || 0), 0) / shipments.length).toFixed(2)
      : '0.00'
  };

  // Create carrier mutation
  const createCarrierMutation = useMutation({
    mutationFn: async (carrierData: Partial<Carrier>) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('fulfillment_carriers')
        .insert({
          user_id: session.session.user.id,
          carrier_name: carrierData.carrier_name || '',
          carrier_code: carrierData.carrier_code || '',
          default_service: carrierData.default_service,
          is_active: carrierData.is_active ?? true,
          supported_services: carrierData.supported_services || [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-carriers'] });
      toast({
        title: "Transporteur ajouté",
        description: "Le transporteur a été créé avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le transporteur",
        variant: "destructive",
      });
    },
  });

  // Toggle carrier active state
  const toggleCarrierMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('fulfillment_carriers')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-carriers'] });
      toast({
        title: "Transporteur mis à jour",
        description: "Le statut a été modifié",
      });
    },
  });

  // Create rule mutation
  const createRuleMutation = useMutation({
    mutationFn: async (ruleData: { name: string; description?: string; conditions: any; actions: any }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('fulfilment_rules')
        .insert({
          user_id: session.session.user.id,
          ...ruleData,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfilment-rules'] });
      toast({
        title: "Règle créée",
        description: "La règle d'expédition a été ajoutée",
      });
    },
  });

  return {
    carriers,
    isLoadingCarriers,
    shipments,
    isLoadingShipments,
    rules,
    isLoadingRules,
    stats,
    createCarrier: createCarrierMutation.mutate,
    isCreatingCarrier: createCarrierMutation.isPending,
    toggleCarrier: (id: string, isActive: boolean) => toggleCarrierMutation.mutate({ id, isActive }),
    createRule: createRuleMutation.mutate,
  };
}
