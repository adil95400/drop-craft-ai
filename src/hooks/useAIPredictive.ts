import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============= Revenue Forecaster =============

interface RevenueForecastParams {
  period?: '30' | '60' | '90';
  granularity?: 'daily' | 'weekly' | 'monthly';
  include_seasonality?: boolean;
  scenario?: 'optimistic' | 'realistic' | 'pessimistic';
}

export function useAIRevenueForecaster() {
  const forecast = useMutation({
    mutationFn: async (params: RevenueForecastParams = {}) => {
      const { data, error } = await supabase.functions.invoke('ai-revenue-forecaster', { body: params });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => toast.success(`Prévision ${data.period}j (${data.scenario}) générée`),
    onError: (error: any) => {
      if (error?.message?.includes('429')) toast.error('Limite atteinte, réessayez plus tard.');
      else if (error?.message?.includes('402')) toast.error('Crédits IA épuisés.');
      else toast.error('Erreur prévision revenus');
    },
  });

  return { forecast, isForecasting: forecast.isPending };
}

// ============= Demand Predictor =============

interface DemandPredictorParams {
  scope?: 'product' | 'category' | 'global';
  product_id?: string;
  category?: string;
  horizon_days?: number;
}

export function useAIDemandPredictor() {
  const predict = useMutation({
    mutationFn: async (params: DemandPredictorParams = {}) => {
      const { data, error } = await supabase.functions.invoke('ai-demand-predictor', { body: params });
      if (error) throw error;
      return data;
    },
    onSuccess: () => toast.success('Prédiction de demande générée'),
    onError: (error: any) => {
      if (error?.message?.includes('429')) toast.error('Limite atteinte, réessayez plus tard.');
      else if (error?.message?.includes('402')) toast.error('Crédits IA épuisés.');
      else toast.error('Erreur prédiction demande');
    },
  });

  return { predict, isPredicting: predict.isPending };
}

// ============= Dynamic Pricing =============

interface DynamicPricingParams {
  product_ids?: string[];
  strategy?: 'maximize_revenue' | 'maximize_margin' | 'maximize_volume' | 'competitive' | 'penetration';
  constraints?: {
    min_margin_pct?: number;
    max_price_change_pct?: number;
    respect_map?: boolean;
  };
}

export function useAIDynamicPricing() {
  const analyze = useMutation({
    mutationFn: async (params: DynamicPricingParams = {}) => {
      const { data, error } = await supabase.functions.invoke('ai-dynamic-pricing', { body: params });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => toast.success(`${data.products_analyzed} produits analysés — stratégie "${data.strategy}"`),
    onError: (error: any) => {
      if (error?.message?.includes('429')) toast.error('Limite atteinte, réessayez plus tard.');
      else if (error?.message?.includes('402')) toast.error('Crédits IA épuisés.');
      else toast.error('Erreur tarification dynamique');
    },
  });

  return { analyze, isAnalyzing: analyze.isPending };
}
