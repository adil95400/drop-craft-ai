/**
 * useCrossModuleSync — Unified pricing pipeline hooks
 * All actions now route through the unified pricing-rules-engine edge function
 */
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useApplyPricingRules() {
  return useMutation({
    mutationFn: async (options: { platformFeePercent?: number } | void = undefined) => {
      const { data, error } = await supabase.functions.invoke('pricing-rules-engine', {
        body: { action: 'apply_pricing_rules', ...options },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.applied > 0) {
        toast.success(`${data.applied} prix mis à jour (${data.skipped_low_margin || 0} ignorés pour marge insuffisante)`);
      } else {
        toast.info('Aucun prix à ajuster — tous les produits sont déjà conformes');
      }
    },
    onError: (err: Error) => toast.error(`Erreur sync pricing: ${err.message}`),
  });
}

export function useSyncStockAlerts() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('pricing-rules-engine', {
        body: { action: 'sync_stock_alerts' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const total = (data.low_stock || 0) + (data.out_of_stock || 0);
      if (total > 0) {
        toast.warning(`${data.low_stock} en stock bas, ${data.out_of_stock} en rupture — ${data.alerts_created} alertes créées`);
      } else {
        toast.success('Stock OK — aucune alerte');
      }
    },
    onError: (err: Error) => toast.error(`Erreur alertes stock: ${err.message}`),
  });
}

export function useAutoRepriceFromCompetitors() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('pricing-rules-engine', {
        body: { action: 'auto_reprice_from_competitors' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.adjusted > 0) {
        toast.success(`${data.adjusted} prix ajustés (${data.skipped_low_confidence || 0} ignorés conf. basse, ${data.skipped_low_margin || 0} marge basse)`);
      } else {
        toast.info('Aucun ajustement nécessaire');
      }
    },
    onError: (err: Error) => toast.error(`Erreur repricing concurrent: ${err.message}`),
  });
}

/** Calculate P&L for a single product */
export function useCalculatePnL() {
  return useMutation({
    mutationFn: async (params: {
      currentPrice: number;
      costPrice: number;
      platformFeePercent?: number;
      shippingCost?: number;
      adSpendPerUnit?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('pricing-rules-engine', {
        body: { action: 'calculate_pnl', ...params },
      });
      if (error) throw error;
      return data.pnl;
    },
    onError: (err: Error) => toast.error(`Erreur calcul P&L: ${err.message}`),
  });
}

/** Batch P&L for all user products */
export function useBatchPnL() {
  return useMutation({
    mutationFn: async (params?: {
      platformFeePercent?: number;
      shippingCost?: number;
      adSpendPerUnit?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('pricing-rules-engine', {
        body: { action: 'batch_pnl', ...params },
      });
      if (error) throw error;
      return data;
    },
    onError: (err: Error) => toast.error(`Erreur batch P&L: ${err.message}`),
  });
}
