import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdAccount {
  id: string;
  user_id: string;
  platform: 'google' | 'facebook' | 'tiktok';
  name: string;
  status: string;
  spend: number;
  clicks: number;
  impressions: number;
  conversions: number;
  last_sync_at: string | null;
  created_at: string;
}

interface AdCampaign {
  id: string;
  user_id: string;
  ad_account_id: string | null;
  name: string;
  platform: string;
  status: string;
  budget: number;
  spend: number;
  clicks: number;
  impressions: number;
  conversions: number;
  ctr: number;
  cpc: number;
  roas: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export function useAdsMarketing() {
  const queryClient = useQueryClient();

  // Fetch ad accounts
  const { data: adAccounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['ad-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AdAccount[];
    },
  });

  // Fetch ad campaigns
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
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

  // Calculate stats
  const stats = {
    totalSpend: adAccounts.reduce((sum, acc) => sum + Number(acc.spend || 0), 0),
    totalClicks: adAccounts.reduce((sum, acc) => sum + (acc.clicks || 0), 0),
    totalImpressions: adAccounts.reduce((sum, acc) => sum + (acc.impressions || 0), 0),
    totalConversions: adAccounts.reduce((sum, acc) => sum + (acc.conversions || 0), 0),
    averageROAS: campaigns.length > 0 
      ? campaigns.reduce((sum, c) => sum + Number(c.roas || 0), 0) / campaigns.length 
      : 0,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    connectedAccounts: adAccounts.filter(a => a.status === 'connected').length
  };

  // Create ad account mutation
  const createAccountMutation = useMutation({
    mutationFn: async (account: Partial<AdAccount>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('ad_accounts')
        .insert({
          user_id: user.id,
          platform: account.platform || 'google',
          name: account.name || `Compte ${account.platform}`,
          status: account.status || 'disconnected',
          spend: 0,
          clicks: 0,
          impressions: 0,
          conversions: 0
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-accounts'] });
      toast.success('Compte publicitaire créé');
    },
    onError: (error) => {
      toast.error('Erreur', { description: error.message });
    }
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (campaign: Partial<AdCampaign>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('ad_campaigns')
        .insert({
          user_id: user.id,
          ad_account_id: campaign.ad_account_id,
          name: campaign.name || 'Nouvelle campagne',
          platform: campaign.platform || 'google',
          status: campaign.status || 'paused',
          budget: campaign.budget || 50,
          spend: 0,
          clicks: 0,
          impressions: 0,
          conversions: 0,
          ctr: 0,
          cpc: 0,
          roas: 0
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-campaigns'] });
      toast.success('Campagne créée');
    },
    onError: (error) => {
      toast.error('Erreur', { description: error.message });
    }
  });

  // Update campaign status
  const updateCampaignStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('ad_campaigns')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-campaigns'] });
      toast.success('Statut mis à jour');
    }
  });

  // Delete campaign
  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ad_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-campaigns'] });
      toast.success('Campagne supprimée');
    }
  });

  // Connect/disconnect account
  const toggleAccountConnectionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('ad_accounts')
        .update({ 
          status, 
          last_sync_at: status === 'connected' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-accounts'] });
      toast.success('Compte mis à jour');
    }
  });

  return {
    adAccounts,
    campaigns,
    stats,
    isLoading: accountsLoading || campaignsLoading,
    createAccount: createAccountMutation.mutate,
    createCampaign: createCampaignMutation.mutate,
    updateCampaignStatus: updateCampaignStatusMutation.mutate,
    deleteCampaign: deleteCampaignMutation.mutate,
    toggleAccountConnection: toggleAccountConnectionMutation.mutate,
    isCreatingAccount: createAccountMutation.isPending,
    isCreatingCampaign: createCampaignMutation.isPending
  };
}
