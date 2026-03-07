/**
 * useAICampaignGenerator — Hook for AI-powered marketing campaign generation
 */
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CampaignRequest {
  campaign_type: 'email' | 'social' | 'ads' | 'full';
  product_ids?: string[];
  goal?: string;
  tone?: string;
  platform?: string;
  language?: string;
}

export interface GeneratedCampaign {
  campaign_name: string;
  campaign_summary: string;
  email?: {
    subject_lines: string[];
    preview_text: string;
    body_text: string;
    cta_text: string;
    send_timing: string;
  };
  social_posts?: Array<{
    platform: string;
    text: string;
    hashtags: string[];
    best_time: string;
    content_type: string;
  }>;
  ad_creatives?: Array<{
    platform: string;
    headline: string;
    primary_text: string;
    description: string;
    cta: string;
    target_audience: string;
    estimated_budget: string;
  }>;
  seo_keywords?: string[];
  timeline?: string;
  estimated_reach?: string;
  kpis?: string[];
}

export function useAICampaignGenerator() {
  const [campaign, setCampaign] = useState<GeneratedCampaign | null>(null);

  const mutation = useMutation({
    mutationFn: async (request: CampaignRequest) => {
      const { data, error } = await supabase.functions.invoke('ai-campaign-generator', {
        body: request
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.campaign as GeneratedCampaign;
    },
    onSuccess: (data) => {
      setCampaign(data);
      toast.success(`Campagne "${data.campaign_name}" générée avec succès`);
    },
    onError: (error: Error) => {
      const msg = error.message;
      if (msg.includes('429') || msg.includes('rate')) {
        toast.error('Trop de requêtes IA. Réessayez dans quelques instants.');
      } else if (msg.includes('402') || msg.includes('crédit')) {
        toast.error('Crédits IA épuisés. Rechargez vos crédits.');
      } else {
        toast.error(`Erreur: ${msg}`);
      }
    },
  });

  return {
    generateCampaign: mutation.mutate,
    isGenerating: mutation.isPending,
    campaign,
    reset: () => setCampaign(null),
  };
}
