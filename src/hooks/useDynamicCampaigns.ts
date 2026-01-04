import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DynamicCampaign {
  id: string;
  name: string;
  description?: string;
  campaign_type: string;
  status: string;
  platforms: string[];
  targeting_rules?: Record<string, unknown>;
  budget_daily?: number;
  budget_total?: number;
  budget_spent?: number;
  bid_strategy: string;
  bid_amount?: number;
  schedule_start?: string;
  schedule_end?: string;
  product_filter?: Record<string, unknown>;
  creative_template?: Record<string, unknown>;
  performance_metrics?: Record<string, unknown>;
  campaign_product_feeds?: ProductFeed[];
  campaign_creatives?: Creative[];
  created_at: string;
  updated_at: string;
}

export interface ProductFeed {
  id: string;
  name: string;
  feed_type: string;
  feed_url?: string;
  product_count: number;
  last_generated_at?: string;
  generation_status: string;
  validation_errors?: unknown[];
}

export interface Creative {
  id: string;
  name: string;
  creative_type: string;
  template_data?: Record<string, unknown>;
  generated_assets?: unknown[];
  status: string;
  performance_data?: Record<string, unknown>;
}

export interface CampaignPerformance {
  id: string;
  campaign_id: string;
  date: string;
  platform: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  roas?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
}

export interface PerformanceSummary {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: string;
  roas: string;
  cpc: string;
}

export interface AIRecommendation {
  type: string;
  priority: string;
  title: string;
  description: string;
  action?: Record<string, unknown>;
}

export function useDynamicCampaigns() {
  const queryClient = useQueryClient();

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['dynamic-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('dynamic-campaigns', {
        body: { action: 'list' }
      });
      if (error) throw error;
      return data.campaigns as DynamicCampaign[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (campaignData: Partial<DynamicCampaign>) => {
      const { data, error } = await supabase.functions.invoke('dynamic-campaigns', {
        body: { action: 'create', campaignData }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic-campaigns'] });
      toast.success('Campagne créée avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ campaignId, campaignData }: { campaignId: string; campaignData: Partial<DynamicCampaign> }) => {
      const { data, error } = await supabase.functions.invoke('dynamic-campaigns', {
        body: { action: 'update', campaignId, campaignData }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic-campaigns'] });
      toast.success('Campagne mise à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await supabase.functions.invoke('dynamic-campaigns', {
        body: { action: 'delete', campaignId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic-campaigns'] });
      toast.success('Campagne supprimée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const startMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await supabase.functions.invoke('dynamic-campaigns', {
        body: { action: 'start', campaignId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic-campaigns'] });
      toast.success('Campagne démarrée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const pauseMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await supabase.functions.invoke('dynamic-campaigns', {
        body: { action: 'pause', campaignId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic-campaigns'] });
      toast.success('Campagne mise en pause');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const generateFeedMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await supabase.functions.invoke('dynamic-campaigns', {
        body: { action: 'generate_feed', campaignId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic-campaigns'] });
      toast.success('Flux produit généré');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const getPerformance = async (campaignId?: string, dateRange?: { start: string; end: string }) => {
    const { data, error } = await supabase.functions.invoke('dynamic-campaigns', {
      body: { action: 'get_performance', campaignId, dateRange }
    });
    if (error) throw error;
    return data as { performance: CampaignPerformance[]; summary: PerformanceSummary };
  };

  const getAIOptimization = async (campaignId: string) => {
    const { data, error } = await supabase.functions.invoke('dynamic-campaigns', {
      body: { action: 'ai_optimize', campaignId }
    });
    if (error) throw error;
    return data as { recommendations: AIRecommendation[]; currentPerformance: Record<string, number> };
  };

  return {
    campaigns,
    isLoading,
    createCampaign: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateCampaign: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteCampaign: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    startCampaign: startMutation.mutate,
    isStarting: startMutation.isPending,
    pauseCampaign: pauseMutation.mutate,
    isPausing: pauseMutation.isPending,
    generateFeed: generateFeedMutation.mutate,
    isGeneratingFeed: generateFeedMutation.isPending,
    getPerformance,
    getAIOptimization
  };
}
