import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useSyncConnectedStores() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-connected-stores', {
        body: {},
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Sync failed');
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Synchronisation terminée',
        description: data.message || `${data.total_imported} importés, ${data.total_updated} mis à jour`,
      });
      queryClient.invalidateQueries({ queryKey: ['products-unified'] });
      queryClient.invalidateQueries({ queryKey: ['imported-products'] });
    },
    onError: (err: Error) => {
      toast({
        title: 'Erreur de synchronisation',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  return {
    syncStores: mutation.mutate,
    isSyncingStores: mutation.isPending,
  };
}
