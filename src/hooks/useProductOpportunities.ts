/**
 * P2-3: Hook pour la détection d'opportunités produit
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

export interface ProductOpportunity {
  id: string;
  product_id: string | null;
  opportunity_type: 'high_margin' | 'trending' | 'low_competition' | 'seasonal' | 'bundle' | 'upsell';
  opportunity_score: number;
  estimated_margin: number | null;
  estimated_demand: number | null;
  competition_level: 'low' | 'medium' | 'high' | 'very_high';
  reasoning: string | null;
  ai_analysis: Record<string, any>;
  status: 'new' | 'reviewed' | 'accepted' | 'rejected' | 'expired';
  expires_at: string | null;
  created_at: string;
}

export function useProductOpportunities() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ['product-opportunities', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase.from('product_opportunities') as any)
        .select('*')
        .eq('user_id', user!.id)
        .in('status', ['new', 'reviewed'])
        .order('opportunity_score', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as ProductOpportunity[];
    },
    enabled: !!user?.id,
  });

  const scanOpportunities = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('opportunity-scanner');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['smart-alerts'] });
      toast.success(`${data.opportunities} opportunités détectées`);
    },
    onError: (e: Error) => toast.error(`Erreur: ${e.message}`),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase.from('product_opportunities') as any)
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-opportunities'] });
    },
  });

  const stats = {
    total: opportunities.length,
    highMargin: opportunities.filter(o => o.opportunity_type === 'high_margin').length,
    trending: opportunities.filter(o => o.opportunity_type === 'trending').length,
    avgScore: opportunities.length ? Math.round(opportunities.reduce((s, o) => s + o.opportunity_score, 0) / opportunities.length) : 0,
  };

  return {
    opportunities,
    stats,
    isLoading,
    scanOpportunities: scanOpportunities.mutate,
    updateStatus: updateStatus.mutate,
    isScanning: scanOpportunities.isPending,
  };
}
