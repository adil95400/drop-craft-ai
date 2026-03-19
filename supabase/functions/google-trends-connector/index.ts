/**
 * Google Trends Data Connector
 * 
 * Real trend analysis for product research:
 * - Interest over time
 * - Interest by region
 * - Related queries & topics
 * - Rising trends detection
 * 
 * Uses SerpAPI Google Trends endpoint for reliable data access
 * Fallback: Firecrawl scraping of Google Trends
 */
import { handlePreflight, requireAuth, errorResponse, successResponse } from '../_shared/jwt-auth.ts'

const SERPAPI_BASE = 'https://serpapi.com/search.json'

interface TrendResult {
  keyword: string
  interest_over_time: Array<{ date: string; value: number }>
  interest_by_region: Array<{ location: string; value: number }>
  related_queries: Array<{ query: string; value: number; type: 'rising' | 'top' }>
  related_topics: Array<{ topic: string; value: number; type: 'rising' | 'top' }>
  trend_score: number
  seasonality: 'stable' | 'seasonal' | 'trending_up' | 'trending_down' | 'spike'
}

// ==========================================
// SERPAPI GOOGLE TRENDS CLIENT
// ==========================================
class GoogleTrendsClient {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async getInterestOverTime(params: {
    keyword: string
    geo?: string
    timeRange?: string
    category?: number
  }): Promise<any> {
    const qs = new URLSearchParams({
      engine: 'google_trends',
      q: params.keyword,
      data_type: 'TIMESERIES',
      api_key: this.apiKey,
      geo: params.geo || '',
      date: params.timeRange || 'today 12-m',
      ...(params.category ? { cat: String(params.category) } : {}),
    })

    const response = await fetch(`${SERPAPI_BASE}?${qs}`)
    if (!response.ok) throw new Error(`SerpAPI HTTP ${response.status}`)
    return response.json()
  }

  async getInterestByRegion(keyword: string, geo?: string): Promise<any> {
    const qs = new URLSearchParams({
      engine: 'google_trends',
      q: keyword,
      data_type: 'GEO_MAP',
      api_key: this.apiKey,
      geo: geo || '',
    })

    const response = await fetch(`${SERPAPI_BASE}?${qs}`)
    if (!response.ok) throw new Error(`SerpAPI HTTP ${response.status}`)
    return response.json()
  }

  async getRelatedQueries(keyword: string, geo?: string): Promise<any> {
    const qs = new URLSearchParams({
      engine: 'google_trends',
      q: keyword,
      data_type: 'RELATED_QUERIES',
      api_key: this.apiKey,
      geo: geo || '',
    })

    const response = await fetch(`${SERPAPI_BASE}?${qs}`)
    if (!response.ok) throw new Error(`SerpAPI HTTP ${response.status}`)
    return response.json()
  }

  async getRelatedTopics(keyword: string, geo?: string): Promise<any> {
    const qs = new URLSearchParams({
      engine: 'google_trends',
      q: keyword,
      data_type: 'RELATED_TOPICS',
      api_key: this.apiKey,
      geo: geo || '',
    })

    const response = await fetch(`${SERPAPI_BASE}?${qs}`)
    if (!response.ok) throw new Error(`SerpAPI HTTP ${response.status}`)
    return response.json()
  }

  async compareKeywords(keywords: string[], geo?: string): Promise<any> {
    const qs = new URLSearchParams({
      engine: 'google_trends',
      q: keywords.join(','),
      data_type: 'TIMESERIES',
      api_key: this.apiKey,
      geo: geo || '',
      date: 'today 12-m',
    })

    const response = await fetch(`${SERPAPI_BASE}?${qs}`)
    if (!response.ok) throw new Error(`SerpAPI HTTP ${response.status}`)
    return response.json()
  }
}

// ==========================================
// FIRECRAWL FALLBACK
// ==========================================
async function scrapeTrendsViaFirecrawl(keyword: string, firecrawlKey: string): Promise<Partial<TrendResult>> {
  const encodedKw = encodeURIComponent(keyword)
  const url = `https://trends.google.com/trends/explore?q=${encodedKw}&geo=FR`

  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, formats: ['markdown'], waitFor: 5000, onlyMainContent: true }),
  })

  if (!response.ok) throw new Error(`Firecrawl error ${response.status}`)
  const data = await response.json()
  const content = data?.data?.markdown || ''

  // Parse basic trend signals from scraped content
  const interestValues = Array.from(content.matchAll(/(\d{1,3})%?\s*(?:interest|intérêt)/gi))
    .map((m: any) => parseInt(m[1]))

  return {
    keyword,
    trend_score: interestValues.length > 0 ? Math.max(...interestValues) : 50,
    seasonality: 'stable',
    interest_over_time: [],
    related_queries: [],
    related_topics: [],
    interest_by_region: [],
  }
}

