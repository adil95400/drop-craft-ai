/**
 * P2-1: Hook pour les prévisions de demande
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

export interface DemandForecast {
  id: string;
  product_id: string;
  forecast_date: string;
  predicted_demand: number;
  confidence_score: number;
  scenario: 'optimistic' | 'realistic' | 'pessimistic';
  seasonality_factor: number;
  trend_direction: 'up' | 'down' | 'stable';
  input_data: Record<string, any>;
  created_at: string;
}

export function useDemandForecasts(productId?: string) {
  const { user } = useUnifiedAuth();

  const { data: forecasts = [], isLoading } = useQuery({
    queryKey: ['demand-forecasts', user?.id, productId],
    queryFn: async () => {
      let query = (supabase.from('demand_forecasts') as any)
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (productId) query = query.eq('product_id', productId);
      const { data, error } = await query;
      if (error) throw error;
      return data as DemandForecast[];
    },
    enabled: !!user?.id,
  });

  const queryClient = useQueryClient();

  const generateForecast = useMutation({
    mutationFn: async (targetProductId: string) => {
      const { data, error } = await supabase.functions.invoke('intelligence-engine', {
        body: { action: 'forecast', productId: targetProductId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['demand-forecasts'] });
      toast.success(`Prévision générée (confiance: ${Math.round((data.forecast?.confidence || 0) * 100)}%)`);
    },
    onError: (e: Error) => toast.error(`Erreur: ${e.message}`),
  });

  return {
    forecasts,
    isLoading,
    generateForecast: generateForecast.mutate,
    isGenerating: generateForecast.isPending,
  };
}
