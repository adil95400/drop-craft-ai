import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface StockPrediction {
  id: string;
  product_id: string;
  current_stock: number;
  predicted_stockout_date: string | null;
  days_until_stockout: number | null;
  average_daily_sales: number;
  sales_trend: 'increasing' | 'decreasing' | 'stable';
  confidence_score: number;
  recommended_reorder_qty: number;
  recommended_reorder_date: string;
  last_analyzed_at: string;
  products?: {
    id: string;
    title: string;
    sku: string;
    stock_quantity: number;
    price: number;
  };
}

export interface StockAlert {
  id: string;
  product_id: string;
  alert_type: string;
  alert_level: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  days_until_stockout: number;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
  products?: {
    id: string;
    title: string;
    sku: string;
  };
}

export interface PriceOptimization {
  id: string;
  product_id: string;
  original_price: number;
  suggested_price: number;
  current_price: number;
  original_margin_percent: number;
  suggested_margin_percent: number;
  optimization_reason: string;
  demand_score: number;
  competition_score: number;
  confidence_score: number;
  status: 'pending' | 'applied' | 'rejected' | 'expired';
  products?: {
    id: string;
    title: string;
    sku: string;
    price: number;
    compare_at_price: number;
  };
}

export interface PriceABTest {
  id: string;
  product_id: string;
  test_name: string;
  variant_a_price: number;
  variant_b_price: number;
  variant_a_views: number;
  variant_b_views: number;
  variant_a_conversions: number;
  variant_b_conversions: number;
  variant_a_revenue: number;
  variant_b_revenue: number;
  traffic_split: number;
  status: 'draft' | 'running' | 'paused' | 'completed';
  winner: 'A' | 'B' | null;
  statistical_significance: number;
  started_at: string | null;
  ended_at: string | null;
  products?: {
    id: string;
    title: string;
    sku: string;
    price: number;
  };
}

export interface OptimizationSettings {
  id?: string;
  user_id?: string;
  is_enabled: boolean;
  min_margin_percent: number;
  max_margin_percent: number;
  target_margin_percent: number;
  auto_adjust_enabled: boolean;
  adjustment_frequency: 'hourly' | 'daily' | 'weekly';
  competitor_tracking_enabled: boolean;
  ab_testing_enabled: boolean;
}

// Appel API générique
async function callIntelligenceAPI(action: string, data?: any, productId?: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Non authentifié');

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dropshipping-intelligence`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action, productId, data }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur API');
  }

  return response.json();
}

// ===== STOCK PREDICTIONS =====

export function useStockPredictions() {
  return useQuery({
    queryKey: ['stock-predictions'],
    queryFn: async () => {
      const result = await callIntelligenceAPI('get_predictions');
      return result.predictions as StockPrediction[];
    },
  });
}

export function useAnalyzeStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId?: string) => {
      return callIntelligenceAPI('analyze_stock', undefined, productId);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stock-predictions'] });
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
      toast.success(`Analyse terminée: ${data.analyzed} produits analysés, ${data.alerts.length} alertes générées`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur d'analyse: ${error.message}`);
    },
  });
}

// ===== STOCK ALERTS =====

export function useStockAlerts() {
  return useQuery({
    queryKey: ['stock-alerts'],
    queryFn: async () => {
      const result = await callIntelligenceAPI('get_alerts');
      return result.alerts as StockAlert[];
    },
  });
}

export function useDismissAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      return callIntelligenceAPI('dismiss_alert', { alertId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
    },
  });
}

// ===== PRICE OPTIMIZATIONS =====

export function usePriceOptimizations() {
  return useQuery({
    queryKey: ['price-optimizations'],
    queryFn: async () => {
      const result = await callIntelligenceAPI('get_optimizations');
      return result.optimizations as PriceOptimization[];
    },
  });
}

export function useOptimizePrices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId?: string) => {
      return callIntelligenceAPI('optimize_prices', undefined, productId);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['price-optimizations'] });
      toast.success(`Optimisation terminée: ${data.optimizations.length} suggestions générées`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur d'optimisation: ${error.message}`);
    },
  });
}

export function useApplyOptimization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (optimizationId: string) => {
      return callIntelligenceAPI('apply_optimization', { optimizationId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-optimizations'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Prix mis à jour avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// ===== A/B TESTS =====

export function usePriceABTests() {
  return useQuery({
    queryKey: ['price-ab-tests'],
    queryFn: async () => {
      const result = await callIntelligenceAPI('get_ab_tests');
      return result.tests as PriceABTest[];
    },
  });
}

export function useCreateABTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      productId: string;
      variantAPrice: number;
      variantBPrice: number;
      testName?: string;
    }) => {
      return callIntelligenceAPI('create_ab_test', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-ab-tests'] });
      toast.success('Test A/B créé');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useStartABTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (testId: string) => {
      return callIntelligenceAPI('start_ab_test', { testId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-ab-tests'] });
      toast.success('Test A/B démarré');
    },
  });
}

export function useStopABTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (testId: string) => {
      return callIntelligenceAPI('stop_ab_test', { testId });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['price-ab-tests'] });
      toast.success(`Test terminé. Gagnant: Variante ${data.winner || 'Égalité'}`);
    },
  });
}

// ===== SETTINGS =====

export function useOptimizationSettings() {
  return useQuery({
    queryKey: ['optimization-settings'],
    queryFn: async () => {
      const result = await callIntelligenceAPI('get_settings');
      return result.settings as OptimizationSettings;
    },
  });
}

export function useUpdateOptimizationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<OptimizationSettings>) => {
      return callIntelligenceAPI('update_settings', { settings });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optimization-settings'] });
      toast.success('Paramètres mis à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}
