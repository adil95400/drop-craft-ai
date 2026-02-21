/**
 * usePriceChangeHistory — Hook pour l'historique des changements de prix (P1-1)
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

export interface PriceChangeRecord {
  id: string;
  product_id: string;
  old_price: number;
  new_price: number;
  change_percent: number;
  change_type: string;
  source: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export function usePriceChangeHistory(productId?: string, limit = 50) {
  const { user } = useUnifiedAuth();

  return useQuery({
    queryKey: ['price-change-history', user?.id, productId, limit],
    queryFn: async (): Promise<PriceChangeRecord[]> => {
      let query = (supabase.from('price_change_history') as any)
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (productId) query = query.eq('product_id', productId);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
  });
}
