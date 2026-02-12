import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { adsApi } from '@/services/api/client';

export function useAdsMarketing() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: adAccounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['ad-accounts', user?.id],
    queryFn: async () => {
      const resp = await adsApi.listAccounts();
      return resp.items ?? [];
    },
    enabled: !!user?.id,
  });

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['ad-campaigns', user?.id],
    queryFn: async () => {
      const resp = await adsApi.listCampaigns();
      return resp.items ?? [];
    },
    enabled: !!user?.id,
  });

  const stats = {
    totalSpend: adAccounts.reduce((sum: number, acc: any) => sum + Number(acc.spend || 0), 0),
    totalClicks: adAccounts.reduce((sum: number, acc: any) => sum + (acc.clicks || 0), 0),
    totalImpressions: adAccounts.reduce((sum: number, acc: any) => sum + (acc.impressions || 0), 0),
    totalConversions: adAccounts.reduce((sum: number, acc: any) => sum + (acc.conversions || 0), 0),
    averageROAS: campaigns.length > 0 ? campaigns.reduce((sum: number, c: any) => sum + Number(c.roas || 0), 0) / campaigns.length : 0,
    activeCampaigns: campaigns.filter((c: any) => c.status === 'active').length,
    connectedAccounts: adAccounts.filter((a: any) => a.status === 'connected').length,
  };

  const createAccount = useMutation({
    mutationFn: async (account: any) => adsApi.createAccount(account),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ad-accounts'] }); toast.success('Compte publicitaire créé'); },
    onError: (error: Error) => toast.error('Erreur', { description: error.message }),
  });

  const createCampaign = useMutation({
    mutationFn: async (campaign: any) => adsApi.createCampaign(campaign),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ad-campaigns'] }); toast.success('Campagne créée'); },
    onError: (error: Error) => toast.error('Erreur', { description: error.message }),
  });

  const updateCampaignStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => adsApi.updateCampaign(id, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ad-campaigns'] }); toast.success('Statut mis à jour'); },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => adsApi.deleteCampaign(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ad-campaigns'] }); toast.success('Campagne supprimée'); },
  });

  const toggleAccountConnection = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => adsApi.updateAccount(id, { status }),
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
