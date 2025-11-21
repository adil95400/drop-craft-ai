import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ContentType = 'product_description' | 'blog_article' | 'seo_content' | 'ad_copy' | 'email_marketing';

export interface AIContentRequest {
  type: ContentType;
  prompt: string;
  language?: string;
  keywords?: string[];
}

export function useAIContent() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState<string | null>(null);

  const generateContent = async (request: AIContentRequest) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-content-generator', {
        body: request,
      });

      if (error) {
        if (error.message.includes('429')) {
          toast.error('Limite de requêtes atteinte. Veuillez réessayer plus tard.');
        } else if (error.message.includes('402')) {
          toast.error('Crédits insuffisants. Veuillez recharger votre compte.');
        } else {
          toast.error('Erreur lors de la génération du contenu');
        }
        throw error;
      }

      setContent(data.content);
      toast.success('Contenu généré avec succès');
      return data;
    } catch (error) {
      console.error('Error generating content:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateProductDescription = async (params: {
    productName: string;
    category?: string;
    features?: string[];
    targetAudience?: string;
    tone?: string;
  }) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-product-description', {
        body: params,
      });

      if (error) {
        if (error.message.includes('429')) {
          toast.error('Limite de requêtes atteinte. Veuillez réessayer plus tard.');
        } else if (error.message.includes('402')) {
          toast.error('Crédits insuffisants. Veuillez recharger votre compte.');
        } else {
          toast.error('Erreur lors de la génération de la description');
        }
        throw error;
      }

      toast.success('Description générée avec succès');
      return data;
    } catch (error) {
      console.error('Error generating description:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateContent,
    generateProductDescription,
    isGenerating,
    content,
  };
}
