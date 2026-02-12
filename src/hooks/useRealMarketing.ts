import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { marketingApi } from '@/services/api/client';

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
      const res = await marketingApi.listCampaigns({ per_page: 100 });
      return (res.items || []) as MarketingCampaign[];
    },
    enabled: !!user?.id,
  });

  const integrationNotConfigured = useMutation({
    mutationFn: async (_: any) => {
      throw new Error('Integration non configurée. Configurez vos identifiants dans Paramètres > Intégrations.');
    },
    onError: (error: Error) => {
      toast({ title: "Integration requise", description: error.message, variant: "destructive" });
    },
  });

  const createEmailCampaign = useMutation({
    mutationFn: async (campaignData: any) => {
      return await marketingApi.createCampaign({ name: campaignData.name, status: 'draft' });
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
    connectMailchimp: integrationNotConfigured.mutate, connectKlaviyo: integrationNotConfigured.mutate,
    connectGoogleAds: integrationNotConfigured.mutate, connectFacebookAds: integrationNotConfigured.mutate,
    createEmailCampaign: createEmailCampaign.mutate,
    createGoogleAdsCampaign: integrationNotConfigured.mutate, createFacebookAdsCampaign: integrationNotConfigured.mutate,
    syncCampaignPerformance: syncCampaignPerformance.mutate,
    isConnectingMailchimp: false, isConnectingKlaviyo: false,
    isConnectingGoogleAds: false, isConnectingFacebookAds: false,
    isCreatingEmailCampaign: createEmailCampaign.isPending,
    isCreatingGoogleAdsCampaign: false, isCreatingFacebookAdsCampaign: false,
    isSyncingPerformance: syncCampaignPerformance.isPending,
  };
};
