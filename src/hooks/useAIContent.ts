import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AIContentService, AIContentTemplate, AIGeneratedContent } from '@/services/AIContentService';
import { useLogAction } from '@/hooks/useTrackedAction';

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
  const logAction = useLogAction();

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
      logAction('ai_generations', 'content_generation', { type: request.type, language: request.language || 'fr' });
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

      logAction('ai_generations', 'product_description', { product: params.productName });
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

// New hooks for AI Content Templates
export function useAIContentTemplates() {
  return useQuery({
    queryKey: ['ai-content-templates'],
    queryFn: () => AIContentService.getTemplates(),
  });
}

export function useCreateAITemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (template: Partial<AIContentTemplate>) => AIContentService.createTemplate(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-content-templates'] });
      toast.success('Template créé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdateAITemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AIContentTemplate> }) => 
      AIContentService.updateTemplate(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-content-templates'] });
      toast.success('Template mis à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDeleteAITemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => AIContentService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-content-templates'] });
      toast.success('Template supprimé');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useGeneratedContent(filters?: { status?: string; productId?: string }) {
  return useQuery({
    queryKey: ['ai-generated-content', filters],
    queryFn: () => AIContentService.getGeneratedContent(filters),
  });
}

export function useGenerateAIContent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, templateId, variables }: { 
      productId: string; 
      templateId: string; 
      variables: Record<string, any> 
    }) => AIContentService.generateContent(productId, templateId, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-generated-content'] });
      queryClient.invalidateQueries({ queryKey: ['ai-content-templates'] });
      toast.success('Contenu généré avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur de génération: ${error.message}`);
    },
  });
}

export function useUpdateContentStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AIGeneratedContent['status'] }) => 
      AIContentService.updateContentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-generated-content'] });
      toast.success('Statut mis à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useAIContentBatches() {
  return useQuery({
    queryKey: ['ai-content-batches'],
    queryFn: () => AIContentService.getBatches(),
  });
}

export function useAIContentStats() {
  return useQuery({
    queryKey: ['ai-content-stats'],
    queryFn: () => AIContentService.getContentStats(),
  });
}
