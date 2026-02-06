import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { shopOptiApi } from '@/services/api/ShopOptiApiClient'

export interface MarketingCampaign {
  id: string
  name: string
  description?: string
  type: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  budget?: number
  budget_spent: number
  start_date?: string
  end_date?: string
  metrics?: any
  user_id: string
  created_at: string
  updated_at: string
}

export interface MarketingSegment {
  id: string
  name: string
  description?: string
  criteria: any
  contact_count: number
  is_dynamic?: boolean
  user_id: string
  created_at: string
  updated_at: string
}

export const useMarketing = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['marketing-campaigns'],
    queryFn: async () => {
      const res = await shopOptiApi.request<MarketingCampaign[]>('/marketing/campaigns')
      return res.data || []
    },
  })

  const { data: segments = [], isLoading: isLoadingSegments } = useQuery({
    queryKey: ['marketing-segments'],
    queryFn: async () => {
      const res = await shopOptiApi.request<MarketingSegment[]>('/marketing/segments')
      return res.data || []
    },
  })

  const createCampaign = useMutation({
    mutationFn: async (campaign: Omit<MarketingCampaign, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'budget_spent'>) => {
      const res = await shopOptiApi.request('/marketing/campaigns', { method: 'POST', body: campaign })
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      toast({ title: "Campagne créée", description: "La campagne marketing a été créée avec succès" })
    }
  })

  const updateCampaign = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MarketingCampaign> }) => {
      const res = await shopOptiApi.request(`/marketing/campaigns/${id}`, { method: 'PUT', body: updates })
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      toast({ title: "Campagne mise à jour", description: "La campagne a été mise à jour avec succès" })
    }
  })

  const createSegment = useMutation({
    mutationFn: async (segment: Omit<MarketingSegment, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'contact_count'>) => {
      const res = await shopOptiApi.request('/marketing/segments', { method: 'POST', body: segment })
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-segments'] })
      toast({ title: "Segment créé", description: "Le segment marketing a été créé avec succès" })
    }
  })

  const stats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalBudget: campaigns.reduce((sum, c) => sum + (c.budget || 0), 0),
    totalSpent: campaigns.reduce((sum, c) => sum + c.budget_spent, 0),
    totalSegments: segments.length,
    totalContacts: segments.reduce((sum, s) => sum + s.contact_count, 0)
  }

  return {
    campaigns,
    segments,
    stats,
    isLoading: isLoadingCampaigns || isLoadingSegments,
    createCampaign: createCampaign.mutate,
    updateCampaign: updateCampaign.mutate,
    createSegment: createSegment.mutate,
    isCreatingCampaign: createCampaign.isPending,
    isUpdatingCampaign: updateCampaign.isPending,
    isCreatingSegment: createSegment.isPending
  }
}
