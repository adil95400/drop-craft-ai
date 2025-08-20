import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export interface MarketingCampaign {
  id: string
  name: string
  description?: string
  type: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  budget_total?: number
  budget_spent: number
  scheduled_at?: string
  started_at?: string
  ended_at?: string
  target_audience?: any
  content?: any
  settings?: any
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
  last_updated?: string
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
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as MarketingCampaign[]
    },
  })

  const { data: segments = [], isLoading: isLoadingSegments } = useQuery({
    queryKey: ['marketing-segments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_segments')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as MarketingSegment[]
    },
  })

  const createCampaign = useMutation({
    mutationFn: async (campaign: Omit<MarketingCampaign, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'budget_spent'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('marketing_campaigns')
        .insert([{ ...campaign, user_id: user.id, budget_spent: 0 }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      toast({
        title: "Campagne créée",
        description: "La campagne marketing a été créée avec succès",
      })
    }
  })

  const updateCampaign = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MarketingCampaign> }) => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      toast({
        title: "Campagne mise à jour",
        description: "La campagne a été mise à jour avec succès",
      })
    }
  })

  const createSegment = useMutation({
    mutationFn: async (segment: Omit<MarketingSegment, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'contact_count'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('marketing_segments')
        .insert([{ ...segment, user_id: user.id, contact_count: 0 }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-segments'] })
      toast({
        title: "Segment créé",
        description: "Le segment marketing a été créé avec succès",
      })
    }
  })

  const stats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalBudget: campaigns.reduce((sum, c) => sum + (c.budget_total || 0), 0),
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