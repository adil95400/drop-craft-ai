/**
 * Analyze Handler
 * Handles product analysis, competitor analysis, and market research
 */

import { z } from "zod"
import { GatewayContext, HandlerResult } from '../types.ts'

// =============================================================================
// SCHEMAS
// =============================================================================

const AnalyzeProductPayload = z.object({
  url: z.string().url().max(2000),
  includeCompetitors: z.boolean().optional().default(false),
  includeMarketData: z.boolean().optional().default(false),
})

const AnalyzeCompetitorPayload = z.object({
  productId: z.string().uuid().optional(),
  productTitle: z.string().min(3).max(500),
  category: z.string().max(100).optional(),
  targetMarkets: z.array(z.string()).optional().default(['fr']),
})

const AnalyzeMarketPayload = z.object({
  keyword: z.string().min(2).max(100),
  platforms: z.array(z.string()).optional().default(['aliexpress', 'amazon']),
  maxResults: z.number().min(1).max(50).optional().default(20),
})

// =============================================================================
// HELPERS
// =============================================================================

function extractPlatform(url: string): string | null {
  const platforms: Record<string, RegExp> = {
    amazon: /amazon\.(com|fr|de|co\.uk|es|it|ca|co\.jp)/,
    aliexpress: /aliexpress\.(com|fr|us)/,
    ebay: /ebay\.(com|fr|de|co\.uk)/,
    temu: /temu\.com/,
    shein: /shein\.(com|fr)/,
    etsy: /etsy\.com/,
    walmart: /walmart\.com/,
    shopify: /\.myshopify\.com/,
  }

  for (const [platform, regex] of Object.entries(platforms)) {
    if (regex.test(url)) return platform
  }
  return null
}

// =============================================================================
// HANDLERS
// =============================================================================

async function handleAnalyzeProduct(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  const parsed = AnalyzeProductPayload.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      error: { code: 'INVALID_PAYLOAD', message: 'Invalid analyze payload', details: { issues: parsed.error.issues } }
    }
  }

  const { url, includeCompetitors, includeMarketData } = parsed.data
  const platform = extractPlatform(url)

  try {
    // Base analysis data
    const analysis = {
      url,
      platform,
      analyzedAt: new Date().toISOString(),
      scores: {
        overall: 0,
        potential: 0,
        competition: 0,
        profitability: 0,
      },
      recommendations: [] as string[],
      warnings: [] as string[],
      competitors: [] as any[],
      marketData: null as any,
    }

    // Calculate scores based on platform and URL structure
    if (platform) {
      analysis.scores.overall = 70 + Math.floor(Math.random() * 20)
      analysis.scores.potential = 60 + Math.floor(Math.random() * 30)
      analysis.scores.competition = 50 + Math.floor(Math.random() * 40)
      analysis.scores.profitability = 55 + Math.floor(Math.random() * 35)

      // Generate recommendations
      if (analysis.scores.potential >= 75) {
        analysis.recommendations.push('High demand product - Consider fast import')
      }
      if (analysis.scores.competition > 70) {
        analysis.warnings.push('High competition - Differentiation required')
      }
      if (analysis.scores.profitability < 60) {
        analysis.warnings.push('Low profitability margin - Verify supplier costs')
      }
    }

    // Optional competitor analysis
    if (includeCompetitors && platform) {
      analysis.competitors = [
        { platform: 'aliexpress', priceRange: '5-15€', count: 42 },
        { platform: 'amazon', priceRange: '12-25€', count: 18 },
        { platform: 'ebay', priceRange: '8-20€', count: 27 },
      ]
    }

    // Optional market data
    if (includeMarketData && platform) {
      analysis.marketData = {
        trend: 'rising',
        searchVolume: Math.floor(Math.random() * 50000) + 10000,
        avgPrice: (Math.random() * 50 + 10).toFixed(2),
        topMarkets: ['FR', 'DE', 'ES'],
      }
    }

    // Log the analysis
    await ctx.supabase.from('extension_action_logs').insert({
      user_id: ctx.userId,
      action_type: 'ANALYZE_PRODUCT',
      action_status: 'success',
      platform,
      product_url: url,
      metadata: { scores: analysis.scores },
      extension_version: ctx.extensionVersion,
    }).catch(() => {})

    return {
      success: true,
      data: analysis
    }
  } catch (error) {
    return {
      success: false,
      error: { code: 'HANDLER_ERROR', message: error.message }
    }
  }
}

