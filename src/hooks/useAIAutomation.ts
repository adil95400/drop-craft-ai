import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProductDescriptionParams {
  productName: string;
  category: string;
  features?: string[];
  targetAudience?: string;
  tone?: 'professional' | 'casual' | 'luxury' | 'playful';
}

export interface MarketingContentParams {
  contentType: 'email' | 'social' | 'ad' | 'blog';
  productInfo: {
    name: string;
    description?: string;
    price?: number;
  };
  platform?: string;
  campaignGoal?: string;
}

export interface PriceOptimizationParams {
  productName: string;
  currentPrice: number;
  costPrice: number;
  category: string;
  competitorPrices?: number[];
  salesData?: {
    totalSales: number;
    averageOrderValue: number;
  };
  marketConditions?: string;
}

export interface SentimentAnalysisParams {
  reviews: Array<{
    rating: number;
    text: string;
    date?: string;
  }>;
  productId: string;
  analysisType?: 'quick' | 'detailed';
}

export function useAIAutomation() {
  const { toast } = useToast();

  // Generate product descriptions
  const generateProductDescription = useMutation({
    mutationFn: async (params: ProductDescriptionParams) => {
      const { data, error } = await supabase.functions.invoke('ai-product-description', {
        body: params,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Description générée avec succès!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur de génération',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  // Generate marketing content
  const generateMarketingContent = useMutation({
    mutationFn: async (params: MarketingContentParams) => {
      const { data, error } = await supabase.functions.invoke('ai-marketing-content', {
        body: params,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Contenu marketing généré!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur de génération',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  // Optimize pricing
  const optimizePrice = useMutation({
    mutationFn: async (params: PriceOptimizationParams) => {
      const { data, error } = await supabase.functions.invoke('ai-price-optimizer', {
        body: params,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Analyse de prix complétée!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur d\'analyse',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  // Analyze sentiment
  const analyzeSentiment = useMutation({
    mutationFn: async (params: SentimentAnalysisParams) => {
      const { data, error } = await supabase.functions.invoke('ai-sentiment-analysis', {
        body: params,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Analyse de sentiment complétée!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur d\'analyse',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  return {
    // Product descriptions
    generateProductDescription: generateProductDescription.mutate,
    generateProductDescriptionAsync: generateProductDescription.mutateAsync,
    isGeneratingDescription: generateProductDescription.isPending,
    descriptionData: generateProductDescription.data,

    // Marketing content
    generateMarketingContent: generateMarketingContent.mutate,
    generateMarketingContentAsync: generateMarketingContent.mutateAsync,
    isGeneratingMarketing: generateMarketingContent.isPending,
    marketingData: generateMarketingContent.data,

    // Price optimization
    optimizePrice: optimizePrice.mutate,
    optimizePriceAsync: optimizePrice.mutateAsync,
    isOptimizingPrice: optimizePrice.isPending,
    priceData: optimizePrice.data,

    // Sentiment analysis
    analyzeSentiment: analyzeSentiment.mutate,
    analyzeSentimentAsync: analyzeSentiment.mutateAsync,
    isAnalyzingSentiment: analyzeSentiment.isPending,
    sentimentData: analyzeSentiment.data,
  };
}
