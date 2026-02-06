import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function useAdsMarketing() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: adAccounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['ad-accounts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.from('ad_accounts')
        .select('*').eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['ad-campaigns', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.from('ad_campaigns')
        .select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const stats = {
    totalSpend: adAccounts.reduce((sum, acc) => sum + Number(acc.spend || 0), 0),
    totalClicks: adAccounts.reduce((sum, acc) => sum + (acc.clicks || 0), 0),
    totalImpressions: adAccounts.reduce((sum, acc) => sum + (acc.impressions || 0), 0),
    totalConversions: adAccounts.reduce((sum, acc) => sum + (acc.conversions || 0), 0),
    averageROAS: campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + Number(c.roas || 0), 0) / campaigns.length : 0,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    connectedAccounts: adAccounts.filter(a => a.status === 'connected').length,
  };

  const createAccount = useMutation({
    mutationFn: async (account: any) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('ad_accounts')
        .insert({ ...account, user_id: user.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ad-accounts'] }); toast.success('Compte publicitaire créé'); },
    onError: (error) => toast.error('Erreur', { description: error.message }),
  });

  const createCampaign = useMutation({
    mutationFn: async (campaign: any) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('ad_campaigns')
        .insert({ ...campaign, user_id: user.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ad-campaigns'] }); toast.success('Campagne créée'); },
    onError: (error) => toast.error('Erreur', { description: error.message }),
  });

  const updateCampaignStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('ad_campaigns').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ad-campaigns'] }); toast.success('Statut mis à jour'); },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ad_campaigns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ad-campaigns'] }); toast.success('Campagne supprimée'); },
  });

  const toggleAccountConnection = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('ad_accounts').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ad-accounts'] }); toast.success('Compte mis à jour'); },
  });

  return {
    adAccounts, campaigns, stats, isLoading: accountsLoading || campaignsLoading,
    createAccount: createAccount.mutate, createCampaign: createCampaign.mutate,
    updateCampaignStatus: updateCampaignStatus.mutate, deleteCampaign: deleteCampaign.mutate,
    toggleAccountConnection: toggleAccountConnection.mutate,
    isCreatingAccount: createAccount.isPending, isCreatingCampaign: createCampaign.isPending,
  };
}
