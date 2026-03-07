import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GenerateDescriptionsParams {
  productName: string;
  category?: string;
  features?: string[];
  tone?: 'professional' | 'casual' | 'luxury' | 'technical' | 'playful';
  length?: 'short' | 'medium' | 'long';
  languages?: string[];
  product_id?: string;
}

interface ProductContent {
  title: string;
  description: string;
  meta_title: string;
  meta_description: string;
  bullet_points: string[];
  keywords: string[];
  short_description: string;
}

interface DescriptionResult {
  descriptions: Record<string, ProductContent | { error: string }>;
  languages_generated: string[];
  languages_failed: string[];
}

interface EnhanceImageParams {
  product_id: string;
  method?: 'ai' | 'multi-search' | 'scrape' | 'alt-text-only';
  productTitle?: string;
  sku?: string;
  existingImageUrl?: string;
  sourceUrl?: string;
}

export function useAIProductContent() {
  const generateDescriptions = useMutation({
    mutationFn: async (params: GenerateDescriptionsParams): Promise<DescriptionResult> => {
      const { data, error } = await supabase.functions.invoke('ai-product-descriptions', {
        body: params,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const count = data.languages_generated.length;
      toast.success(`${count} description${count > 1 ? 's' : ''} générée${count > 1 ? 's' : ''}`);
    },
    onError: (error: any) => {
      if (error?.message?.includes('429')) {
        toast.error('Limite de requêtes atteinte, réessayez dans quelques instants.');
      } else if (error?.message?.includes('402')) {
        toast.error('Crédits IA épuisés.');
      } else {
        toast.error('Erreur lors de la génération');
      }
    },
  });

  const enhanceImages = useMutation({
    mutationFn: async (params: EnhanceImageParams) => {
      const { data, error } = await supabase.functions.invoke('enrich-product-images', {
        body: {
          product_id: params.product_id,
          method: params.method || 'multi-search',
          productTitle: params.productTitle,
          sku: params.sku,
          existingImageUrl: params.existingImageUrl,
          sourceUrl: params.sourceUrl,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Images enrichies avec succès');
    },
    onError: () => {
      toast.error("Erreur lors de l'enrichissement d'images");
    },
  });

  return {
    generateDescriptions,
    enhanceImages,
    isGenerating: generateDescriptions.isPending,
    isEnhancing: enhanceImages.isPending,
  };
}
