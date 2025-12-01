import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PriceChange {
  productId: string;
  sku: string;
  name: string;
  oldPrice: number;
  newPrice: number;
  changePercent: number;
  changeType: 'increase' | 'decrease';
}

export interface PriceMonitorResult {
  summary: {
    totalProducts: number;
    priceChanges: number;
    significantChanges: number;
    averageChange: number;
  };
  priceChanges: PriceChange[];
  significantChanges: PriceChange[];
}

export function usePriceMonitor(supplierId: string) {
  const queryClient = useQueryClient();

  const monitorPrices = useMutation({
    mutationFn: async (thresholdPercent: number = 5) => {
      const { data, error } = await supabase.functions.invoke('price-change-monitor', {
        body: { supplierId, thresholdPercent },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data as PriceMonitorResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-products', supplierId] });
      queryClient.invalidateQueries({ queryKey: ['price-history'] });
      
      const { summary } = data;
      if (summary.significantChanges > 0) {
        toast.warning(
          `${summary.significantChanges} changements de prix significatifs détectés (moyenne: ${summary.averageChange.toFixed(1)}%)`
        );
      } else {
        toast.success('Aucun changement de prix significatif');
      }
    },
    onError: (error) => {
      toast.error(`Erreur de monitoring: ${error.message}`);
    },
  });

  return {
    monitorPrices: monitorPrices.mutate,
    isMonitoring: monitorPrices.isPending,
    lastMonitorResult: monitorPrices.data,
  };
}
