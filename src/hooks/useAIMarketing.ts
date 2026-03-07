import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============= SEO Optimizer =============

interface SEOAnalyzeParams {
  action: 'analyze' | 'optimize_meta' | 'keyword_research' | 'content_audit';
  product_id?: string;
  title?: string;
  description?: string;
  content?: string;
  target_keywords?: string[];
  language?: string;
  niche?: string;
}

export function useAISEOOptimizer() {
  const optimize = useMutation({
    mutationFn: async (params: SEOAnalyzeParams) => {
      const { data, error } = await supabase.functions.invoke('ai-seo-optimizer', { body: params });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => toast.success(`Analyse SEO "${data.action}" terminée`),
    onError: (error: any) => {
      if (error?.message?.includes('429')) toast.error('Limite atteinte, réessayez plus tard.');
      else if (error?.message?.includes('402')) toast.error('Crédits IA épuisés.');
      else toast.error('Erreur SEO optimizer');
    },
  });

  return { optimize, isOptimizing: optimize.isPending };
}

// ============= Copywriter =============

interface CopywriterParams {
  content_type: 'email' | 'ad_copy' | 'landing_page' | 'product_description' | 'social_post' | 'blog_outline';
  tone?: 'professional' | 'casual' | 'luxury' | 'urgency' | 'playful' | 'authoritative';
  brand_name?: string;
  product_name?: string;
  product_info?: string;
  target_audience?: string;
  key_benefits?: string[];
  cta?: string;
  language?: string;
  variants?: number;
}

export function useAICopywriter() {
  const generate = useMutation({
    mutationFn: async (params: CopywriterParams) => {
      const { data, error } = await supabase.functions.invoke('ai-copywriter', { body: params });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => toast.success(`Contenu "${data.content_type}" généré`),
    onError: (error: any) => {
      if (error?.message?.includes('429')) toast.error('Limite atteinte, réessayez plus tard.');
      else if (error?.message?.includes('402')) toast.error('Crédits IA épuisés.');
      else toast.error('Erreur copywriter IA');
    },
  });

  return { generate, isGenerating: generate.isPending };
}

// ============= Funnel Builder =============

interface FunnelParams {
  funnel_type: 'lead_magnet' | 'product_launch' | 'webinar' | 'tripwire' | 'evergreen' | 'flash_sale';
  product_name: string;
  product_price?: number;
  target_audience: string;
  niche?: string;
  brand_name?: string;
  budget?: 'low' | 'medium' | 'high';
  language?: string;
}

export function useAIFunnelBuilder() {
  const buildFunnel = useMutation({
    mutationFn: async (params: FunnelParams) => {
      const { data, error } = await supabase.functions.invoke('ai-funnel-builder', { body: params });
      if (error) throw error;
      return data;
    },
    onSuccess: () => toast.success('Funnel de vente généré avec succès'),
    onError: (error: any) => {
      if (error?.message?.includes('429')) toast.error('Limite atteinte, réessayez plus tard.');
      else if (error?.message?.includes('402')) toast.error('Crédits IA épuisés.');
      else toast.error('Erreur funnel builder');
    },
  });

  return { buildFunnel, isBuilding: buildFunnel.isPending };
}
