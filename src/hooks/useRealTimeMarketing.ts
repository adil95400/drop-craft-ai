import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface RealTimeMarketingData {
  campaigns: MarketingCampaign[]
  segments: MarketingSegment[]
  contacts: CRMContact[]
  automationJobs: AIOptimizationJob[]
  stats: MarketingStats
  isLoading: boolean
}

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

export interface CRMContact {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  position?: string
  status: string
  lifecycle_stage: string
  lead_score: number
  source?: string
  tags?: string[]
  custom_fields?: any
  attribution?: any
  user_id: string
  created_at: string
  updated_at: string
}

export interface AIOptimizationJob {
  id: string
  job_type: string
  status: string
  progress: number
  input_data: any
  output_data?: any
  started_at?: string
  completed_at?: string
  error_message?: string
  user_id: string
  created_at: string
}

export interface MarketingStats {
  totalCampaigns: number
  activeCampaigns: number
  totalBudget: number
  totalSpent: number
  totalContacts: number
  totalSegments: number
  avgROAS: number
  conversionRate: number
  totalImpressions: number
  totalClicks: number
}

export const useRealTimeMarketing = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [lastActivity, setLastActivity] = useState<Date>(new Date())

  // Fetch campaigns
  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['marketing-campaigns-realtime'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as MarketingCampaign[]
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Fetch segments
  const { data: segments = [], isLoading: isLoadingSegments } = useQuery({
    queryKey: ['marketing-segments-realtime'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_segments')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as MarketingSegment[]
    },
    refetchInterval: 45000,
  })

  // Fetch contacts
  const { data: contacts = [], isLoading: isLoadingContacts } = useQuery({
    queryKey: ['crm-contacts-realtime'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_contacts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      return data as CRMContact[]
    },
    refetchInterval: 60000,
  })

  // Fetch AI optimization jobs
  const { data: automationJobs = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: ['ai-optimization-jobs-realtime'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_optimization_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data as AIOptimizationJob[]
    },
    refetchInterval: 15000,
  })

  // Calculate stats
  const stats: MarketingStats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalBudget: campaigns.reduce((sum, c) => sum + (c.budget_total || 0), 0),
    totalSpent: campaigns.reduce((sum, c) => sum + c.budget_spent, 0),
    totalContacts: contacts.length,
    totalSegments: segments.length,
    avgROAS: campaigns.length > 0 ? 
      campaigns.reduce((sum, c) => {
        const metrics = c.metrics as any
        return sum + (metrics?.roas || 0)
      }, 0) / campaigns.length : 0,
    conversionRate: campaigns.length > 0 ?
      campaigns.reduce((sum, c) => {
        const metrics = c.metrics as any
        return sum + (metrics?.conversion_rate || 0)
      }, 0) / campaigns.length : 0,
    totalImpressions: campaigns.reduce((sum, c) => {
      const metrics = c.metrics as any
      return sum + (metrics?.impressions || 0)
    }, 0),
    totalClicks: campaigns.reduce((sum, c) => {
      const metrics = c.metrics as any
      return sum + (metrics?.clicks || 0)
    }, 0)
  }

  // Set up real-time subscriptions
  useEffect(() => {
    const campaignsChannel = supabase
      .channel('marketing-campaigns-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marketing_campaigns'
        },
        (payload) => {
          console.log('Campaign change detected:', payload)
          setLastActivity(new Date())
          queryClient.invalidateQueries({ queryKey: ['marketing-campaigns-realtime'] })
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: "Nouvelle campagne créée",
              description: `Une nouvelle campagne marketing a été ajoutée`,
            })
          }
        }
      )
      .subscribe()

    const segmentsChannel = supabase
      .channel('marketing-segments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marketing_segments'
        },
        () => {
          setLastActivity(new Date())
          queryClient.invalidateQueries({ queryKey: ['marketing-segments-realtime'] })
        }
      )
      .subscribe()

    const contactsChannel = supabase
      .channel('crm-contacts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crm_contacts'
        },
        (payload) => {
          setLastActivity(new Date())
          queryClient.invalidateQueries({ queryKey: ['crm-contacts-realtime'] })
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: "Nouveau contact CRM",
              description: `Un nouveau contact a été ajouté au système`,
            })
          }
        }
      )
      .subscribe()

    const automationChannel = supabase
      .channel('ai-jobs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_optimization_jobs'
        },
        (payload) => {
          setLastActivity(new Date())
          queryClient.invalidateQueries({ queryKey: ['ai-optimization-jobs-realtime'] })
          
          const jobData = payload.new as any
          if (payload.eventType === 'UPDATE' && jobData?.status === 'completed') {
            toast({
              title: "Optimisation IA terminée",
              description: `Le job ${jobData.job_type} est maintenant terminé`,
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(campaignsChannel)
      supabase.removeChannel(segmentsChannel)  
      supabase.removeChannel(contactsChannel)
      supabase.removeChannel(automationChannel)
    }
  }, [queryClient, toast])

  // Auto-refresh function
  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['marketing-campaigns-realtime'] })
    queryClient.invalidateQueries({ queryKey: ['marketing-segments-realtime'] })
    queryClient.invalidateQueries({ queryKey: ['crm-contacts-realtime'] })
    queryClient.invalidateQueries({ queryKey: ['ai-optimization-jobs-realtime'] })
    setLastActivity(new Date())
    toast({
      title: "Données actualisées",
      description: "Les données marketing ont été synchronisées",
    })
  }

  const isLoading = isLoadingCampaigns || isLoadingSegments || isLoadingContacts || isLoadingJobs

  return {
    campaigns,
    segments,
    contacts,
    automationJobs,
    stats,
    isLoading,
    lastActivity,
    refreshData
  } as RealTimeMarketingData & { lastActivity: Date; refreshData: () => void }
}