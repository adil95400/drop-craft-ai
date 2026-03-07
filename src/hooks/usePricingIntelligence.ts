import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

function handleError(error: unknown) {
  const msg = error instanceof Error ? error.message : 'Unknown error';
  if (msg.includes('429')) toast.error('Limite IA atteinte. Réessayez dans quelques minutes.');
  else if (msg.includes('402')) toast.error('Crédits IA épuisés. Passez au plan supérieur.');
  else toast.error(msg);
}

export function useCompetitorMonitor() {
  return useMutation({
    mutationFn: async (params: { product_ids: string[]; competitor_urls?: string[] }) => {
      const { data, error } = await supabase.functions.invoke('ai-pricing-intelligence', {
        body: { action: 'competitor_monitor', ...params },
      });
      if (error) throw error;
      return data;
    },
    onError: handleError,
  });
}

export function useMarginCalculator() {
  return useMutation({
    mutationFn: async (margin_params: {
      cost_price: number;
      selling_price: number;
      shipping_cost?: number;
      platform_fees_percent?: number;
      ad_spend_per_unit?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-pricing-intelligence', {
        body: { action: 'margin_calculate', margin_params },
      });
      if (error) throw error;
      return data;
    },
    onError: handleError,
  });
}

export function usePriceHistory() {
  return useMutation({
    mutationFn: async (params: { product_ids: string[]; period_days?: number }) => {
      const { data, error } = await supabase.functions.invoke('ai-pricing-intelligence', {
        body: { action: 'price_history', ...params },
      });
      if (error) throw error;
      return data;
    },
    onError: handleError,
  });
}

export function useAutoPricingRules() {
  return useMutation({
    mutationFn: async (rule_config: {
      rule_type: 'psychological_rounding' | 'margin_floor' | 'competitor_match' | 'demand_based';
      params: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-pricing-intelligence', {
        body: { action: 'auto_pricing_rules', rule_config },
      });
      if (error) throw error;
      return data;
    },
    onError: handleError,
  });
}
