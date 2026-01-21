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

  // Fetch real campaigns from ad_campaigns table
  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['marketing-campaigns-realtime'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_campaigns')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching campaigns:', error)
        return []
      }

      return (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        description: '',
        type: c.platform || 'ads',
        status: c.status as 'draft' | 'active' | 'paused' | 'completed',
        budget_total: c.budget || 0,
        budget_spent: c.spend || 0,
        user_id: c.user_id,
        created_at: c.created_at,
        updated_at: c.updated_at,
        metrics: {
          impressions: c.impressions || 0,
          clicks: c.clicks || 0,
          conversions: c.conversions || 0,
          roas: c.roas || 0,
          conversion_rate: c.ctr || 0
        }
      })) as MarketingCampaign[]
    },
    refetchInterval: 30000,
  })

  // Fetch segments from customer_segments table
  const { data: segments = [], isLoading: isLoadingSegments } = useQuery({
    queryKey: ['marketing-segments-realtime'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_segments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) return []
      return (data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        criteria: s.rules || {},
        contact_count: s.customer_count || 0,
        user_id: s.user_id,
        created_at: s.created_at,
        updated_at: s.updated_at
      })) as MarketingSegment[]
    },
    refetchInterval: 45000,
  })

  // Fetch contacts from customers table
  const { data: contacts = [], isLoading: isLoadingContacts } = useQuery({
    queryKey: ['crm-contacts-realtime'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, first_name, last_name, email, phone, status, total_orders, created_at, updated_at, user_id')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) return []
      return (data || []).map((c: any) => ({
        id: c.id,
        name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Client',
        email: c.email || '',
        phone: c.phone,
        status: c.status || 'active',
        lifecycle_stage: c.total_orders > 0 ? 'customer' : 'lead',
        lead_score: Math.min(100, (c.total_orders || 0) * 20 + 30),
        user_id: c.user_id,
        created_at: c.created_at,
        updated_at: c.updated_at
      })) as CRMContact[]
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

      if (error) return []
      return (data || []).map((job: any) => ({
        id: job.id,
        job_type: job.job_type,
        status: job.status,
        progress: job.metrics?.progress || (job.status === 'completed' ? 100 : 50),
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

  // Calculate stats from real data
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
