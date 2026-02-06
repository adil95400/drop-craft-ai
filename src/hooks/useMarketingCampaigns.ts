import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { shopOptiApi } from '@/services/api/ShopOptiApiClient'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import type { Database } from '@/integrations/supabase/types'

type MarketingCampaign = Database['public']['Tables']['marketing_campaigns']['Row']
type MarketingCampaignInsert = Database['public']['Tables']['marketing_campaigns']['Insert']
type MarketingCampaignUpdate = Database['public']['Tables']['marketing_campaigns']['Update']

export const useMarketingCampaigns = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const {
    data: campaigns = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['marketing-campaigns', user?.id],
    queryFn: async (): Promise<MarketingCampaign[]> => {
      if (!user?.id) return []
      const res = await shopOptiApi.request<MarketingCampaign[]>('/marketing/campaigns')
      return res.data || []
    },
    enabled: !!user?.id
  })

  const createCampaign = useMutation({
    mutationFn: async (campaignData: Omit<MarketingCampaignInsert, 'user_id'>) => {
      const res = await shopOptiApi.request('/marketing/campaigns', { method: 'POST', body: campaignData })
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      toast({ title: "Campagne créée", description: "Votre campagne a été créée avec succès" })
    }
  })

  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...updates }: MarketingCampaignUpdate & { id: string }) => {
      const res = await shopOptiApi.request(`/marketing/campaigns/${id}`, { method: 'PUT', body: updates })
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      toast({ title: "Campagne mise à jour", description: "Les modifications ont été enregistrées" })
    }
  })

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const res = await shopOptiApi.request(`/marketing/campaigns/${id}`, { method: 'DELETE' })
      if (!res.success) throw new Error(res.error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      toast({ title: "Campagne supprimée", description: "La campagne a été supprimée avec succès" })
    }
  })

  return {
    campaigns,
    isLoading,
    error,
    createCampaign: createCampaign.mutate,
    updateCampaign: updateCampaign.mutate,
    deleteCampaign: deleteCampaign.mutate,
    isCreating: createCampaign.isPending,
    isUpdating: updateCampaign.isPending,
    isDeleting: deleteCampaign.isPending
  }
}
