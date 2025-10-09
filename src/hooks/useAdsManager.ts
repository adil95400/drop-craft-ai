import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdCampaign {
  id: string;
  campaign_name: string;
  platform: 'facebook' | 'google' | 'instagram' | 'tiktok';
  campaign_type: 'awareness' | 'traffic' | 'conversion' | 'sales';
  status: 'draft' | 'active' | 'paused' | 'completed';
  budget_total: number;
  budget_spent: number;
  budget_daily: number;
  target_audience: any;
  ad_creative: any;
  ai_generated: boolean;
  ab_test_config: any;
  performance_metrics: {
    impressions?: number;
    clicks?: number;
    conversions?: number;
    ctr?: number;
    cpc?: number;
    roas?: number;
  };
  created_at: string;
}

export interface PlatformConnection {
  id: string;
  platform: string;
  account_name?: string;
  is_active: boolean;
  sync_status: string;
  last_sync_at?: string;
}

export function useAdsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch campaigns
  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['ad-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AdCampaign[];
    },
  });

  // Fetch platform connections
  const { data: connections = [], isLoading: isLoadingConnections } = useQuery({
    queryKey: ['ads-platform-connections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ads_platform_connections')
        .select('*');

      if (error) throw error;
      return data as PlatformConnection[];
    },
  });

  // Connect platform
  const connectPlatform = useMutation({
    mutationFn: async ({ platform, accountData }: { platform: string; accountData: any }) => {
      const { data, error } = await supabase.functions.invoke('ads-manager', {
        body: { action: 'connect', platform, data: accountData },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads-platform-connections'] });
      toast({ title: 'Platform connected successfully!' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Connection failed', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  // Sync campaigns
  const syncCampaigns = useMutation({
    mutationFn: async (platform: string) => {
      const { data, error } = await supabase.functions.invoke('ads-manager', {
        body: { action: 'sync_campaigns', platform },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-campaigns'] });
      toast({ title: 'Campaigns synced successfully!' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Sync failed', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  // Create campaign
  const createCampaign = useMutation({
    mutationFn: async (campaignData: any) => {
      const { data, error } = await supabase.functions.invoke('ads-manager', {
        body: { 
          action: 'create_campaign', 
          platform: campaignData.platform,
          data: campaignData 
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-campaigns'] });
      toast({ title: 'Campaign created successfully!' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Campaign creation failed', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  // Generate AI ad
  const generateAIAd = useMutation({
    mutationFn: async ({ productData, platform, campaignType, targetAudience, generateVariants }: any) => {
      const { data, error } = await supabase.functions.invoke('ai-ad-creator', {
        body: { productData, platform, campaignType, targetAudience, generateVariants },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'AI ad generated successfully!' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'AI generation failed', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  // Calculate stats
  const stats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalSpent: campaigns.reduce((sum, c) => sum + (c.budget_spent || 0), 0),
    totalBudget: campaigns.reduce((sum, c) => sum + (c.budget_total || 0), 0),
    avgROAS: campaigns.length > 0
      ? campaigns.reduce((sum, c) => sum + (c.performance_metrics?.roas || 0), 0) / campaigns.length
      : 0,
    connectedPlatforms: connections.filter(c => c.is_active).length,
  };

  return {
    campaigns,
    connections,
    stats,
    isLoadingCampaigns,
    isLoadingConnections,
    connectPlatform: connectPlatform.mutate,
    isConnecting: connectPlatform.isPending,
    syncCampaigns: syncCampaigns.mutate,
    isSyncing: syncCampaigns.isPending,
    createCampaign: createCampaign.mutate,
    isCreating: createCampaign.isPending,
    generateAIAd: generateAIAd.mutate,
    isGenerating: generateAIAd.isPending,
  };
}
