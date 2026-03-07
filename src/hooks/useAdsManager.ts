/**
 * useAdsManager — Clean re-export (replaces useRealAdsManager)
 * + AI-powered ads management hooks (Phase 4)
 */
export { useRealAdsManager as useAdsManager } from './useRealAdsManager';
export type { AdCampaign, AdsMetrics, PlatformPerformance } from './useRealAdsManager';

// Phase 4: AI Ads Manager hooks
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

function handleAdsError(error: unknown) {
  const msg = error instanceof Error ? error.message : 'Unknown error';
  if (msg.includes('429')) toast.error('Limite IA atteinte. Réessayez dans quelques minutes.');
  else if (msg.includes('402')) toast.error('Crédits IA épuisés. Passez au plan supérieur.');
  else toast.error(msg);
}

export function useCreateAdCampaign() {
  return useMutation({
    mutationFn: async (campaign_config: {
      name: string;
      platform: string;
      objective: 'traffic' | 'conversions' | 'awareness' | 'engagement' | 'sales';
      budget_daily: number;
      budget_total?: number;
      duration_days?: number;
      product_ids?: string[];
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-ads-manager', {
        body: { action: 'create_campaign', campaign_config },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => toast.success('Campagne publicitaire créée'),
    onError: handleAdsError,
  });
}

export function useOptimizeCampaign() {
  return useMutation({
    mutationFn: async (campaign_id: string) => {
      const { data, error } = await supabase.functions.invoke('ai-ads-manager', {
        body: { action: 'optimize_campaign', campaign_id },
      });
      if (error) throw error;
      return data;
    },
    onError: handleAdsError,
  });
}

export function useCrossPlatformROI() {
  return useMutation({
    mutationFn: async (date_range?: { from: string; to: string }) => {
      const { data, error } = await supabase.functions.invoke('ai-ads-manager', {
        body: { action: 'cross_platform_roi', date_range },
      });
      if (error) throw error;
      return data;
    },
    onError: handleAdsError,
  });
}

export function useAudienceSuggest() {
  return useMutation({
    mutationFn: async (params: {
      platform?: 'facebook' | 'google' | 'tiktok';
      product_ids?: string[];
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-ads-manager', {
        body: { action: 'audience_suggest', ...params },
      });
      if (error) throw error;
      return data;
    },
    onError: handleAdsError,
  });
}

export function useAdCreativeGenerate() {
  return useMutation({
    mutationFn: async (params: {
      product_ids: string[];
      platform?: 'facebook' | 'google' | 'tiktok' | 'instagram';
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-ads-manager', {
        body: { action: 'creative_generate', ...params },
      });
      if (error) throw error;
      return data;
    },
    onError: handleAdsError,
  });
}
