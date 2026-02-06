import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shopOptiApi } from '@/services/api/ShopOptiApiClient';
import { toast } from 'sonner';

interface AdAccount {
  id: string; user_id: string; platform: 'google' | 'facebook' | 'tiktok'; name: string
  status: string; spend: number; clicks: number; impressions: number; conversions: number
  last_sync_at: string | null; created_at: string
}

interface AdCampaign {
  id: string; user_id: string; ad_account_id: string | null; name: string; platform: string
  status: string; budget: number; spend: number; clicks: number; impressions: number
  conversions: number; ctr: number; cpc: number; roas: number
  start_date: string | null; end_date: string | null; created_at: string
}

export function useAdsMarketing() {
  const queryClient = useQueryClient();

  const { data: adAccounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['ad-accounts'],
    queryFn: async () => {
      const res = await shopOptiApi.request<AdAccount[]>('/marketing/ad-accounts')
      return res.data || []
    },
  });

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['ad-campaigns'],
    queryFn: async () => {
      const res = await shopOptiApi.request<AdCampaign[]>('/marketing/ad-campaigns')
      return res.data || []
    },
  });

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

  const createAccountMutation = useMutation({
    mutationFn: async (account: Partial<AdAccount>) => {
      const res = await shopOptiApi.request('/marketing/ad-accounts', { method: 'POST', body: account })
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ad-accounts'] }); toast.success('Compte publicitaire créé') },
    onError: (error) => { toast.error('Erreur', { description: error.message }) }
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (campaign: Partial<AdCampaign>) => {
      const res = await shopOptiApi.request('/marketing/ad-campaigns', { method: 'POST', body: campaign })
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ad-campaigns'] }); toast.success('Campagne créée') },
    onError: (error) => { toast.error('Erreur', { description: error.message }) }
  });

  const updateCampaignStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await shopOptiApi.request(`/marketing/ad-campaigns/${id}/status`, { method: 'PUT', body: { status } })
      if (!res.success) throw new Error(res.error)
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ad-campaigns'] }); toast.success('Statut mis à jour') }
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await shopOptiApi.request(`/marketing/ad-campaigns/${id}`, { method: 'DELETE' })
      if (!res.success) throw new Error(res.error)
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ad-campaigns'] }); toast.success('Campagne supprimée') }
  });

  const toggleAccountConnectionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await shopOptiApi.request(`/marketing/ad-accounts/${id}/toggle`, { method: 'PUT', body: { status } })
      if (!res.success) throw new Error(res.error)
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ad-accounts'] }); toast.success('Compte mis à jour') }
  });

  return {
    adAccounts, campaigns, stats, isLoading: accountsLoading || campaignsLoading,
    createAccount: createAccountMutation.mutate,
    createCampaign: createCampaignMutation.mutate,
    updateCampaignStatus: updateCampaignStatusMutation.mutate,
    deleteCampaign: deleteCampaignMutation.mutate,
    toggleAccountConnection: toggleAccountConnectionMutation.mutate,
    isCreatingAccount: createAccountMutation.isPending,
    isCreatingCampaign: createCampaignMutation.isPending
  };
}
