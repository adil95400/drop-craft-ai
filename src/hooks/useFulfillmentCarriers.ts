import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface FulfillmentCarrier {
  id: string;
  user_id: string;
  carrier_code: string;
  api_credentials?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export function useFulfillmentCarriers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: carriers, isLoading } = useQuery({
    queryKey: ['fulfillment-carriers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await (supabase as any)
        .from('fulfillment_carriers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as FulfillmentCarrier[];
    },
    enabled: !!user,
  });

  const connectCarrierMutation = useMutation({
    mutationFn: async (params: {
      carrierCode: string;
      credentials: Record<string, any>;
      isDefault?: boolean;
    }) => {
      const { data, error } = await supabase.functions.invoke('carrier-connect', {
        body: params
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-carriers'] });
      toast({
        title: '✅ Transporteur connecté',
        description: 'La connexion a été établie avec succès',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de connecter le transporteur',
        variant: 'destructive',
      });
    },
  });

  const updateCarrierMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FulfillmentCarrier> }) => {
      const { data, error } = await (supabase as any)
        .from('fulfillment_carriers')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-carriers'] });
      toast({
        title: '✅ Transporteur mis à jour',
        description: 'Les modifications ont été enregistrées',
      });
    },
  });

  const deleteCarrierMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('fulfillment_carriers')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-carriers'] });
      toast({
        title: '✅ Transporteur supprimé',
        description: 'Le transporteur a été retiré',
      });
    },
  });

  return {
    carriers: carriers || [],
    isLoading,
    connectCarrier: connectCarrierMutation.mutate,
    isConnecting: connectCarrierMutation.isPending,
    updateCarrier: updateCarrierMutation.mutate,
    isUpdating: updateCarrierMutation.isPending,
    deleteCarrier: deleteCarrierMutation.mutate,
    isDeleting: deleteCarrierMutation.isPending,
  };
}