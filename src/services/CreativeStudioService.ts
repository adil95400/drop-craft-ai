import { supabase } from '@/integrations/supabase/client'

export interface CreativeAsset {
  id: string
  name: string
  type: 'banner' | 'social_post' | 'product_image' | 'video' | 'email_template'
  url: string
  thumbnail_url?: string
  brand_colors?: string[]
  dimensions?: { width: number; height: number }
  created_at: string
  campaign_id?: string
}

export interface MarketingCampaign {
  id: string
  name: string
  type: 'social' | 'email' | 'ads' | 'seo'
  status: 'draft' | 'active' | 'paused' | 'completed'
  budget?: number
  target_audience?: string
  start_date?: string
  end_date?: string
  performance_metrics?: {
    impressions?: number
    clicks?: number
    conversions?: number
    roi?: number
  }
}

export interface DesignTemplate {
  id: string
  name: string
  category: string
  preview_url: string
  canva_template_id?: string
  is_premium: boolean
}

export class CreativeStudioService {
  private static instance: CreativeStudioService

  public static getInstance(): CreativeStudioService {
    if (!CreativeStudioService.instance) {
      CreativeStudioService.instance = new CreativeStudioService()
    }
    return CreativeStudioService.instance
  }

  async getCreativeAssets(): Promise<CreativeAsset[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Using activity_logs as fallback for creative assets
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('action', 'creative_asset')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      return (data || []).map((log: any) => ({
        id: log.id,
        name: log.metadata?.name || 'Creative Asset',
        type: log.metadata?.type || 'banner',
        url: log.metadata?.url || '',
        thumbnail_url: log.metadata?.thumbnail_url,
        brand_colors: log.metadata?.brand_colors || ['#3B82F6', '#EF4444'],
        dimensions: log.metadata?.dimensions,
        created_at: log.created_at,
        campaign_id: log.metadata?.campaign_id
      }))
    } catch (error) {
      console.error('Error fetching creative assets:', error)
      return []
    }
  }

  async createAsset(asset: Omit<CreativeAsset, 'id' | 'created_at'>): Promise<CreativeAsset> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('activity_logs')
        .insert([{
          user_id: user.id,
          action: 'creative_asset',
          entity_type: 'creative_asset',
          entity_id: crypto.randomUUID(),
          metadata: asset,
          description: `Created ${asset.type}: ${asset.name}`
        }])
        .select()
        .maybeSingle()

      if (error) throw error

      return {
        id: data.entity_id,
        created_at: data.created_at,
        ...asset
      }
    } catch (error) {
      console.error('Error creating creative asset:', error)
      throw error
    }
  }

  async getMarketingCampaigns(): Promise<MarketingCampaign[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Using activity_logs as fallback for campaigns
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('action', 'marketing_campaign')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      return (data || []).map((log: any) => ({
        id: log.entity_id,
        name: log.metadata?.name || 'Marketing Campaign',
        type: log.metadata?.type || 'social',
        status: log.metadata?.status || 'draft',
        budget: log.metadata?.budget,
        target_audience: log.metadata?.target_audience,
        start_date: log.metadata?.start_date,
        end_date: log.metadata?.end_date,
        performance_metrics: log.metadata?.performance_metrics || {}
      }))
    } catch (error) {
      console.error('Error fetching marketing campaigns:', error)
      return []
    }
  }

  async createCampaign(campaign: Omit<MarketingCampaign, 'id'>): Promise<MarketingCampaign> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const campaignId = crypto.randomUUID()

      const { data, error } = await supabase
        .from('activity_logs')
        .insert([{
          user_id: user.id,
          action: 'marketing_campaign',
          entity_type: 'campaign',
          entity_id: campaignId,
          metadata: campaign,
          description: `Created ${campaign.type} campaign: ${campaign.name}`
        }])
        .select()
        .maybeSingle()

      if (error) throw error

      return {
        id: campaignId,
        ...campaign
      }
    } catch (error) {
      console.error('Error creating marketing campaign:', error)
      throw error
    }
  }

  async getDesignTemplates(): Promise<DesignTemplate[]> {
    // Mock templates for now - in real implementation, these would come from Canva API
    return [
      {
        id: '1',
        name: 'Product Showcase Banner',
        category: 'E-commerce',
        preview_url: '/api/placeholder/400/200',
        canva_template_id: 'canva_001',
        is_premium: false
      },
      {
        id: '2',
        name: 'Social Media Post - Sale',
        category: 'Social Media',
        preview_url: '/api/placeholder/400/400',
        canva_template_id: 'canva_002',
        is_premium: false
      },
      {
        id: '3',
        name: 'Email Newsletter Template',
        category: 'Email Marketing',
        preview_url: '/api/placeholder/400/600',
        canva_template_id: 'canva_003',
        is_premium: true
      },
      {
        id: '4',
        name: 'Instagram Story - Product',
        category: 'Social Media',
        preview_url: '/api/placeholder/300/533',
        canva_template_id: 'canva_004',
        is_premium: false
      },
      {
        id: '5',
        name: 'Facebook Ad Creative',
        category: 'Advertising',
        preview_url: '/api/placeholder/500/300',
        canva_template_id: 'canva_005',
        is_premium: true
      }
    ]
  }

  async generateWithAI(prompt: string, type: CreativeAsset['type']): Promise<{ success: boolean; asset_url?: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('unified-ai', {
        body: {
          endpoint: 'creative-generation',
          prompt,
          type,
          brand_colors: ['#3B82F6', '#EF4444'], // Default brand colors
        }
      })

      if (error) throw error

      return {
        success: true,
        asset_url: data?.asset_url || '/api/placeholder/400/400'
      }
    } catch (error) {
      console.error('Error generating creative with AI:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate creative'
      }
    }
  }

  async updateCampaignPerformance(campaignId: string, metrics: MarketingCampaign['performance_metrics']): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      await supabase
        .from('activity_logs')
        .insert([{
          user_id: user.id,
          action: 'campaign_update',
          entity_type: 'campaign',
          entity_id: campaignId,
          metadata: { performance_metrics: metrics },
          description: `Updated campaign performance metrics`
        }])

      console.log('Campaign performance updated:', campaignId, metrics)
    } catch (error) {
      console.error('Error updating campaign performance:', error)
      throw error
    }
  }
}

export const creativeStudioService = CreativeStudioService.getInstance()