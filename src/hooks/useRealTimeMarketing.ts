import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { shopOptiApi } from '@/services/api/ShopOptiApiClient'
import { useToast } from '@/hooks/use-toast'

export interface RealTimeMarketingData {
  campaigns: MarketingCampaign[]; segments: MarketingSegment[]; contacts: CRMContact[]
  automationJobs: AIOptimizationJob[]; stats: MarketingStats; isLoading: boolean
}

export interface MarketingCampaign {
  id: string; name: string; description?: string; type: string
  status: 'draft' | 'active' | 'paused' | 'completed'; budget_total?: number; budget_spent: number
  scheduled_at?: string; started_at?: string; ended_at?: string; target_audience?: any; content?: any
  settings?: any; metrics?: any; user_id: string; created_at: string; updated_at: string
}

export interface MarketingSegment {
  id: string; name: string; description?: string; criteria: any; contact_count: number
  last_updated?: string; user_id: string; created_at: string; updated_at: string
}

export interface CRMContact {
  id: string; name: string; email: string; phone?: string; company?: string; position?: string
  status: string; lifecycle_stage: string; lead_score: number; source?: string; tags?: string[]
  custom_fields?: any; attribution?: any; user_id: string; created_at: string; updated_at: string
}

export interface AIOptimizationJob {
  id: string; job_type: string; status: string; progress: number; input_data: any
  output_data?: any; started_at?: string; completed_at?: string; error_message?: string
  user_id: string; created_at: string
}

export interface MarketingStats {
  totalCampaigns: number; activeCampaigns: number; totalBudget: number; totalSpent: number
  totalContacts: number; totalSegments: number; avgROAS: number; conversionRate: number
  totalImpressions: number; totalClicks: number
}

export const useRealTimeMarketing = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [lastActivity, setLastActivity] = useState<Date>(new Date())

  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['marketing-campaigns-realtime'],
    queryFn: async () => {
      const res = await shopOptiApi.request<MarketingCampaign[]>('/marketing/campaigns')
      return res.data || []
    },
    refetchInterval: 30000,
  })

  const { data: segments = [], isLoading: isLoadingSegments } = useQuery({
    queryKey: ['marketing-segments-realtime'],
    queryFn: async () => {
      const res = await shopOptiApi.request<MarketingSegment[]>('/marketing/segments')
      return res.data || []
    },
    refetchInterval: 45000,
  })

  const { data: contacts = [], isLoading: isLoadingContacts } = useQuery({
    queryKey: ['crm-contacts-realtime'],
    queryFn: async () => {
      const res = await shopOptiApi.request<CRMContact[]>('/crm/contacts')
      return res.data || []
    },
    refetchInterval: 60000,
  })

  const { data: automationJobs = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: ['ai-optimization-jobs-realtime'],
    queryFn: async () => {
      const res = await shopOptiApi.request<AIOptimizationJob[]>('/marketing/optimization-jobs')
      return res.data || []
    },
    refetchInterval: 15000,
  })

  const stats: MarketingStats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalBudget: campaigns.reduce((sum, c) => sum + (c.budget_total || 0), 0),
    totalSpent: campaigns.reduce((sum, c) => sum + c.budget_spent, 0),
    totalContacts: contacts.length,
    totalSegments: segments.length,
    avgROAS: campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + ((c.metrics as any)?.roas || 0), 0) / campaigns.length : 0,
    conversionRate: campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + ((c.metrics as any)?.conversion_rate || 0), 0) / campaigns.length : 0,
    totalImpressions: campaigns.reduce((sum, c) => sum + ((c.metrics as any)?.impressions || 0), 0),
    totalClicks: campaigns.reduce((sum, c) => sum + ((c.metrics as any)?.clicks || 0), 0)
  }

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['marketing-campaigns-realtime'] })
    queryClient.invalidateQueries({ queryKey: ['marketing-segments-realtime'] })
    queryClient.invalidateQueries({ queryKey: ['crm-contacts-realtime'] })
    queryClient.invalidateQueries({ queryKey: ['ai-optimization-jobs-realtime'] })
    setLastActivity(new Date())
    toast({ title: "Données actualisées", description: "Les données marketing ont été synchronisées" })
  }

  const isLoading = isLoadingCampaigns || isLoadingSegments || isLoadingContacts || isLoadingJobs

  return {
    campaigns, segments, contacts, automationJobs, stats, isLoading, lastActivity, refreshData
  } as RealTimeMarketingData & { lastActivity: Date; refreshData: () => void }
}
