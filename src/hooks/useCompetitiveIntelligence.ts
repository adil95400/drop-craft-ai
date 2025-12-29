import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CompetitorAnalysis {
  product_url: string;
  title: string;
  estimated_monthly_sales: number;
  estimated_revenue: number;
  market_saturation_score: number;
  competition_level: 'low' | 'medium' | 'high';
  price_position: 'budget' | 'competitive' | 'premium';
  trend_direction: string;
  predicted_growth: string;
  competitors_count: number;
  avg_competitor_price: string;
  social_mentions: number;
  seo_score: number;
  review_count: number;
  rating: number;
  ad_activity: {
    facebook_ads: number;
    google_ads: number;
    tiktok_ads: number;
  };
  opportunities: string[];
}

export interface SalesEstimate {
  daily_estimate: number;
  weekly_estimate: number;
  monthly_estimate: number;
  confidence_level: number;
  factors: {
    search_volume: string;
    social_engagement: string;
    competitor_pricing: string;
    seasonality: string;
    product_catalog_size?: number;
  };
  prediction_model: string;
  data_sources?: string[];
}

export interface SaturationAnalysis {
  category: string;
  saturation_score: number;
  market_size: string;
  barrier_to_entry: string;
  top_players: number;
  new_entrants_last_30_days: number;
  recommendation: string;
  niches_available: string[];
  entry_strategies: string[];
}

export interface PriceIntelligence {
  competitor_prices: Array<{
    url: string;
    hostname: string;
    current_price: string;
    min_price: string;
    max_price: string;
    price_range: string;
    products_analyzed: number;
    price_position: string;
    seo_score: number;
  }>;
  failed_urls: string[];
  market_avg_price: string;
  market_min_price: string;
  market_max_price: string;
  recommended_price: string;
  price_positioning: string;
  analysis_timestamp: string;
}

export interface CompetitorHistory {
  id: string;
  competitor_name: string;
  competitor_url: string;
  competitive_data: any;
  price_analysis: any;
  market_position: string;
  recommendations: string[];
  created_at: string;
  updated_at: string;
}

export const useCompetitiveIntelligence = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Historique des analyses
  const useAnalysisHistory = () => useQuery({
    queryKey: ['competitive-analysis-history'],
    queryFn: async (): Promise<CompetitorHistory[]> => {
      const { data, error } = await supabase
        .from('competitive_intelligence')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return (data || []) as CompetitorHistory[];
    }
  });

  const analyzeProduct = useMutation({
    mutationFn: async (productUrl: string): Promise<CompetitorAnalysis> => {
      const { data, error } = await supabase.functions.invoke('competitive-intelligence', {
        body: { action: 'analyze_product', product_url: productUrl }
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data.analysis;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitive-analysis-history'] });
      toast({ 
        title: 'Analyse terminée', 
        description: 'Les données du concurrent ont été analysées avec succès' 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erreur d\'analyse', 
        description: error.message || 'Impossible d\'analyser cette URL', 
        variant: 'destructive' 
      });
    }
  });

  const estimateSales = useMutation({
    mutationFn: async (productUrl: string): Promise<SalesEstimate> => {
      const { data, error } = await supabase.functions.invoke('competitive-intelligence', {
        body: { action: 'estimate_sales', product_url: productUrl }
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data.sales_data;
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erreur d\'estimation', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  });

  const analyzeSaturation = useMutation({
    mutationFn: async (category: string): Promise<SaturationAnalysis> => {
      const { data, error } = await supabase.functions.invoke('competitive-intelligence', {
        body: { action: 'saturation_analysis', category }
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data.saturation;
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erreur d\'analyse saturation', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  });

  const analyzePrices = useMutation({
    mutationFn: async (competitorUrls: string[]): Promise<PriceIntelligence> => {
      const { data, error } = await supabase.functions.invoke('competitive-intelligence', {
        body: { action: 'price_intelligence', competitor_urls: competitorUrls }
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data.price_data;
    },
    onSuccess: () => {
      toast({ 
        title: 'Analyse prix terminée', 
        description: 'Les prix concurrents ont été analysés' 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erreur analyse prix', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  });

  const bulkAnalyze = useMutation({
    mutationFn: async (competitorUrls: string[]) => {
      const { data, error } = await supabase.functions.invoke('competitive-intelligence', {
        body: { action: 'bulk_analyze', competitor_urls: competitorUrls }
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['competitive-analysis-history'] });
      toast({ 
        title: 'Analyse en masse terminée', 
        description: `${data.summary.analyzed}/${data.summary.total} URLs analysées` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erreur analyse en masse', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
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
      queryClient.invalidateQueries({ queryKey: ['competitive-analysis-history'] });
      toast({ title: 'Analyse supprimée' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erreur suppression', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  });

  return {
    analyzeProduct,
    estimateSales,
    analyzeSaturation,
    analyzePrices,
    bulkAnalyze,
    deleteAnalysis,
    useAnalysisHistory
  };
};
