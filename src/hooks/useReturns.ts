import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useReturns() {
  const queryClient = useQueryClient();

  const { data: returns, isLoading } = useQuery({
    queryKey: ['returns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('returns')
        .select('*, order:orders(*), customer:customers(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const processReturn = useMutation({
    mutationFn: async (returnId: string) => {
      const { data, error } = await supabase.functions.invoke('returns-automation', {
        body: { action: 'process_return', return_id: returnId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      toast.success('Retour traité automatiquement');
    }
  });

  return {
    returns,
    isLoading,
    processReturn: processReturn.mutate,
    isProcessing: processReturn.isPending
  };
}
