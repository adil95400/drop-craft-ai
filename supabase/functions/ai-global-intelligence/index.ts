/**
 * AI Global Intelligence — Phase 5.1
 * Market analysis, trend prediction, multi-region insights
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { requireAuth, handlePreflight, errorResponse, successResponse } from '../_shared/jwt-auth.ts'
import { generateJSON } from '../_shared/ai-client.ts'

serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const ctx = await requireAuth(req)
    const body = await req.json()
    const { action, ...params } = body

    switch (action) {
      case 'market_analysis': return handleMarketAnalysis(ctx, params)
      case 'trend_prediction': return handleTrendPrediction(ctx, params)
      case 'expansion_opportunities': return handleExpansionOpportunities(ctx, params)
      case 'competitor_landscape': return handleCompetitorLandscape(ctx, params)
      default:
        return errorResponse(`Unknown action: ${action}`, ctx.corsHeaders)
    }
  } catch (e) {
    if (e instanceof Response) return e
    console.error('Global Intelligence error:', e)
    return new Response(JSON.stringify({ success: false, error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

async function callAI(systemPrompt: string, userPrompt: string) {
  return generateJSON(systemPrompt, userPrompt, { module: 'automation', temperature: 0.3, enableCache: true })
}

async function handleMarketAnalysis(ctx: any, params: any) {
  const { regions, categories, currency = 'EUR' } = params

  // Fetch real product & order data
  const { data: products } = await ctx.supabase
    .from('products')
    .select('category, price, currency, status, created_at')
    .limit(500)

  const { data: orders } = await ctx.supabase
    .from('orders')
    .select('total_amount, currency, status, created_at, shipping_country')
    .gte('created_at', new Date(Date.now() - 90 * 86400000).toISOString())
    .limit(500)

  const result = await callAI(
    `You are a global market intelligence analyst. Analyze the provided e-commerce data and return JSON with:
    { "market_overview": { "total_revenue": number, "growth_rate": number, "top_categories": [...] },
      "regional_insights": [{ "region": string, "revenue_share": number, "growth": number, "opportunities": [...] }],
      "competitive_position": { "strengths": [...], "weaknesses": [...], "market_share_estimate": number },
      "recommendations": [{ "priority": "high"|"medium"|"low", "action": string, "expected_impact": string }] }`,
    `Analyze market data for regions: ${JSON.stringify(regions || ['Europe', 'North America'])}, currency: ${currency}.
    Products: ${JSON.stringify(products?.slice(0, 200) || [])}.
    Recent orders: ${JSON.stringify(orders?.slice(0, 200) || [])}.`
  )

  return successResponse({ analysis: result }, ctx.corsHeaders)
}

async function handleTrendPrediction(ctx: any, params: any) {
  const { timeframe = '90d', categories } = params

  const { data: snapshots } = await ctx.supabase
    .from('analytics_snapshots')
    .select('metrics, snapshot_date, snapshot_type')
    .order('snapshot_date', { ascending: false })
    .limit(90)

  const { data: insights } = await ctx.supabase
    .from('analytics_insights')
    .select('metric_name, metric_value, trend, trend_percentage, recorded_at')
    .order('recorded_at', { ascending: false })
    .limit(100)

  const result = await callAI(
    `You are a predictive analytics engine. Analyze historical data and forecast trends. Return JSON:
    { "trends": [{ "metric": string, "current_value": number, "predicted_value": number, "confidence": number, "direction": "up"|"down"|"stable", "factors": [...] }],
      "seasonal_patterns": [{ "pattern": string, "period": string, "impact": string }],
      "emerging_opportunities": [{ "opportunity": string, "probability": number, "timeframe": string }],
      "risk_alerts": [{ "risk": string, "severity": "high"|"medium"|"low", "mitigation": string }] }`,
    `Timeframe: ${timeframe}. Categories: ${JSON.stringify(categories || 'all')}.
    Snapshots: ${JSON.stringify(snapshots || [])}.
    Insights: ${JSON.stringify(insights || [])}.`
  )

  return successResponse({ predictions: result }, ctx.corsHeaders)
}

async function handleExpansionOpportunities(ctx: any, params: any) {
  const { target_regions, budget_range } = params

  const { data: orders } = await ctx.supabase
    .from('orders')
    .select('shipping_country, total_amount, currency, created_at')
    .gte('created_at', new Date(Date.now() - 180 * 86400000).toISOString())
    .limit(500)

  const { data: products } = await ctx.supabase
    .from('products')
    .select('category, price, status')
    .eq('status', 'active')
    .limit(200)

  const result = await callAI(
    `You are a global expansion strategist. Analyze current operations and identify international expansion opportunities. Return JSON:
    { "current_footprint": { "active_markets": [...], "revenue_by_region": {...} },
      "opportunities": [{ "region": string, "market_size_estimate": string, "entry_difficulty": "easy"|"moderate"|"hard", "estimated_revenue": string, "requirements": [...], "risks": [...], "timeline": string }],
      "regulatory_considerations": [{ "region": string, "compliance": [...], "tax_implications": string }],
      "recommended_strategy": { "phase1": {...}, "phase2": {...}, "investment_needed": string } }`,
    `Target regions: ${JSON.stringify(target_regions || ['EMEA', 'APAC', 'Americas'])}.
    Budget: ${JSON.stringify(budget_range || 'flexible')}.
    Orders by country: ${JSON.stringify(orders || [])}.
    Active products: ${JSON.stringify(products?.slice(0, 100) || [])}.`
  )

  return successResponse({ expansion: result }, ctx.corsHeaders)
}

async function handleCompetitorLandscape(ctx: any, params: any) {
  const { industry, competitors } = params

  const { data: products } = await ctx.supabase
    .from('products')
    .select('title, price, category, seo_score, status')
    .eq('status', 'active')
    .limit(100)

  const { data: campaigns } = await ctx.supabase
    .from('ad_campaigns')
    .select('name, platform, spend, impressions, clicks, conversions, roas')
    .limit(50)

  const result = await callAI(
    `You are a competitive intelligence analyst. Assess the competitive landscape and positioning. Return JSON:
    { "landscape": { "market_position": string, "competitive_advantage": [...], "gaps": [...] },
      "competitor_profiles": [{ "name": string, "strengths": [...], "weaknesses": [...], "estimated_market_share": number }],
      "differentiation_opportunities": [{ "area": string, "strategy": string, "effort": "low"|"medium"|"high", "impact": "low"|"medium"|"high" }],
      "action_plan": [{ "priority": number, "action": string, "timeline": string, "expected_outcome": string }] }`,
    `Industry: ${industry || 'e-commerce'}.
    Known competitors: ${JSON.stringify(competitors || [])}.
    Our products: ${JSON.stringify(products?.slice(0, 50) || [])}.
    Our campaigns: ${JSON.stringify(campaigns || [])}.`
  )

  return successResponse({ landscape: result }, ctx.corsHeaders)
}
