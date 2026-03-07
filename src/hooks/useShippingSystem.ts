import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

function handleError(error: unknown) {
  const msg = error instanceof Error ? error.message : 'Unknown error';
  if (msg.includes('429')) toast.error('Limite IA atteinte. Réessayez dans quelques minutes.');
  else if (msg.includes('402')) toast.error('Crédits IA épuisés. Passez au plan supérieur.');
  else toast.error(msg);
}

export function useShippingRates() {
  return useMutation({
    mutationFn: async (params: {
      package_info: { weight_kg: number; dimensions_cm?: { length: number; width: number; height: number }; value: number; currency?: string };
      origin?: { country: string; postal_code: string };
      destination: { country: string; postal_code: string; city?: string };
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-shipping-system', {
        body: { action: 'calculate_rates', ...params },
      });
      if (error) throw error;
      return data;
    },
    onError: handleError,
  });
}

export function useShippingLabel() {
  return useMutation({
    mutationFn: async (params: {
      order_id: string;
      origin?: { country: string; postal_code: string };
      destination?: { country: string; postal_code: string; city?: string };
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-shipping-system', {
        body: { action: 'generate_label', ...params },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => toast.success('Étiquette d\'expédition générée'),
    onError: handleError,
  });
}

export function useShippingRulesEvaluator() {
  return useMutation({
    mutationFn: async (params: {
      shipping_rules: Array<{ rule_type: string; conditions: Record<string, unknown>; rate: number }>;
      package_info: { weight_kg: number; value: number };
      destination: { country: string; postal_code: string };
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-shipping-system', {
        body: { action: 'evaluate_rules', ...params },
      });
      if (error) throw error;
      return data;
    },
    onError: handleError,
  });
}

export function useCarrierRecommendation() {
  return useMutation({
    mutationFn: async (params: {
      package_info: { weight_kg: number; value: number };
      origin: { country: string; postal_code: string };
      destination: { country: string; postal_code: string };
      carrier_preferences?: string[];
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-shipping-system', {
        body: { action: 'carrier_recommend', ...params },
      });
      if (error) throw error;
      return data;
    },
    onError: handleError,
  });
}
