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

// Mock data for marketing campaigns
const mockCampaigns: MarketingCampaign[] = [
  {
    id: '1',
    name: 'Campagne Email Été 2024',
    description: 'Campagne promotionnelle estivale',
    type: 'email',
    status: 'active',
    budget_total: 5000,
    budget_spent: 2340,
    user_id: 'mock',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metrics: { impressions: 15000, clicks: 450, conversions: 23, roas: 3.2, conversion_rate: 5.1 }
  },
  {
    id: '2',
    name: 'Retargeting Clients Inactifs',
    description: 'Réengagement des clients dormants',
    type: 'ads',
    status: 'paused',
    budget_total: 2000,
    budget_spent: 890,
    user_id: 'mock',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metrics: { impressions: 8000, clicks: 240, conversions: 12, roas: 2.8, conversion_rate: 5.0 }
  }
]

const mockSegments: MarketingSegment[] = [
  {
    id: '1',
    name: 'Clients Premium',
    description: 'Clients avec panier moyen > 100€',
    criteria: { avg_order_value: { gt: 100 } },
    contact_count: 156,
    user_id: 'mock',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Nouveaux Inscrits',
    description: 'Inscrits dans les 30 derniers jours',
    criteria: { created_days_ago: { lt: 30 } },
    contact_count: 89,
    user_id: 'mock',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

const mockContacts: CRMContact[] = [
  {
    id: '1',
    name: 'Jean Dupont',
    email: 'jean.dupont@example.com',
    phone: '+33612345678',
    company: 'Tech Corp',
    position: 'Directeur Marketing',
    status: 'active',
    lifecycle_stage: 'customer',
    lead_score: 85,
    source: 'website',
    user_id: 'mock',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Marie Martin',
    email: 'marie.martin@example.com',
    company: 'Startup SAS',
    position: 'CEO',
    status: 'active',
    lifecycle_stage: 'lead',
    lead_score: 65,
    source: 'social_media',
    user_id: 'mock',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export const useRealTimeMarketing = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [lastActivity, setLastActivity] = useState<Date>(new Date())

  // Use mock campaigns
  const { data: campaigns = mockCampaigns, isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['marketing-campaigns-realtime'],
    queryFn: async () => {
      return mockCampaigns
    },
    refetchInterval: 30000,
  })

  // Use mock segments
  const { data: segments = mockSegments, isLoading: isLoadingSegments } = useQuery({
    queryKey: ['marketing-segments-realtime'],
    queryFn: async () => {
      return mockSegments
    },
    refetchInterval: 45000,
  })

  // Use mock contacts
  const { data: contacts = mockContacts, isLoading: isLoadingContacts } = useQuery({
    queryKey: ['crm-contacts-realtime'],
    queryFn: async () => {
      return mockContacts
    },
    refetchInterval: 60000,
  })

  // Fetch AI optimization jobs (this table exists)
  const { data: automationJobs = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: ['ai-optimization-jobs-realtime'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_optimization_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) return []
      
      // Transform to match interface with progress field
      return (data || []).map((job: any) => ({
        id: job.id,
        job_type: job.job_type,
        status: job.status,
        progress: job.metrics?.progress || (job.status === 'completed' ? 100 : job.status === 'pending' ? 0 : 50),
        input_data: job.input_data,
        output_data: job.output_data,
        started_at: job.started_at,
        completed_at: job.completed_at,
        error_message: job.error_message,
        user_id: job.user_id,
        created_at: job.created_at
      })) as AIOptimizationJob[]
    },
    refetchInterval: 15000,
  })

  // Calculate stats from mock data
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
