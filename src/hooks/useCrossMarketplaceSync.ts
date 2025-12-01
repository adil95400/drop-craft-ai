import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useCrossMarketplaceSync() {
  const queryClient = useQueryClient();

  const syncProducts = useMutation({
    mutationFn: async ({ 
      productIds, 
      syncType = 'all' 
    }: { 
      productIds?: string[]; 
      syncType?: 'all' | 'stock' | 'price' | 'content' 
    }) => {
      const { data, error } = await supabase.functions.invoke('cross-marketplace-sync', {
        body: { action: 'sync', productIds, syncType }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-products'] });
      
      const { synced, failed } = data.results;
      if (failed > 0) {
        toast.warning(`${synced} produits synchronisés, ${failed} échecs`);
      } else {
        toast.success(`${synced} produits synchronisés avec succès`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Erreur de synchronisation: ${error.message}`);
    }
  });

  return {
    syncProducts: syncProducts.mutate,
    isSyncing: syncProducts.isPending,
    lastSyncResult: syncProducts.data,
  };
}
