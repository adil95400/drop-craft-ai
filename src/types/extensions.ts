/**
 * Extension marketplace and SSO types
 */

import { BaseEntity, UserEntity } from './common'

export interface Extension extends BaseEntity {
  name: string
  description: string
  category: string
  downloads: string
  rating: number
  price: string
  verified: boolean
  developer: string
  version: string
  lastUpdated: string
  featured?: boolean
  minPlan?: 'free' | 'pro' | 'ultra_pro'
  icon?: string
  screenshots?: string[]
  permissions?: string[]
  changelog?: string
  supportUrl?: string
  documentationUrl?: string
}

export interface ExtensionReview extends UserEntity {
  extension_id: string
  rating: number
  title?: string
  review?: string
  verified_purchase: boolean
  helpful_count: number
}

export interface ExtensionPurchase extends UserEntity {
  extension_id: string
  price: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  stripe_payment_intent_id?: string
  commission_rate: number
  commission_amount: number
  developer_amount: number
  completed_at?: string
}

export interface DeveloperProfile extends UserEntity {
  developer_name: string
  company_name?: string
  bio?: string
  website?: string
  avatar_url?: string
  verified: boolean
  extensions_count: number
  total_downloads: number
  total_revenue: number
  average_rating: number
  total_reviews: number
  payout_email?: string
  tax_info?: Record<string, any>
}

export interface SSOProvider {
  id: string
  name: string
  type: 'saml' | 'oauth' | 'oidc'
  enabled: boolean
  configuration: Record<string, any>
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface SSOConfiguration {
  providers: SSOProvider[]
  defaultProvider?: string
  autoProvision: boolean
  attributeMapping: Record<string, string>
  groupMapping?: Record<string, string[]>
  sessionTimeout?: number
  enforceSSO: boolean
}

export interface ExtensionData extends UserEntity {
  extension_id: string
  data_type: string
  data_content: Record<string, any>
  status: 'imported' | 'processing' | 'completed' | 'failed'
  quality_score?: number
  ai_enhanced: boolean
  ai_metadata: Record<string, any>
  external_id?: string
  job_id?: string
}

export interface ExtensionJob extends UserEntity {
  extension_id: string
  job_type: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  total_items?: number
  processed_items: number
  success_items: number
  error_items: number
  input_data: Record<string, any>
  output_data: Record<string, any>
  error_details: Array<any>
  started_at?: string
  completed_at?: string
}