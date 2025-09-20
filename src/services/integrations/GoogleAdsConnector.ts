export interface GoogleAdsConfig {
  clientId: string
  clientSecret: string
  developerToken: string
  refreshToken: string
  customerId: string
}

export interface GoogleAdsCampaign {
  id: string
  name: string
  status: 'ENABLED' | 'PAUSED' | 'REMOVED'
  budget: number
  targetCpa?: number
  targetRoas?: number
  startDate: string
  endDate?: string
}

export interface GoogleAdsMetrics {
  impressions: number
  clicks: number
  cost: number
  conversions: number
  conversionValue: number
  ctr: number
  averageCpc: number
  costPerConversion: number
}

export class GoogleAdsConnector {
  private config: GoogleAdsConfig
  private baseUrl = 'https://googleads.googleapis.com/v15'

  constructor(config: GoogleAdsConfig) {
    this.config = config
  }

  async authenticate(): Promise<string> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: this.config.refreshToken,
          grant_type: 'refresh_token',
        }),
      })

      const data = await response.json()
      return data.access_token
    } catch (error) {
      console.error('Google Ads authentication failed:', error)
      throw new Error('Failed to authenticate with Google Ads')
    }
  }

  async getCampaigns(): Promise<GoogleAdsCampaign[]> {
    const accessToken = await this.authenticate()
    
    try {
      const query = `
        SELECT 
          campaign.id,
          campaign.name,
          campaign.status,
          campaign_budget.amount_micros,
          campaign.start_date,
          campaign.end_date
        FROM campaign
        WHERE campaign.status != 'REMOVED'
      `

      const response = await fetch(
        `${this.baseUrl}/customers/${this.config.customerId}/googleAds:searchStream`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': this.config.developerToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        }
      )

      const data = await response.json()
      
      return data.results?.map((result: any) => ({
        id: result.campaign.id,
        name: result.campaign.name,
        status: result.campaign.status,
        budget: result.campaignBudget?.amountMicros ? 
          parseInt(result.campaignBudget.amountMicros) / 1000000 : 0,
        startDate: result.campaign.startDate,
        endDate: result.campaign.endDate,
      })) || []
    } catch (error) {
      console.error('Failed to fetch Google Ads campaigns:', error)
      throw new Error('Failed to fetch campaigns from Google Ads')
    }
  }

  async getCampaignMetrics(campaignId: string, dateRange: { startDate: string; endDate: string }): Promise<GoogleAdsMetrics> {
    const accessToken = await this.authenticate()
    
    try {
      const query = `
        SELECT 
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversions_value,
          metrics.ctr,
          metrics.average_cpc,
          metrics.cost_per_conversion
        FROM campaign
        WHERE campaign.id = ${campaignId}
        AND segments.date BETWEEN '${dateRange.startDate}' AND '${dateRange.endDate}'
      `

      const response = await fetch(
        `${this.baseUrl}/customers/${this.config.customerId}/googleAds:searchStream`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': this.config.developerToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        }
      )

      const data = await response.json()
      const metrics = data.results?.[0]?.metrics

      return {
        impressions: metrics?.impressions || 0,
        clicks: metrics?.clicks || 0,
        cost: metrics?.costMicros ? parseInt(metrics.costMicros) / 1000000 : 0,
        conversions: metrics?.conversions || 0,
        conversionValue: metrics?.conversionsValue || 0,
        ctr: metrics?.ctr || 0,
        averageCpc: metrics?.averageCpc ? parseInt(metrics.averageCpc) / 1000000 : 0,
        costPerConversion: metrics?.costPerConversion ? parseInt(metrics.costPerConversion) / 1000000 : 0,
      }
    } catch (error) {
      console.error('Failed to fetch Google Ads metrics:', error)
      throw new Error('Failed to fetch metrics from Google Ads')
    }
  }

  async createCampaign(campaign: Omit<GoogleAdsCampaign, 'id'>): Promise<string> {
    const accessToken = await this.authenticate()
    
    try {
      const operation = {
        create: {
          name: campaign.name,
          status: campaign.status,
          advertisingChannelType: 'SEARCH',
          campaignBudget: `customers/${this.config.customerId}/campaignBudgets/-1`,
          networkSettings: {
            targetGoogleSearch: true,
            targetSearchNetwork: true,
            targetContentNetwork: false,
            targetPartnerSearchNetwork: false,
          },
          startDate: campaign.startDate,
          endDate: campaign.endDate,
        },
      }

      const response = await fetch(
        `${this.baseUrl}/customers/${this.config.customerId}/campaigns:mutate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': this.config.developerToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerId: this.config.customerId,
            operations: [operation],
          }),
        }
      )

      const data = await response.json()
      return data.results?.[0]?.resourceName?.split('/').pop() || ''
    } catch (error) {
      console.error('Failed to create Google Ads campaign:', error)
      throw new Error('Failed to create campaign in Google Ads')
    }
  }

  async pauseCampaign(campaignId: string): Promise<boolean> {
    return this.updateCampaignStatus(campaignId, 'PAUSED')
  }

  async resumeCampaign(campaignId: string): Promise<boolean> {
    return this.updateCampaignStatus(campaignId, 'ENABLED')
  }

  private async updateCampaignStatus(campaignId: string, status: 'ENABLED' | 'PAUSED'): Promise<boolean> {
    const accessToken = await this.authenticate()
    
    try {
      const operation = {
        update: {
          resourceName: `customers/${this.config.customerId}/campaigns/${campaignId}`,
          status: status,
        },
        updateMask: 'status',
      }

      const response = await fetch(
        `${this.baseUrl}/customers/${this.config.customerId}/campaigns:mutate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': this.config.developerToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerId: this.config.customerId,
            operations: [operation],
          }),
        }
      )

      return response.ok
    } catch (error) {
      console.error(`Failed to ${status.toLowerCase()} Google Ads campaign:`, error)
      return false
    }
  }

  async exportProductFeed(products: any[]): Promise<string> {
    // Convert products to Google Shopping feed format
    const feedItems = products.map(product => ({
      id: product.id,
      title: product.name,
      description: product.description,
      link: `${window.location.origin}/products/${product.id}`,
      image_link: product.image_url,
      availability: product.stock_quantity > 0 ? 'in stock' : 'out of stock',
      price: `${product.price} EUR`,
      brand: product.brand || 'Unknown',
      condition: 'new',
      google_product_category: product.category,
    }))

    // Create XML feed
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>'
    const rssOpen = '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">'
    const channelOpen = '<channel>'
    const channelInfo = `
      <title>Product Feed</title>
      <link>${window.location.origin}</link>
      <description>Product feed for Google Shopping</description>
    `
    
    const items = feedItems.map(item => `
      <item>
        <g:id>${item.id}</g:id>
        <g:title><![CDATA[${item.title}]]></g:title>
        <g:description><![CDATA[${item.description}]]></g:description>
        <g:link>${item.link}</g:link>
        <g:image_link>${item.image_link}</g:image_link>
        <g:availability>${item.availability}</g:availability>
        <g:price>${item.price}</g:price>
        <g:brand>${item.brand}</g:brand>
        <g:condition>${item.condition}</g:condition>
        <g:google_product_category>${item.google_product_category}</g:google_product_category>
      </item>
    `).join('')
    
    const channelClose = '</channel>'
    const rssClose = '</rss>'
    
    return `${xmlHeader}${rssOpen}${channelOpen}${channelInfo}${items}${channelClose}${rssClose}`
  }
}

export default GoogleAdsConnector