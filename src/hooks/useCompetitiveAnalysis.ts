import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CompetitorAnalysis {
  id: string;
  user_id: string;
  competitor_name: string;
  product_id: string;
  competitive_data: any;
  price_analysis: any;
  market_position: any;
  gap_opportunities: any;
  threat_level: string;
  created_at: string;
  updated_at: string;
}

export function useCompetitiveAnalysis() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: analyses, isLoading } = useQuery({
    queryKey: ['competitive-analyses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitive_intelligence')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as CompetitorAnalysis[];
    },
  });

  const analyzeCompetitor = useMutation({
    mutationFn: async ({ url, name }: { url: string; name?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase.functions.invoke('analyze-competitor', {
        body: { 
          url,
          name: name || url,
          userId: user.id 
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitive-analyses'] });
      toast({
        title: 'Analyse terminée',
        description: 'Le concurrent a été analysé avec succès',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'analyser le concurrent',
        variant: 'destructive',
      });
    },
  });

  const trackCompetitorPrices = useMutation({
    mutationFn: async ({ 
      productId, 
      myPrice, 
      competitors 
    }: { 
      productId: string; 
      myPrice: number; 
      competitors: Array<{ name: string; url?: string; price: number; shippingCost?: number }> 
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase.functions.invoke('competitor-tracker', {
        body: { 
          userId: user.id,
          productId,
          myPrice,
          competitors
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Suivi activé',
        description: 'Les prix des concurrents sont maintenant suivis',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de suivre les prix',
        variant: 'destructive',
      });
    },
  });

  const deleteAnalysis = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('competitive_intelligence')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitive-analyses'] });
      toast({
        title: 'Supprimé',
        description: 'L\'analyse a été supprimée',
      });
    },
  });

  return {
    analyses,
    isLoading,
    analyzeCompetitor,
    trackCompetitorPrices,
    deleteAnalysis,
    isAnalyzing: analyzeCompetitor.isPending,
    isTracking: trackCompetitorPrices.isPending,
  };
}
