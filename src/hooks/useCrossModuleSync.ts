/**
 * useCrossModuleSync — Hook to trigger cross-module sync actions
 * Calls the cross-module-sync edge function for auto-pricing, stock alerts, and competitor repricing
 */
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useApplyPricingRules() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('cross-module-sync', {
        body: { action: 'apply_pricing_rules' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.applied > 0) {
        toast.success(`${data.applied} prix mis à jour via vos règles de pricing`);
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
      const { data, error } = await supabase.functions.invoke('cross-module-sync', {
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
      const { data, error } = await supabase.functions.invoke('cross-module-sync', {
        body: { action: 'auto_reprice_from_competitors' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.adjusted > 0) {
        toast.success(`${data.adjusted} prix ajustés selon la concurrence (${data.competitors_analyzed} entrées analysées)`);
      } else {
        toast.info('Aucun ajustement nécessaire');
      }
    },
    onError: (err: Error) => toast.error(`Erreur repricing concurrent: ${err.message}`),
  });
}
