import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { action, ...params } = await req.json()

    let result
    switch (action) {
      case 'scan_tiktok_ads':
        result = await scanTikTokAds(params, user.id, supabaseClient)
        break
      case 'score_products':
        result = await scoreProductsWithAI(params, user.id, supabaseClient)
        break
      case 'get_trending':
        result = await getTrendingProducts(user.id, supabaseClient)
        break
      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('AI Scanner error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function scanTikTokAds(params: any, userId: string, supabase: any) {
  const { keywords, category, region = 'US', limit = 20 } = params

  // Use Lovable AI to analyze TikTok ad trends and generate winning product insights
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured')

  const prompt = `You are a TikTok ads product research expert. Analyze current TikTok Shop trends and generate a list of ${limit} winning products for the ${region} market.

${keywords ? `Focus keywords: ${keywords}` : ''}
${category ? `Category focus: ${category}` : ''}

For each product, provide realistic data based on current TikTok Shop trends.`

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: 'You are a TikTok advertising and dropshipping product research AI. You analyze market trends, ad performance data, and consumer behavior to identify winning products.' },
        { role: 'user', content: prompt },
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'return_winning_products',
          description: 'Return analyzed winning products from TikTok ads',
          parameters: {
            type: 'object',
            properties: {
              products: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    category: { type: 'string' },
                    description: { type: 'string' },
                    supplier_price_min: { type: 'number' },
                    supplier_price_max: { type: 'number' },
                    selling_price_suggested: { type: 'number' },
                    margin_percent: { type: 'number' },
                    demand_score: { type: 'number', description: '0-100' },
                    competition_score: { type: 'number', description: '0-100, lower = less competition = better' },
                    trend_score: { type: 'number', description: '0-100' },
                    viral_potential: { type: 'number', description: '0-100' },
                    estimated_daily_orders: { type: 'number' },
                    estimated_monthly_revenue: { type: 'number' },
                    target_audience: { type: 'string' },
                    ad_creative_tips: { type: 'string' },
                    best_selling_variants: { type: 'string' },
                    source_platform: { type: 'string' },
                    trend_direction: { type: 'string', enum: ['rising', 'stable', 'declining'] },
                  },
                  required: ['name', 'category', 'supplier_price_min', 'supplier_price_max', 'selling_price_suggested', 'margin_percent', 'demand_score', 'competition_score', 'trend_score', 'viral_potential', 'trend_direction'],
                  additionalProperties: false,
                },
              },
            },
            required: ['products'],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: 'function', function: { name: 'return_winning_products' } },
    }),
  })

  if (!response.ok) {
    if (response.status === 429) throw new Error('Rate limit exceeded. Please try again later.')
    if (response.status === 402) throw new Error('AI credits exhausted. Please add funds.')
    throw new Error('AI analysis failed')
  }

  const aiData = await response.json()
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0]
  if (!toolCall) throw new Error('AI did not return structured data')

  const parsed = JSON.parse(toolCall.function.arguments)
  const products = parsed.products || []

  // Calculate overall winning score for each product
  const scoredProducts = products.map((p: any, index: number) => ({
    id: `scan_${Date.now()}_${index}`,
    ...p,
    overall_score: Math.round(
      (p.demand_score * 0.3) +
      ((100 - p.competition_score) * 0.2) +
      (p.trend_score * 0.25) +
      (p.viral_potential * 0.15) +
      (Math.min(p.margin_percent, 100) * 0.1)
    ),
    scanned_at: new Date().toISOString(),
    source: 'tiktok_ads_ai',
  }))

  // Sort by score
  scoredProducts.sort((a: any, b: any) => b.overall_score - a.overall_score)

  // Store scan results
  await supabase.from('ai_optimization_jobs').insert({
    user_id: userId,
    job_type: 'winning_product_scan',
    status: 'completed',
    input_data: { keywords, category, region, limit },
    output_data: { products: scoredProducts },
    metrics: { products_found: scoredProducts.length, avg_score: scoredProducts.reduce((s: number, p: any) => s + p.overall_score, 0) / scoredProducts.length },
    completed_at: new Date().toISOString(),
  })

  return {
    success: true,
    products: scoredProducts,
    scan_meta: {
      total: scoredProducts.length,
      avg_score: Math.round(scoredProducts.reduce((s: number, p: any) => s + p.overall_score, 0) / scoredProducts.length),
      top_category: scoredProducts[0]?.category,
      scanned_at: new Date().toISOString(),
    },
  }
}

async function scoreProductsWithAI(params: any, userId: string, supabase: any) {
  const { product_ids } = params

  const { data: products } = await supabase
    .from('imported_products')
    .select('*')
    .in('id', product_ids)

  if (!products?.length) throw new Error('No products found')

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured')

  const productList = products.map((p: any) => `- ${p.name} (${p.price}${p.currency || 'USD'}, category: ${p.category || 'unknown'})`).join('\n')

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: 'You are an expert dropshipping product scorer for TikTok Shop.' },
        { role: 'user', content: `Score these products for TikTok Shop potential (0-100):\n${productList}` },
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'return_scores',
          description: 'Return product scores',
          parameters: {
            type: 'object',
            properties: {
              scores: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    product_index: { type: 'number' },
                    tiktok_score: { type: 'number' },
                    viral_potential: { type: 'number' },
                    recommendation: { type: 'string' },
                  },
                  required: ['product_index', 'tiktok_score', 'viral_potential', 'recommendation'],
                  additionalProperties: false,
                },
              },
            },
            required: ['scores'],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: 'function', function: { name: 'return_scores' } },
    }),
  })

  if (!response.ok) throw new Error('AI scoring failed')

  const aiData = await response.json()
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0]
  const parsed = JSON.parse(toolCall.function.arguments)

  return {
    success: true,
    scores: parsed.scores.map((s: any) => ({
      ...s,
      product_id: products[s.product_index]?.id,
      product_name: products[s.product_index]?.name,
    })),
  }
}

async function getTrendingProducts(userId: string, supabase: any) {
  // Fetch recent scan results
  const { data: jobs } = await supabase
    .from('ai_optimization_jobs')
    .select('output_data, created_at')
    .eq('user_id', userId)
    .eq('job_type', 'winning_product_scan')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(5)

  const allProducts = jobs?.flatMap((j: any) => j.output_data?.products || []) || []

  // Deduplicate by name and take highest scored
  const uniqueMap = new Map()
  for (const p of allProducts) {
    const key = p.name.toLowerCase()
    if (!uniqueMap.has(key) || uniqueMap.get(key).overall_score < p.overall_score) {
      uniqueMap.set(key, p)
    }
  }

  const trending = Array.from(uniqueMap.values())
    .sort((a, b) => b.overall_score - a.overall_score)
    .slice(0, 30)

  return { success: true, products: trending }
}
