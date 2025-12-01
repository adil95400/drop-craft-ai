import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PriceSyncConfig {
  strategy: 'lowest' | 'highest' | 'average' | 'margin_based';
  margin_percent?: number;
  round_to?: number;
}

export interface PriceSyncResult {
  products_synced: number;
  errors: number;
  results: Array<{
    product_id: string;
    sku: string;
    name: string;
    old_price: number;
    new_price: number;
    marketplaces_updated: number;
    error?: string;
  }>;
}

export function usePriceSync() {
  const queryClient = useQueryClient();

  const syncPrices = useMutation({
    mutationFn: async ({ 
      productIds, 
      config 
    }: { 
      productIds?: string[]; 
      config: PriceSyncConfig 
    }) => {
      const { data, error } = await supabase.functions.invoke('price-sync-auto', {
        body: { productIds, config },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data as PriceSyncResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-products'] });
      queryClient.invalidateQueries({ queryKey: ['price-history'] });
      
      if (data.errors > 0) {
        toast.warning(
          `${data.products_synced} produits synchronisés, ${data.errors} erreurs`
        );
      } else {
        toast.success(
          `${data.products_synced} prix synchronisés avec succès`
        );
      }
    },
    onError: (error) => {
      toast.error(`Erreur de synchronisation: ${error.message}`);
    },
  });

  return {
    syncPrices: syncPrices.mutate,
    isSyncing: syncPrices.isPending,
    lastSyncResult: syncPrices.data,
  };
}