// ==========================================
// TREND ANALYSIS HELPERS
// ==========================================
function analyzeTrend(timeSeriesData: Array<{ value: number }>): 'stable' | 'seasonal' | 'trending_up' | 'trending_down' | 'spike' {
  if (!timeSeriesData?.length || timeSeriesData.length < 4) return 'stable'

  const values = timeSeriesData.map(d => d.value)
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const recent = values.slice(-Math.floor(values.length / 4))
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
  const maxVal = Math.max(...values)

  // Spike detection
  if (maxVal > avg * 3) return 'spike'
  // Trend direction
  const ratio = recentAvg / avg
  if (ratio > 1.3) return 'trending_up'
  if (ratio < 0.7) return 'trending_down'

  // Seasonality detection (coefficient of variation)
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length
  const cv = Math.sqrt(variance) / avg
  if (cv > 0.4) return 'seasonal'

  return 'stable'
}

// ==========================================
// MAIN HANDLER
// ==========================================
Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, corsHeaders } = await requireAuth(req)
    const { action, keyword, keywords, geo, timeRange, category } = await req.json()

    console.log(`[google-trends] Action: ${action}, Keyword: ${keyword}, User: ${userId}`)

    const serpApiKey = Deno.env.get('SERPAPI_KEY') || ''
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY') || ''

    if (!serpApiKey && !firecrawlKey) {
      return errorResponse('Aucune clé API configurée (SerpAPI ou Firecrawl requis)', corsHeaders, 400)
    }

    let result: any

    if (serpApiKey) {
      const client = new GoogleTrendsClient(serpApiKey)

      switch (action) {
        case 'interest_over_time': {
          if (!keyword) return errorResponse('keyword requis', corsHeaders, 400)
          const data = await client.getInterestOverTime({ keyword, geo, timeRange, category })
          const timeSeries = data?.interest_over_time?.timeline_data || []
          result = {
            keyword,
            data: timeSeries.map((d: any) => ({
              date: d.date,
              value: d.values?.[0]?.extracted_value || 0,
            })),
            seasonality: analyzeTrend(timeSeries.map((d: any) => ({ value: d.values?.[0]?.extracted_value || 0 }))),
          }
          break
        }

        case 'interest_by_region': {
          if (!keyword) return errorResponse('keyword requis', corsHeaders, 400)
          const data = await client.getInterestByRegion(keyword, geo)
          result = {
            keyword,
            regions: data?.interest_by_region?.map((r: any) => ({
              location: r.location,
              value: r.extracted_value || r.value || 0,
              max_value_index: r.max_value_index || 0,
            })) || [],
          }
          break
        }

        case 'related_queries': {
          if (!keyword) return errorResponse('keyword requis', corsHeaders, 400)
          const data = await client.getRelatedQueries(keyword, geo)
          result = {
            keyword,
            rising: data?.related_queries?.rising?.map((q: any) => ({ query: q.query, value: q.extracted_value || q.value })) || [],
            top: data?.related_queries?.top?.map((q: any) => ({ query: q.query, value: q.extracted_value || q.value })) || [],
          }
          break
        }

        case 'related_topics': {
          if (!keyword) return errorResponse('keyword requis', corsHeaders, 400)
          const data = await client.getRelatedTopics(keyword, geo)
          result = {
            keyword,
            rising: data?.related_topics?.rising?.map((t: any) => ({ topic: t.topic?.title, value: t.extracted_value || t.value })) || [],
            top: data?.related_topics?.top?.map((t: any) => ({ topic: t.topic?.title, value: t.extracted_value || t.value })) || [],
          }
          break
        }

        case 'compare': {
          if (!keywords?.length) return errorResponse('keywords[] requis', corsHeaders, 400)
          result = await client.compareKeywords(keywords, geo)
          break
        }

        case 'full_analysis': {
          if (!keyword) return errorResponse('keyword requis', corsHeaders, 400)
          const [timeData, regionData, queriesData, topicsData] = await Promise.all([
            client.getInterestOverTime({ keyword, geo, timeRange }),
            client.getInterestByRegion(keyword, geo),
            client.getRelatedQueries(keyword, geo),
            client.getRelatedTopics(keyword, geo),
          ])

          const timeSeries = (timeData?.interest_over_time?.timeline_data || [])
            .map((d: any) => ({ date: d.date, value: d.values?.[0]?.extracted_value || 0 }))

          result = {
            keyword,
            interest_over_time: timeSeries,
            interest_by_region: (regionData?.interest_by_region || []).slice(0, 20),
            related_queries: {
              rising: (queriesData?.related_queries?.rising || []).slice(0, 10),
              top: (queriesData?.related_queries?.top || []).slice(0, 10),
            },
            related_topics: {
              rising: (topicsData?.related_topics?.rising || []).slice(0, 10),
              top: (topicsData?.related_topics?.top || []).slice(0, 10),
            },
            trend_score: timeSeries.length > 0 ? timeSeries[timeSeries.length - 1].value : 50,
            seasonality: analyzeTrend(timeSeries),
          }
          break
        }

        default:
          return errorResponse(`Action non supportée: ${action}`, corsHeaders, 400)
      }
    } else {
      // Fallback to Firecrawl scraping
      console.log('[google-trends] Using Firecrawl fallback')
      result = await scrapeTrendsViaFirecrawl(keyword, firecrawlKey)
    }

    return successResponse({ data: result, action }, corsHeaders)
  } catch (error: any) {
    if (error instanceof Response) return error
    console.error('[google-trends] Error:', error)
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return errorResponse(error.message, getSecureCorsHeaders(req.headers.get('origin')), 500)
  }
})
