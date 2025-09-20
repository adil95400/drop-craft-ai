export interface TikTokAdsConfig {
  accessToken: string
  appId: string
  secret: string
  advertiserId: string
}

export interface TikTokAdCampaign {
  id: string
  name: string
  status: 'ENABLE' | 'DISABLE' | 'DELETE'
  objective: string
  budget: number
  budgetMode: 'BUDGET_MODE_DAY' | 'BUDGET_MODE_TOTAL'
  startTime: string
  endTime?: string
  createdTime: string
}

export interface TikTokAdsMetrics {
  impressions: number
  clicks: number
  spend: number
  reach: number
  ctr: number
  cpc: number
  cpm: number
  conversions: number
  conversionValue: number
  roas: number
  videoViews: number
  videoViewRate: number
}

export class TikTokAdsConnector {
  private config: TikTokAdsConfig
  private baseUrl = 'https://business-api.tiktok.com/open_api/v1.3'

  constructor(config: TikTokAdsConfig) {
    this.config = config
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: any) {
    const url = `${this.baseUrl}/${endpoint}`
    const options: RequestInit = {
      method,
      headers: {
        'Access-Token': this.config.accessToken,
        'Content-Type': 'application/json',
      },
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(`TikTok API Error: ${error.message || 'Unknown error'}`)
    }

    const data = await response.json()
    
    if (data.code !== 0) {
      throw new Error(`TikTok API Error: ${data.message}`)
    }

    return data.data
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest(`advertiser/info/?advertiser_ids=[${this.config.advertiserId}]`)
      return true
    } catch (error) {
      console.error('TikTok Ads connection test failed:', error)
      return false
    }
  }

  async getCampaigns(): Promise<TikTokAdCampaign[]> {
    try {
      const response = await this.makeRequest(
        `campaign/get/?advertiser_id=${this.config.advertiserId}&fields=["campaign_id","campaign_name","status","objective","budget","budget_mode","create_time","modify_time"]`
      )

      return response.list?.map((campaign: any) => ({
        id: campaign.campaign_id,
        name: campaign.campaign_name,
        status: campaign.status,
        objective: campaign.objective,
        budget: parseFloat(campaign.budget || '0'),
        budgetMode: campaign.budget_mode,
        startTime: campaign.create_time,
        endTime: campaign.modify_time,
        createdTime: campaign.create_time,
      })) || []
    } catch (error) {
      console.error('Failed to fetch TikTok campaigns:', error)
      throw new Error('Failed to fetch campaigns from TikTok Ads')
    }
  }

  async getCampaignMetrics(
    campaignId: string,
    dateRange: { startDate: string; endDate: string }
  ): Promise<TikTokAdsMetrics> {
    try {
      const response = await this.makeRequest(
        `report/integrated/get/`,
        'POST',
        {
          advertiser_id: this.config.advertiserId,
          report_type: 'BASIC',
          data_level: 'AUCTION_CAMPAIGN',
          dimensions: ['campaign_id'],
          metrics: [
            'impressions',
            'clicks',
            'spend',
            'reach',
            'ctr',
            'cpc',
            'cpm',
            'conversion',
            'cost_per_conversion',
            'video_play_actions',
            'video_view_p25_count',
            'video_view_p50_count',
            'video_view_p75_count',
            'video_view_p100_count'
          ],
          filters: [
            {
              field_name: 'campaign_ids',
              filter_type: 'IN',
              filter_value: [campaignId]
            }
          ],
          start_date: dateRange.startDate,
          end_date: dateRange.endDate,
        }
      )

      const metrics = response.list?.[0]?.metrics || {}
      const conversions = parseInt(metrics.conversion || '0')
      const spend = parseFloat(metrics.spend || '0')
      const conversionValue = conversions * 50 // Estimation moyenne de la valeur de conversion

      return {
        impressions: parseInt(metrics.impressions || '0'),
        clicks: parseInt(metrics.clicks || '0'),
        spend,
        reach: parseInt(metrics.reach || '0'),
        ctr: parseFloat(metrics.ctr || '0'),
        cpc: parseFloat(metrics.cpc || '0'),
        cpm: parseFloat(metrics.cpm || '0'),
        conversions,
        conversionValue,
        roas: conversionValue / (spend || 1),
        videoViews: parseInt(metrics.video_play_actions || '0'),
        videoViewRate: this.calculateVideoViewRate(metrics),
      }
    } catch (error) {
      console.error('Failed to fetch TikTok campaign metrics:', error)
      throw new Error('Failed to fetch metrics from TikTok Ads')
    }
  }

  private calculateVideoViewRate(metrics: any): number {
    const impressions = parseInt(metrics.impressions || '0')
    const videoViews = parseInt(metrics.video_play_actions || '0')
    return impressions > 0 ? (videoViews / impressions) * 100 : 0
  }

  async createCampaign(campaign: Omit<TikTokAdCampaign, 'id' | 'createdTime'>): Promise<string> {
    try {
      const response = await this.makeRequest(
        'campaign/create/',
        'POST',
        {
          advertiser_id: this.config.advertiserId,
          campaign_name: campaign.name,
          objective: campaign.objective,
          budget: campaign.budget,
          budget_mode: campaign.budgetMode,
          status: campaign.status,
        }
      )

      return response.campaign_id
    } catch (error) {
      console.error('Failed to create TikTok campaign:', error)
      throw new Error('Failed to create campaign in TikTok Ads')
    }
  }

  async updateCampaignStatus(campaignId: string, status: 'ENABLE' | 'DISABLE'): Promise<boolean> {
    try {
      await this.makeRequest(
        'campaign/update/',
        'POST',
        {
          advertiser_id: this.config.advertiserId,
          campaign_id: campaignId,
          status,
        }
      )
      return true
    } catch (error) {
      console.error('Failed to update TikTok campaign status:', error)
      return false
    }
  }

  async pauseCampaign(campaignId: string): Promise<boolean> {
    return this.updateCampaignStatus(campaignId, 'DISABLE')
  }

  async resumeCampaign(campaignId: string): Promise<boolean> {
    return this.updateCampaignStatus(campaignId, 'ENABLE')
  }

  async createProductCatalog(catalogName: string): Promise<string> {
    try {
      const response = await this.makeRequest(
        'catalog/create/',
        'POST',
        {
          advertiser_id: this.config.advertiserId,
          catalog_name: catalogName,
          vertical: 'ECOMMERCE',
        }
      )

      return response.catalog_id
    } catch (error) {
      console.error('Failed to create TikTok product catalog:', error)
      throw new Error('Failed to create product catalog')
    }
  }

  async uploadProductFeed(catalogId: string, products: any[]): Promise<boolean> {
    try {
      // Convert products to TikTok format
      const feedData = products.map(product => ({
        sku_id: product.id,
        title: product.name,
        description: product.description,
        availability: product.stock_quantity > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
        condition: 'NEW',
        price: product.price,
        link: `${window.location.origin}/products/${product.id}`,
        image_link: product.image_url,
        brand: product.brand || 'Unknown',
        product_category: product.category,
        currency: 'EUR',
      }))

      // Upload products in batches
      const batchSize = 1000
      for (let i = 0; i < feedData.length; i += batchSize) {
        const batch = feedData.slice(i, i + batchSize)
        
        await this.makeRequest(
          'catalog/product/upload/',
          'POST',
          {
            advertiser_id: this.config.advertiserId,
            catalog_id: catalogId,
            products: batch,
          }
        )
      }

      return true
    } catch (error) {
      console.error('Failed to upload TikTok product feed:', error)
      return false
    }
  }

  async getAdvertiserInfo(): Promise<any> {
    try {
      const response = await this.makeRequest(
        `advertiser/info/?advertiser_ids=[${this.config.advertiserId}]`
      )
      return response.list?.[0] || {}
    } catch (error) {
      console.error('Failed to fetch TikTok advertiser info:', error)
      throw new Error('Failed to fetch advertiser information')
    }
  }

  async getPixels(): Promise<any[]> {
    try {
      const response = await this.makeRequest(
        `pixel/list/?advertiser_id=${this.config.advertiserId}`
      )
      return response.pixels || []
    } catch (error) {
      console.error('Failed to fetch TikTok pixels:', error)
      return []
    }
  }

  async createPixel(pixelName: string): Promise<string> {
    try {
      const response = await this.makeRequest(
        'pixel/create/',
        'POST',
        {
          advertiser_id: this.config.advertiserId,
          pixel_name: pixelName,
        }
      )

      return response.pixel_id
    } catch (error) {
      console.error('Failed to create TikTok pixel:', error)
      throw new Error('Failed to create pixel')
    }
  }

  async getAudienceInsights(
    targetingSpec: any,
    dateRange: { startDate: string; endDate: string }
  ): Promise<any> {
    try {
      const response = await this.makeRequest(
        'tool/audience_insight/',
        'POST',
        {
          advertiser_id: this.config.advertiserId,
          targeting_spec: targetingSpec,
          start_date: dateRange.startDate,
          end_date: dateRange.endDate,
        }
      )

      return response
    } catch (error) {
      console.error('Failed to fetch TikTok audience insights:', error)
      throw new Error('Failed to fetch audience insights')
    }
  }
}

export default TikTokAdsConnector