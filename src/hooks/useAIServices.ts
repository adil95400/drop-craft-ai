import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAIServices = () => {
  const { toast } = useToast();

  const generateProductDescription = useMutation({
    mutationFn: async (params: {
      productName: string;
      category: string;
      features: string[];
      tone?: string;
      length?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-product-descriptions', {
        body: params
      });

      if (error) throw error;
      return data;
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Impossible de générer la description',
        variant: 'destructive'
      });
    }
  });

  const optimizePricing = useMutation({
    mutationFn: async (params: {
      productId: string;
      currentPrice: number;
      costPrice: number;
      competitorPrices: Array<{ price: number; competitor: string }>;
      salesHistory: any[];
      marketData: any;
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-pricing-optimizer', {
        body: params
      });

      if (error) throw error;
      return data;
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'optimiser le prix',
        variant: 'destructive'
      });
    }
  });

  const generateMarketingContent = useMutation({
    mutationFn: async (params: {
      contentType: 'email' | 'social' | 'ad' | 'blog';
      campaign: string;
      targetAudience: string;
      tone: string;
      keyMessages: string[];
      callToAction: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-marketing-content', {
        body: params
      });

      if (error) throw error;
      return data;
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le contenu marketing',
        variant: 'destructive'
      });
    }
  });

  const analyzeSentiment = useMutation({
    mutationFn: async (params: {
      texts: string[];
      analysisType?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-sentiment-analysis', {
        body: params
      });

      if (error) throw error;
      return data;
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'analyser le sentiment',
        variant: 'destructive'
      });
    }
  });

  return {
    generateProductDescription,
    optimizePricing,
    generateMarketingContent,
    analyzeSentiment
  };
};
