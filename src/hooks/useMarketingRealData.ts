/**
 * Hook pour récupérer les vraies données marketing via FastAPI
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shopOptiApi } from '@/services/api/ShopOptiApiClient';
import { toast } from 'sonner';

export interface Campaign {
  id: string; name: string; type: string; status: 'draft' | 'active' | 'paused' | 'completed'
  budget: number; spent: number; impressions: number; clicks: number; conversions: number
  ctr: number; roas: number; start_date: string | null; end_date: string | null; created_at: string
}

export interface MarketingStats {
  activeCampaigns: number; totalSpend: number; totalConversions: number; avgROAS: number
  totalClicks: number; avgCTR: number; emailsSent: number; openRate: number; isDemo: boolean
}

export function useMarketingCampaigns() {
  return useQuery({
    queryKey: ['marketing-campaigns'],
    queryFn: async (): Promise<Campaign[]> => {
      const res = await shopOptiApi.request<Campaign[]>('/marketing/campaigns')
      return res.data || []
    }
  });
}

export function useMarketingStats() {
  return useQuery({
    queryKey: ['marketing-stats'],
    queryFn: async (): Promise<MarketingStats> => {
      const res = await shopOptiApi.request<MarketingStats>('/marketing/stats')
      return res.data || {
        activeCampaigns: 0, totalSpend: 0, totalConversions: 0, avgROAS: 0,
        totalClicks: 0, avgCTR: 0, emailsSent: 0, openRate: 0, isDemo: true
      }
    }
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; platform: string; budget: number; start_date?: string; end_date?: string }) => {
      const res = await shopOptiApi.request('/marketing/campaigns', { method: 'POST', body: data })
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['marketing-stats'] })
      toast.success('Campagne créée avec succès')
    },
    onError: (error: any) => { toast.error(`Erreur: ${error.message}`) }
  });
}

export function useUpdateCampaignStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Campaign['status'] }) => {
      const res = await shopOptiApi.request(`/marketing/campaigns/${id}/status`, { method: 'PUT', body: { status } })
      if (!res.success) throw new Error(res.error)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['marketing-stats'] })
      toast.success(`Campagne ${variables.status === 'active' ? 'activée' : 'mise en pause'}`)
    },
    onError: (error: any) => { toast.error(`Erreur: ${error.message}`) }
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await shopOptiApi.request(`/marketing/campaigns/${id}`, { method: 'DELETE' })
      if (!res.success) throw new Error(res.error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['marketing-stats'] })
      toast.success('Campagne supprimée')
    },
    onError: (error: any) => { toast.error(`Erreur: ${error.message}`) }
  });
}
