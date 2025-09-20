export interface FacebookAdsConfig {
  accessToken: string
  appId: string
  appSecret: string
  adAccountId: string
  businessId?: string
}

export interface FacebookAdCampaign {
  id: string
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  objective: string
  budget: number
  budgetType: 'DAILY' | 'LIFETIME'
  startTime: string
  endTime?: string
  createdTime: string
}

export interface FacebookAdsMetrics {
  impressions: number
  clicks: number
  spend: number
  reach: number
  frequency: number
  ctr: number
  cpc: number
  cpm: number
  conversions: number
  conversionValue: number
  roas: number
}

export class FacebookAdsConnector {
  private config: FacebookAdsConfig
  private baseUrl = 'https://graph.facebook.com/v18.0'

  constructor(config: FacebookAdsConfig) {
    this.config = config
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: any) {
    const url = `${this.baseUrl}/${endpoint}`
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(`${url}?access_token=${this.config.accessToken}`, options)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Facebook API Error: ${error.error?.message || 'Unknown error'}`)
    }

    return response.json()
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('me')
      return true
    } catch (error) {
      console.error('Facebook Ads connection test failed:', error)
      return false
    }
  }

  async getCampaigns(): Promise<FacebookAdCampaign[]> {
    try {
      const fields = [
        'id',
        'name',
        'status',
        'objective',
        'daily_budget',
        'lifetime_budget',
        'start_time',
        'stop_time',
        'created_time'
      ].join(',')

      const response = await this.makeRequest(
        `act_${this.config.adAccountId}/campaigns?fields=${fields}`
      )

      return response.data.map((campaign: any) => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        objective: campaign.objective,
        budget: campaign.daily_budget || campaign.lifetime_budget || 0,
        budgetType: campaign.daily_budget ? 'DAILY' : 'LIFETIME',
        startTime: campaign.start_time,
        endTime: campaign.stop_time,
        createdTime: campaign.created_time,
      }))
    } catch (error) {
      console.error('Failed to fetch Facebook campaigns:', error)
      throw new Error('Failed to fetch campaigns from Facebook Ads')
    }
  }

  async getCampaignMetrics(
    campaignId: string, 
    dateRange: { startDate: string; endDate: string }
  ): Promise<FacebookAdsMetrics> {
    try {
      const fields = [
        'impressions',
        'clicks',
        'spend',
        'reach',
        'frequency',
        'ctr',
        'cpc',
        'cpm',
        'actions',
        'action_values'
      ].join(',')

      const response = await this.makeRequest(
        `${campaignId}/insights?fields=${fields}&time_range={'since':'${dateRange.startDate}','until':'${dateRange.endDate}'}`
      )

      const insights = response.data[0] || {}
      
      // Extract conversions and conversion values from actions
      const conversions = this.extractConversions(insights.actions || [])
      const conversionValue = this.extractConversionValues(insights.action_values || [])

      return {
        impressions: parseInt(insights.impressions || '0'),
        clicks: parseInt(insights.clicks || '0'),
        spend: parseFloat(insights.spend || '0'),
        reach: parseInt(insights.reach || '0'),
        frequency: parseFloat(insights.frequency || '0'),
        ctr: parseFloat(insights.ctr || '0'),
        cpc: parseFloat(insights.cpc || '0'),
        cpm: parseFloat(insights.cpm || '0'),
        conversions,
        conversionValue,
        roas: conversionValue / parseFloat(insights.spend || '1'),
      }
    } catch (error) {
      console.error('Failed to fetch Facebook campaign metrics:', error)
      throw new Error('Failed to fetch metrics from Facebook Ads')
    }
  }

  private extractConversions(actions: any[]): number {
    const conversionActions = [
      'purchase',
      'add_to_cart',
      'initiate_checkout',
      'lead',
      'complete_registration'
    ]
    
    return actions
      .filter(action => conversionActions.includes(action.action_type))
      .reduce((sum, action) => sum + parseInt(action.value || '0'), 0)
  }

  private extractConversionValues(actionValues: any[]): number {
    const conversionActions = ['purchase', 'lead']
    
    return actionValues
      .filter(action => conversionActions.includes(action.action_type))
      .reduce((sum, action) => sum + parseFloat(action.value || '0'), 0)
  }

  async createCampaign(campaign: Omit<FacebookAdCampaign, 'id' | 'createdTime'>): Promise<string> {
    try {
      const campaignData = {
        name: campaign.name,
        objective: campaign.objective,
        status: campaign.status,
        start_time: campaign.startTime,
        stop_time: campaign.endTime,
        daily_budget: campaign.budgetType === 'DAILY' ? campaign.budget * 100 : undefined,
        lifetime_budget: campaign.budgetType === 'LIFETIME' ? campaign.budget * 100 : undefined,
      }

      const response = await this.makeRequest(
        `act_${this.config.adAccountId}/campaigns`,
        'POST',
        campaignData
      )

      return response.id
    } catch (error) {
      console.error('Failed to create Facebook campaign:', error)
      throw new Error('Failed to create campaign in Facebook Ads')
    }
  }

  async updateCampaignStatus(campaignId: string, status: 'ACTIVE' | 'PAUSED'): Promise<boolean> {
    try {
      await this.makeRequest(`${campaignId}`, 'POST', { status })
      return true
    } catch (error) {
      console.error('Failed to update Facebook campaign status:', error)
      return false
    }
  }

  async pauseCampaign(campaignId: string): Promise<boolean> {
    return this.updateCampaignStatus(campaignId, 'PAUSED')
  }

  async resumeCampaign(campaignId: string): Promise<boolean> {
    return this.updateCampaignStatus(campaignId, 'ACTIVE')
  }

  async createProductCatalog(catalogName: string): Promise<string> {
    try {
      const response = await this.makeRequest(
        `${this.config.businessId || this.config.adAccountId}/product_catalogs`,
        'POST',
        {
          name: catalogName,
          vertical: 'commerce'
        }
      )

      return response.id
    } catch (error) {
      console.error('Failed to create Facebook product catalog:', error)
      throw new Error('Failed to create product catalog')
    }
  }

  async uploadProductFeed(catalogId: string, products: any[]): Promise<boolean> {
    try {
      // Create product set
      const productSetResponse = await this.makeRequest(
        `${catalogId}/product_sets`,
        'POST',
        {
          name: 'Main Product Set',
          filter: JSON.stringify({ retailer_id: { i_contains: '' } })
        }
      )

      // Convert products to Facebook format
      const feedData = products.map(product => ({
        retailer_id: product.id,
        title: product.name,
        description: product.description,
        availability: product.stock_quantity > 0 ? 'in stock' : 'out of stock',
        condition: 'new',
        price: `${product.price} EUR`,
        link: `${window.location.origin}/products/${product.id}`,
        image_link: product.image_url,
        brand: product.brand || 'Unknown',
        google_product_category: product.category,
      }))

      // Upload products in batches
      const batchSize = 100
      for (let i = 0; i < feedData.length; i += batchSize) {
        const batch = feedData.slice(i, i + batchSize)
        
        await this.makeRequest(
          `${catalogId}/batch`,
          'POST',
          {
            requests: batch.map(product => ({
              method: 'CREATE',
              data: product
            }))
          }
        )
      }

      return true
    } catch (error) {
      console.error('Failed to upload Facebook product feed:', error)
      return false
    }
  }

  async getAdAccounts(): Promise<any[]> {
    try {
      const response = await this.makeRequest(
        'me/adaccounts?fields=id,name,account_status,currency,timezone_name'
      )
      return response.data
    } catch (error) {
      console.error('Failed to fetch Facebook ad accounts:', error)
      throw new Error('Failed to fetch ad accounts')
    }
  }

  async getInsights(
    objectId: string,
    level: 'account' | 'campaign' | 'adset' | 'ad' = 'campaign',
    dateRange?: { startDate: string; endDate: string }
  ): Promise<any> {
    try {
      let endpoint = `${objectId}/insights`
      const params = new URLSearchParams({
        level,
        fields: [
          'impressions',
          'clicks',
          'spend',
          'reach',
          'ctr',
          'cpc',
          'cpm',
          'actions',
          'action_values'
        ].join(',')
      })

      if (dateRange) {
        params.append('time_range', JSON.stringify({
          since: dateRange.startDate,
          until: dateRange.endDate
        }))
      }

      const response = await this.makeRequest(`${endpoint}?${params}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch Facebook insights:', error)
      throw new Error('Failed to fetch insights')
    }
  }
}

export default FacebookAdsConnector