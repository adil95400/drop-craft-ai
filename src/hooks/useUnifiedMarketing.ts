import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { shopOptiApi } from '@/services/api/ShopOptiApiClient'

export interface MarketingCampaign {
  id: string; name: string; description?: string; type: 'email' | 'sms' | 'social' | 'ads' | 'retargeting'
  status: 'draft' | 'active' | 'paused' | 'completed'; budget_total?: number; budget_spent: number
  scheduled_at?: string; started_at?: string; ended_at?: string; target_audience?: any; content?: any
  settings?: any; metrics?: any; user_id: string; created_at: string; updated_at: string
}

export interface MarketingSegment {
  id: string; name: string; description?: string; criteria: any; contact_count: number
  last_updated?: string; user_id: string; created_at: string; updated_at: string
}

export interface CRMContact {
  id: string; external_id?: string; name: string; email: string; phone?: string; company?: string
  position?: string; tags?: string[]; lead_score?: number; status?: string; lifecycle_stage?: string
  source?: string; user_id: string; created_at: string; last_activity_at?: string; updated_at: string
  last_contacted_at?: string; custom_fields?: any; attribution?: any
}

export const useUnifiedMarketing = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['marketing-campaigns-unified'],
    queryFn: async () => {
      const res = await shopOptiApi.request<MarketingCampaign[]>('/marketing/campaigns')
      return res.data || []
    },
  })

  const { data: segments = [], isLoading: isLoadingSegments } = useQuery({
    queryKey: ['marketing-segments-unified'],
    queryFn: async () => {
      const res = await shopOptiApi.request<MarketingSegment[]>('/marketing/segments')
      return res.data || []
    },
  })

  const { data: contacts = [], isLoading: isLoadingContacts } = useQuery({
    queryKey: ['crm-contacts-unified'],
    queryFn: async () => {
      const res = await shopOptiApi.request<CRMContact[]>('/crm/contacts')
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
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns-unified'] })
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
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns-unified'] })
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
      queryClient.invalidateQueries({ queryKey: ['marketing-segments-unified'] })
      toast({ title: "Segment créé", description: "Le segment marketing a été créé avec succès" })
    }
  })

  const createContact = useMutation({
    mutationFn: async (contact: Omit<CRMContact, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const res = await shopOptiApi.request('/crm/contacts', { method: 'POST', body: contact })
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-contacts-unified'] })
      toast({ title: "Contact créé", description: "Le contact CRM a été créé avec succès" })
    }
  })

  const stats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalBudget: campaigns.reduce((sum, c) => sum + (c.budget_total || 0), 0),
    totalSpent: campaigns.reduce((sum, c) => sum + c.budget_spent, 0),
    totalSegments: segments.length,
    totalContacts: contacts.length,
    avgROAS: campaigns.reduce((sum, c) => sum + ((c.metrics as any)?.roas || 0), 0) / Math.max(campaigns.length, 1),
    conversionRate: campaigns.reduce((sum, c) => {
      const m = c.metrics as any || {}
      return sum + ((m.conversions || 0) / (m.clicks || 1))
    }, 0) / Math.max(campaigns.length, 1),
    totalImpressions: campaigns.reduce((sum, c) => sum + ((c.metrics as any)?.impressions || 0), 0),
    totalClicks: campaigns.reduce((sum, c) => sum + ((c.metrics as any)?.clicks || 0), 0)
  }

  return {
    campaigns, segments, contacts, stats,
    isLoading: isLoadingCampaigns || isLoadingSegments || isLoadingContacts,
    isLoadingCampaigns, isLoadingSegments, isLoadingContacts,
    createCampaign: createCampaign.mutate,
    updateCampaign: updateCampaign.mutate,
    createSegment: createSegment.mutate,
    createContact: createContact.mutate,
    isCreatingCampaign: createCampaign.isPending,
    isUpdatingCampaign: updateCampaign.isPending,
    isCreatingSegment: createSegment.isPending,
    isCreatingContact: createContact.isPending
  }
}