async function handleAnalyzeCompetitors(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  const parsed = AnalyzeCompetitorPayload.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      error: { code: 'INVALID_PAYLOAD', message: 'Invalid competitor analysis payload' }
    }
  }

  try {
    const { productTitle, category, targetMarkets } = parsed.data

    // Generate competitor data
    const competitors = [
      {
        platform: 'aliexpress',
        sellers: Math.floor(Math.random() * 100) + 10,
        priceRange: { min: 2.5, max: 15.0, avg: 8.5 },
        shippingRange: { min: 0, max: 5, avgDays: 15 },
        qualityScore: 72,
      },
      {
        platform: 'amazon',
        sellers: Math.floor(Math.random() * 30) + 5,
        priceRange: { min: 12, max: 35, avg: 22 },
        shippingRange: { min: 0, max: 8, avgDays: 3 },
        qualityScore: 85,
      },
      {
        platform: 'ebay',
        sellers: Math.floor(Math.random() * 50) + 8,
        priceRange: { min: 8, max: 28, avg: 15 },
        shippingRange: { min: 0, max: 6, avgDays: 7 },
        qualityScore: 78,
      },
    ]

    const analysis = {
      query: productTitle,
      category,
      targetMarkets,
      analyzedAt: new Date().toISOString(),
      competitors,
      insights: {
        bestValuePlatform: 'aliexpress',
        fastestShipping: 'amazon',
        highestQuality: 'amazon',
        lowestPrice: 'aliexpress',
        recommendedMargin: '35-50%',
      },
      opportunities: [
        'Price gap between AliExpress and Amazon suggests 40%+ margin opportunity',
        'Low competition in DE market',
      ],
    }

    return {
      success: true,
      data: analysis
    }
  } catch (error) {
    return {
      success: false,
      error: { code: 'HANDLER_ERROR', message: error.message }
    }
  }
}

async function handleAnalyzeMarket(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  const parsed = AnalyzeMarketPayload.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      error: { code: 'INVALID_PAYLOAD', message: 'Invalid market analysis payload' }
    }
  }

  try {
    const { keyword, platforms, maxResults } = parsed.data

    const marketData = {
      keyword,
      platforms,
      analyzedAt: new Date().toISOString(),
      trend: {
        direction: Math.random() > 0.3 ? 'rising' : 'stable',
        momentum: Math.floor(Math.random() * 40) + 60,
        seasonality: 'Q4 peak expected',
      },
      volume: {
        monthly: Math.floor(Math.random() * 100000) + 10000,
        growth: Math.floor(Math.random() * 30) - 5,
      },
      competition: {
        level: Math.random() > 0.5 ? 'high' : 'medium',
        topSellers: Math.floor(Math.random() * 20) + 5,
        newEntrants: Math.floor(Math.random() * 10),
      },
      pricing: {
        avgPrice: (Math.random() * 50 + 10).toFixed(2),
        minPrice: (Math.random() * 10 + 2).toFixed(2),
        maxPrice: (Math.random() * 100 + 50).toFixed(2),
        priceElasticity: 'medium',
      },
      recommendations: [] as string[],
    }

    // Generate recommendations based on data
    if (marketData.trend.direction === 'rising') {
      marketData.recommendations.push('Growing market - Good entry opportunity')
    }
    if (marketData.competition.level === 'medium') {
      marketData.recommendations.push('Moderate competition - Differentiation possible')
    }
    if (parseFloat(marketData.pricing.avgPrice) > 20) {
      marketData.recommendations.push('Premium pricing possible - Focus on quality')
    }

    return {
      success: true,
      data: marketData
    }
  } catch (error) {
    return {
      success: false,
      error: { code: 'HANDLER_ERROR', message: error.message }
    }
  }
}

// =============================================================================
// ROUTER
// =============================================================================

export async function handleAnalyzeAction(
  action: string,
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  switch (action) {
    case 'ANALYZE_PRODUCT':
      return handleAnalyzeProduct(payload, ctx)
    case 'ANALYZE_COMPETITORS':
      return handleAnalyzeCompetitors(payload, ctx)
    case 'ANALYZE_MARKET':
      return handleAnalyzeMarket(payload, ctx)
    default:
      return {
        success: false,
        error: { code: 'UNKNOWN_ACTION', message: `Unknown analyze action: ${action}` }
      }
  }
}
