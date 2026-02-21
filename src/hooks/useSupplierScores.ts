/**
 * P2-2: Hook pour le scoring fournisseur avancé
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

export interface SupplierScore {
  id: string;
  supplier_id: string;
  overall_score: number;
  reliability_score: number;
  delivery_score: number;
  quality_score: number;
  price_score: number;
  communication_score: number;
  return_rate: number;
  avg_delivery_days: number;
  on_time_rate: number;
  total_orders: number;
  total_issues: number;
  recommendation: 'preferred' | 'recommended' | 'neutral' | 'caution' | 'avoid';
  ai_insights: Record<string, any>;
  last_evaluated_at: string;
}

export function useSupplierScores() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();

  const { data: scores = [], isLoading } = useQuery({
    queryKey: ['supplier-scores', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase.from('supplier_scores') as any)
        .select('*')
        .eq('user_id', user!.id)
        .order('overall_score', { ascending: false });
      if (error) throw error;
      return data as SupplierScore[];
    },
    enabled: !!user?.id,
  });

  const evaluateSupplier = useMutation({
    mutationFn: async (supplierId: string) => {
      const { data, error } = await supabase.functions.invoke('intelligence-engine', {
        body: { action: 'score_supplier', productId: supplierId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-scores'] });
      toast.success('Score fournisseur recalculé');
    },
    onError: (e: Error) => toast.error(`Erreur: ${e.message}`),
  });

  return {
    scores,
    isLoading,
    evaluateSupplier: evaluateSupplier.mutate,
    isEvaluating: evaluateSupplier.isPending,
  };
}
