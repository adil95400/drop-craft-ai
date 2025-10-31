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

  const compareCompetitors = useMutation({
    mutationFn: async ({ competitorIds }: { competitorIds: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase.functions.invoke('compare-competitors', {
        body: { competitorIds },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Comparaison terminée',
        description: 'Le rapport comparatif a été généré',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de comparer les concurrents',
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

  // Extract comparative metrics from analyses
  const getComparativeMetrics = () => {
    if (!analyses || analyses.length === 0) return null;

    const firstAnalysis = analyses[0];
    const priceAnalysis = firstAnalysis?.price_analysis;
    const competitiveData = firstAnalysis?.competitive_data;

    return {
      myApp: {
        avgPrice: priceAnalysis?.user_avg_price || 0,
        position: competitiveData?.market_position || 'challenger',
        pricePosition: competitiveData?.price_position || 'competitive',
        qualityScore: competitiveData?.quality_score || 75,
        differentiationFactors: competitiveData?.differentiation_factors || [],
      },
      marketAvgPrice: priceAnalysis?.market_avg_price || 0,
      priceGap: priceAnalysis?.price_gap_percentage || 0,
    };
  };

  // Extract all opportunities from analyses
  const getMarketOpportunities = () => {
    if (!analyses || analyses.length === 0) return [];
    
    const allOpportunities: any[] = [];
    analyses.forEach(analysis => {
      if (analysis.market_position && Array.isArray(analysis.market_position)) {
        allOpportunities.push(...analysis.market_position);
      }
    });
    
    return allOpportunities.slice(0, 10);
  };

  // Extract all threats from analyses
  const getCompetitiveThreats = () => {
    if (!analyses || analyses.length === 0) return [];
    
    const allThreats: any[] = [];
    analyses.forEach(analysis => {
      if (analysis.gap_opportunities && Array.isArray(analysis.gap_opportunities)) {
        const threats = analysis.gap_opportunities
          .filter((item: any) => item.threat_level || item.competitor_advantage)
          .map((item: any) => ({
            title: item.missing_feature || item.competitor || 'Menace concurrentielle',
            description: item.competitor_advantage || item.description || '',
            severity: item.threat_level || analysis.threat_level || 'medium',
            impact: item.mitigation_strategy || `Priorité: ${item.implementation_priority || 'medium'}`,
          }));
        allThreats.push(...threats);
      }
    });
    
    return allThreats.slice(0, 10);
  };

  return {
    analyses,
    isLoading,
    analyzeCompetitor,
    trackCompetitorPrices,
    compareCompetitors,
    deleteAnalysis,
    isAnalyzing: analyzeCompetitor.isPending,
    isTracking: trackCompetitorPrices.isPending,
    isComparing: compareCompetitors.isPending,
    getComparativeMetrics,
    getMarketOpportunities,
    getCompetitiveThreats,
  };
}
