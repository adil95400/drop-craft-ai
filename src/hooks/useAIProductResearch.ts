import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WinningProduct {
  title: string;
  description: string;
  category: string;
  estimated_cost: number;
  suggested_price: number;
  profit_margin: number;
  winning_score: number;
  trend_score: number;
  saturation_level: 'low' | 'medium' | 'high';
  viral_potential: number;
  source_platforms: string[];
  target_audience: string[];
  marketing_angles: string[];
  hashtags: string[];
  seasonality: string | null;
  reasons: string[];
}

interface NicheAnalysis {
  niche_name: string;
  overall_score: number;
  market_size: string;
  growth_rate: string;
  competition_level: string;
  profit_potential: number;
  entry_difficulty: string;
  average_margins: { low: number; high: number };
  key_players: string[];
  target_demographics: {
    age_range: string;
    gender: string;
    interests: string[];
    income_level: string;
  };
  marketing_channels: Array<{
    channel: string;
    effectiveness: number;
    cost_level: string;
  }>;
  seasonal_trends: string[];
  risks: string[];
  opportunities: string[];
  recommendations: string[];
  sub_niches: string[];
}

interface TrendPrediction {
  product_name: string;
  current_trend_score: number;
  predicted_30d: number;
  predicted_60d: number;
  predicted_90d: number;
  trend_direction: 'rising' | 'peak' | 'declining' | 'stable';
  momentum: 'slow' | 'moderate' | 'fast' | 'viral';
  seasonality: string | null;
  confidence: number;
  market_saturation: number;
  competition_level: string;
  profit_potential: string;
  target_demographics: string[];
  recommended_platforms: string[];
  recommendations: string[];
  best_selling_period: string;
  price_range_suggestion: { min: number; max: number; optimal: number };
}

export const useAIProductResearch = () => {
  const { toast } = useToast();

  const findWinningProducts = useMutation({
    mutationFn: async (params: { 
      query?: string; 
      niche?: string; 
      marketplace?: string;
      budget?: { min: number; max: number };
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-product-research', {
        body: { 
          action: 'find_winners',
          ...params
        }
      });
      if (error) throw error;
      return data.data as { products: WinningProduct[]; market_insights: any };
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const analyzeNiche = useMutation({
    mutationFn: async (niche: string) => {
      const { data, error } = await supabase.functions.invoke('ai-product-research', {
        body: { 
          action: 'analyze_niche',
          niche
        }
      });
      if (error) throw error;
      return data.data as NicheAnalysis;
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const predictTrend = useMutation({
    mutationFn: async (params: { 
      product_name: string; 
      hashtags?: string[];
      category?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-trend-predictor', {
        body: params
      });
      if (error) throw error;
      return data.prediction as TrendPrediction;
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const analyzeCompetitors = useMutation({
    mutationFn: async (query: string) => {
      const { data, error } = await supabase.functions.invoke('ai-product-research', {
        body: { 
          action: 'competitor_analysis',
          query
        }
      });
      if (error) throw error;
      return data.data;
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const suggestProducts = useMutation({
    mutationFn: async (filters: Record<string, any>) => {
      const { data, error } = await supabase.functions.invoke('ai-product-research', {
        body: { 
          action: 'suggest_products',
          filters
        }
      });
      if (error) throw error;
      return data.data;
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  return {
    findWinningProducts,
    analyzeNiche,
    predictTrend,
    analyzeCompetitors,
    suggestProducts,
    isLoading: findWinningProducts.isPending || 
               analyzeNiche.isPending || 
               predictTrend.isPending ||
               analyzeCompetitors.isPending ||
               suggestProducts.isPending
  };
};
