/**
 * Marketing and CRM types
 */

import { BaseEntity, UserEntity, Status } from './common'

export interface CRMContact extends UserEntity {
  external_id?: string
  name: string
  email: string
  phone?: string
  company?: string
  position?: string
  tags?: string[]
  lead_score?: number
  status?: Status
  lifecycle_stage?: 'subscriber' | 'lead' | 'marketing_qualified_lead' | 'sales_qualified_lead' | 'opportunity' | 'customer' | 'evangelist' | 'other'
  source?: string
  last_activity_at?: string
  last_contacted_at?: string
  custom_fields?: Record<string, any>
  attribution?: Record<string, any>
}

export interface MarketingCampaign extends UserEntity {
  name: string
  description?: string
  type: 'email' | 'sms' | 'social' | 'ads' | 'retargeting'
  status: 'draft' | 'active' | 'paused' | 'completed'
  budget_total?: number
  budget_spent: number
  scheduled_at?: string
  started_at?: string
  ended_at?: string
  target_audience?: Record<string, any>
  content?: Record<string, any>
  settings?: Record<string, any>
  metrics?: CampaignMetrics
}

export interface CampaignMetrics {
  impressions?: number
  clicks?: number
  conversions?: number
  roas?: number // Return on Ad Spend
  ctr?: number // Click Through Rate
  cpc?: number // Cost Per Click
  cpm?: number // Cost Per Mille
  conversion_rate?: number
  revenue?: number
  spend?: number
}

export interface MarketingSegment extends UserEntity {
  name: string
  description?: string
  criteria: Record<string, any>
  contact_count: number
  last_updated?: string
}

export interface AutomatedCampaign extends UserEntity {
  campaign_name: string
  campaign_type: string
  trigger_type: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  target_criteria: Record<string, any>
  ai_segmentation: Record<string, any>
  content_templates: Record<string, any>
  automation_flow: Array<any>
  performance_goals: Record<string, any>
  current_metrics: Record<string, any>
  ai_optimization_data: Record<string, any>
  execution_schedule: Record<string, any>
  success_metrics: Record<string, any>
  last_executed_at?: string
  next_execution_at?: string
}

export interface MarketingAutomationRule extends UserEntity {
  name: string
  description?: string
  rule_type: string
  trigger_conditions: Record<string, any>
  ai_conditions: Record<string, any>
  actions: Array<any>
  is_active: boolean
  priority: number
  execution_count: number
  success_rate: number
  performance_metrics: Record<string, any>
  last_executed_at?: string
}

export interface MarketingStats {
  totalCampaigns: number
  activeCampaigns: number
  totalBudget: number
  totalSpent: number
  totalSegments: number
  totalContacts: number
  avgROAS: number
  conversionRate: number
  totalImpressions: number
  totalClicks: number
}