import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useCompetitiveIntelligence = () => {
  const { toast } = useToast();

  const analyzeProduct = useMutation({
    mutationFn: async (productUrl: string) => {
      const { data, error } = await supabase.functions.invoke('competitive-intelligence', {
        body: { action: 'analyze_product', product_url: productUrl }
      });
      if (error) throw error;
      return data.analysis;
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  const estimateSales = useMutation({
    mutationFn: async (productUrl: string) => {
      const { data, error } = await supabase.functions.invoke('competitive-intelligence', {
        body: { action: 'estimate_sales', product_url: productUrl }
      });
      if (error) throw error;
      return data.sales_data;
    }
  });

  const analyzeSaturation = useMutation({
    mutationFn: async (category: string) => {
      const { data, error } = await supabase.functions.invoke('competitive-intelligence', {
        body: { action: 'saturation_analysis', category }
      });
      if (error) throw error;
      return data.saturation;
    }
  });

  const analyzePrices = useMutation({
    mutationFn: async (competitorUrls: string[]) => {
      const { data, error } = await supabase.functions.invoke('competitive-intelligence', {
        body: { action: 'price_intelligence', competitor_urls: competitorUrls }
      });
      if (error) throw error;
      return data.price_data;
    }
  });

  return {
    analyzeProduct,
    estimateSales,
    analyzeSaturation,
    analyzePrices
  };
};