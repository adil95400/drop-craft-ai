import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

// Unified marketing interfaces
export interface MarketingCampaign {
  id: string
  name: string
  description?: string
  type: 'email' | 'sms' | 'social' | 'ads' | 'retargeting'
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

export interface CRMContact {
  id: string
  external_id?: string
  name: string
  email: string
  phone?: string
  company?: string
  position?: string
  tags?: string[]
  lead_score?: number
  status?: string
  lifecycle_stage?: string
  source?: string
  user_id: string
  created_at: string
  last_activity_at?: string
  updated_at: string
  last_contacted_at?: string
  custom_fields?: any
  attribution?: any
}

export const useUnifiedMarketing = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch marketing campaigns
  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['marketing-campaigns-unified'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as MarketingCampaign[]
    },
  })

  // Fetch marketing segments
  const { data: segments = [], isLoading: isLoadingSegments } = useQuery({
    queryKey: ['marketing-segments-unified'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_segments')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as MarketingSegment[]
    },
  })

  // Fetch CRM contacts
  const { data: contacts = [], isLoading: isLoadingContacts } = useQuery({
    queryKey: ['crm-contacts-unified'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_contacts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as CRMContact[]
    },
  })

  // Create campaign mutation
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
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns-unified'] })
      toast({
        title: "Campagne créée",
        description: "La campagne marketing a été créée avec succès",
      })
    }
  })

  // Update campaign mutation
  const updateCampaign = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MarketingCampaign> }) => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns-unified'] })
      toast({
        title: "Campagne mise à jour",
        description: "La campagne a été mise à jour avec succès",
      })
    }
  })

  // Create segment mutation
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
      queryClient.invalidateQueries({ queryKey: ['marketing-segments-unified'] })
      toast({
        title: "Segment créé",
        description: "Le segment marketing a été créé avec succès",
      })
    }
  })

  // Create contact mutation
  const createContact = useMutation({
    mutationFn: async (contact: Omit<CRMContact, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('crm_contacts')
        .insert([{ ...contact, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-contacts-unified'] })
      toast({
        title: "Contact créé",
        description: "Le contact CRM a été créé avec succès",
      })
    }
  })

  // Calculate marketing stats
  const stats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalBudget: campaigns.reduce((sum, c) => sum + (c.budget_total || 0), 0),
    totalSpent: campaigns.reduce((sum, c) => sum + c.budget_spent, 0),
    totalSegments: segments.length,
    totalContacts: contacts.reduce((sum, s) => sum + segments.find(seg => seg.id === s.id)?.contact_count || 0, 0) || contacts.length,
    
    // Performance metrics
    avgROAS: campaigns.reduce((sum, c) => {
      const metrics = c.metrics as any || {}
      const roas = metrics.roas || 0
      return sum + roas
    }, 0) / Math.max(campaigns.length, 1),
    
    conversionRate: campaigns.reduce((sum, c) => {
      const metrics = c.metrics as any || {}
      const conversions = metrics.conversions || 0
      const clicks = metrics.clicks || 1
      return sum + (conversions / clicks)
    }, 0) / Math.max(campaigns.length, 1),
    
    totalImpressions: campaigns.reduce((sum, c) => {
      const metrics = c.metrics as any || {}
      return sum + (metrics.impressions || 0)
    }, 0),
    
    totalClicks: campaigns.reduce((sum, c) => {
      const metrics = c.metrics as any || {}
      return sum + (metrics.clicks || 0)
    }, 0)
  }

  return {
    // Data
    campaigns,
    segments,
    contacts,
    stats,
    
    // Loading states
    isLoading: isLoadingCampaigns || isLoadingSegments || isLoadingContacts,
    isLoadingCampaigns,
    isLoadingSegments,
    isLoadingContacts,
    
    // Mutations
    createCampaign: createCampaign.mutate,
    updateCampaign: updateCampaign.mutate,
    createSegment: createSegment.mutate,
    createContact: createContact.mutate,
    
    // Mutation states
    isCreatingCampaign: createCampaign.isPending,
    isUpdatingCampaign: updateCampaign.isPending,
    isCreatingSegment: createSegment.isPending,
    isCreatingContact: createContact.isPending
  }
}