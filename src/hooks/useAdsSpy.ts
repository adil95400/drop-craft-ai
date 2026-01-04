import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CompetitorAd {
  id: string;
  user_id: string;
  platform: 'facebook' | 'tiktok' | 'instagram' | 'google' | 'pinterest';
  ad_id?: string;
  advertiser_name?: string;
  ad_text?: string;
  ad_headline?: string;
  ad_cta?: string;
  landing_page_url?: string;
  image_urls?: string[];
  video_url?: string;
  estimated_spend_min?: number;
  estimated_spend_max?: number;
  estimated_reach?: number;
  engagement_score?: number;
  running_days?: number;
  countries?: string[];
  age_range?: string;
  gender_targeting?: string;
  interests?: string[];
  first_seen_at?: string;
  last_seen_at?: string;
  is_active?: boolean;
  product_category?: string;
  ai_analysis?: AdAnalysis;
  created_at: string;
  updated_at: string;
}

export interface AdAnalysis {
  hook_analysis: string;
  cta_effectiveness: string;
  visual_strategy: string;
  targeting_insights: string;
  improvement_suggestions: string[];
  winning_elements: string[];
  estimated_performance: 'low' | 'medium' | 'high' | 'viral';
}

export interface AdCollection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  ad_count: number;
  created_at: string;
  updated_at: string;
  items?: {
    id: string;
    notes?: string;
    added_at: string;
    ad: CompetitorAd;
  }[];
}

export interface AdSearchParams {
  query?: string;
  platform?: string;
  category?: string;
  minSpend?: number;
  maxSpend?: number;
  minEngagement?: number;
  countries?: string[];
  limit?: number;
}

async function invokeAdsSpy(action: string, params: object = {}) {
  const { data, error } = await supabase.functions.invoke('ads-spy', {
    body: { action, ...params },
  });

  if (error) throw error;
  return data;
}

export function useSearchAds(params: AdSearchParams, enabled = true) {
  return useQuery({
    queryKey: ['ads-spy', 'search', params],
    queryFn: async () => {
      const result = await invokeAdsSpy('search_ads', params);
      return result as { success: boolean; ads: CompetitorAd[]; total: number; source: string };
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTrendingAds(platform?: string, limit = 10) {
  return useQuery({
    queryKey: ['ads-spy', 'trending', platform, limit],
    queryFn: async () => {
      const result = await invokeAdsSpy('get_trending_ads', { platform, limit });
      return result as { success: boolean; ads: CompetitorAd[] };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdCollections() {
  return useQuery({
    queryKey: ['ads-spy', 'collections'],
    queryFn: async () => {
      const result = await invokeAdsSpy('get_collections');
      return result as { success: boolean; collections: AdCollection[] };
    },
  });
}

export function useAnalyzeAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (adId: string) => {
      const result = await invokeAdsSpy('analyze_ad', { adId });
      return result as { success: boolean; ad: CompetitorAd; analysis: AdAnalysis };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads-spy'] });
      toast.success('Analyse IA terminée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur d'analyse: ${error.message}`);
    },
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { name: string; description?: string; color?: string }) => {
      const result = await invokeAdsSpy('create_collection', params);
      return result as { success: boolean; collection: AdCollection };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads-spy', 'collections'] });
      toast.success('Collection créée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useSaveToCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { adId: string; collectionId: string; notes?: string }) => {
      return await invokeAdsSpy('save_to_collection', params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads-spy', 'collections'] });
      toast.success('Pub sauvegardée dans la collection');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useScrapeCompetitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { url: string; platform: string }) => {
      const result = await invokeAdsSpy('scrape_competitor', params);
      return result as { success: boolean; ad: CompetitorAd };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads-spy'] });
      toast.success('Pub concurrente analysée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur de scraping: ${error.message}`);
    },
  });
}
