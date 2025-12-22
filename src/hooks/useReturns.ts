import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReturnItem {
  id: string
  order_id: string
  status: string
  reason?: string
  created_at: string
  order?: any
  customer?: any
}

// Mock returns data
const mockReturns: ReturnItem[] = [
  {
    id: '1',
    order_id: 'order-1',
    status: 'pending',
    reason: 'Produit défectueux',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    order_id: 'order-2',
    status: 'approved',
    reason: 'Taille incorrecte',
    created_at: new Date().toISOString()
  }
]

export function useReturns() {
  const queryClient = useQueryClient();

  const { data: returns = mockReturns, isLoading } = useQuery({
    queryKey: ['returns'],
    queryFn: async () => {
      // Returns table doesn't exist, return mock data
      // In a real implementation, you would query the returns table
      return mockReturns
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
    },
    onError: () => {
      toast.error('Erreur lors du traitement du retour');
    }
  });

  return {
    returns,
    isLoading,
    processReturn: processReturn.mutate,
    isProcessing: processReturn.isPending
  };
}
