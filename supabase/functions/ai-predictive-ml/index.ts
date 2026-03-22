import { corsHeaders } from '../_shared/cors.ts'
import { callOpenAI } from '../_shared/ai-client.ts'
import { checkAndIncrementQuota, quotaExceededResponse } from '../_shared/ai-quota.ts'

interface PredictionRequest {
  userId: string
  analysisType: 'revenue' | 'churn' | 'behavior' | 'trends' | 'optimization'
  timeRange?: string
  historicalData: any
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Quota check
    const quota = await checkAndIncrementQuota(user.id, 'automation')
    if (!quota.allowed) return quotaExceededResponse(corsHeaders, quota)

    const { analysisType, timeRange = '30days', historicalData } = await req.json() as PredictionRequest
    console.log(`AI ML Prediction for user ${user.id}, type: ${analysisType}`)

    const prompts = buildPrompts(analysisType, historicalData)

    const result = await callOpenAI(
      [
        { role: 'system', content: prompts.system },
        { role: 'user', content: prompts.user }
      ],
      { module: 'automation', temperature: 0.7, enableCache: true }
    )

    const content = result.choices?.[0]?.message?.content || '{}'
    let mlPredictions: any
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      mlPredictions = JSON.parse(cleaned)
    } catch {
      mlPredictions = { raw: content, predictions: [], insights: [] }
    }

    return new Response(
      JSON.stringify({ success: true, analysis_type: analysisType, predictions: mlPredictions, model: 'gpt-4o-mini', confidence: 0.85 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('AI ML prediction error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function buildPrompts(analysisType: string, historicalData: any) {
  const ordersPreview = JSON.stringify(historicalData.orders?.slice(0, 50) || [])
  const customersPreview = JSON.stringify(historicalData.customers?.slice(0, 30) || [])
  const productsPreview = JSON.stringify(historicalData.products?.slice(0, 30) || [])
  const revenueSummary = JSON.stringify(historicalData.revenueSummary || {})

  switch (analysisType) {
    case 'revenue':
      return {
        system: 'You are an ML revenue forecasting expert. Analyze historical data and predict future revenue. Always respond with valid JSON only, no markdown.',
        user: `Historical Data:\nOrders: ${ordersPreview}\nRevenue Summary: ${revenueSummary}\n\nGenerate revenue predictions for next 6 months. Return JSON:\n{"predictions":[{"month":"string","value":0,"confidence":0.9,"confidence_lower":0,"confidence_upper":0}],"trends":{"growth_rate":0,"seasonality":"string"},"insights":[{"type":"string","message":"string","priority":"high","actions":["string"]}],"recommendations":[{"action":"string","priority":"high"}]}`
      }
    case 'optimization':
      return {
        system: 'You are an ML business optimization expert. Analyze data and provide actionable optimization recommendations. Always respond with valid JSON only, no markdown.',
        user: `Data:\nProducts: ${productsPreview}\nOrders: ${ordersPreview}\nCustomers: ${customersPreview}\n\nGenerate optimization recommendations. Return JSON:\n{"optimizations":[{"type":"pricing","recommendation":"string","predicted_impact":0,"confidence":0.8}],"insights":[{"type":"optimization","message":"string","priority":"high","actions":["string"]}],"quick_wins":[{"action":"string","effort":"low","impact":"high"}]}`
      }
    case 'churn':
      return {
        system: 'You are a customer churn prediction expert. Analyze behavior and predict risk. Always respond with valid JSON only, no markdown.',
        user: `Customer Data: ${customersPreview}\nOrders: ${ordersPreview}\n\nPredict churn risk. Return JSON:\n{"segments":{"high_risk":0,"medium_risk":0,"low_risk":0},"insights":[{"type":"churn","message":"string","priority":"high","actions":["string"]}],"retention_actions":[{"action":"string","target_segment":"high_risk","expected_impact":"string"}]}`
      }
    case 'trends':
      return {
        system: 'You are a market trend analysis expert. Identify category trends and growth opportunities. Always respond with valid JSON only, no markdown.',
        user: `Market Data:\nProducts: ${productsPreview}\nOrders: ${ordersPreview}\n\nAnalyze trends. Return JSON:\n{"category_trends":[{"category":"string","trend":"growing","growth_rate":0,"opportunity_score":0}],"opportunities":[{"type":"string","description":"string","potential_revenue":0,"confidence":0.8}],"insights":[{"category":"string","message":"string","priority":"high","actions":["string"]}]}`
      }
    default:
      return {
        system: 'You are a business analytics AI expert. Always respond with valid JSON only, no markdown.',
        user: `Analyze this data and provide business insights: ${ordersPreview}\nReturn JSON: {"predictions":[],"insights":[],"recommendations":[]}`
      }
  }
}
