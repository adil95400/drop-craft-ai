import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface MarketingCampaign {
  id: string; name: string; type: 'email' | 'sms' | 'social' | 'ads' | 'retargeting';
  status: 'active' | 'paused' | 'completed' | 'draft'; budget?: number; spent?: number;
  impressions?: number; clicks?: number; conversions?: number; ctr?: number; cpa?: number; roas?: number;
  start_date?: string; end_date?: string; created_at: string; updated_at: string;
}

export const useRealMarketing = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: campaigns = [], isLoading: isLoadingCampaigns, error } = useQuery({
    queryKey: ['marketing-campaigns', user?.id],
    queryFn: async (): Promise<MarketingCampaign[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase.from('marketing_campaigns')
        .select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as MarketingCampaign[];
    },
    enabled: !!user?.id,
  });

  // Integration mutations - these are placeholders until real integrations are built
  const noop = useMutation({ mutationFn: async (_: any) => { toast({ title: "Info", description: "Cette intégration sera disponible prochainement" }); } });

  const createEmailCampaign = useMutation({
    mutationFn: async (campaignData: any) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('marketing_campaigns')
        .insert({ name: campaignData.name, user_id: user.id, status: 'draft' }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      toast({ title: "Campagne email créée" });
    },
  });

  const syncCampaignPerformance = useMutation({
    mutationFn: async () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      toast({ title: "Données synchronisées" });
    },
  });

  return {
    campaigns, isLoadingCampaigns, error,
    connectMailchimp: noop.mutate, connectKlaviyo: noop.mutate,
    connectGoogleAds: noop.mutate, connectFacebookAds: noop.mutate,
    createEmailCampaign: createEmailCampaign.mutate,
    createGoogleAdsCampaign: noop.mutate, createFacebookAdsCampaign: noop.mutate,
    syncCampaignPerformance: syncCampaignPerformance.mutate,
    isConnectingMailchimp: false, isConnectingKlaviyo: false,
    isConnectingGoogleAds: false, isConnectingFacebookAds: false,
    isCreatingEmailCampaign: createEmailCampaign.isPending,
    isCreatingGoogleAdsCampaign: false, isCreatingFacebookAdsCampaign: false,
    isSyncingPerformance: syncCampaignPerformance.isPending,
  };
};
