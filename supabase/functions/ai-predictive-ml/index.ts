import { corsHeaders } from '../_shared/cors.ts'

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!

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
    // Auth check
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

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(authHeader.replace('Bearer ', ''))
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const authenticatedUserId = claimsData.claims.sub

    const { analysisType, timeRange = '30days', historicalData } = await req.json() as PredictionRequest

    console.log(`AI ML Prediction for user ${authenticatedUserId}, type: ${analysisType}`)

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured')
    }

    // Build prompt based on analysis type
    const prompts = buildPrompts(analysisType, historicalData)

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-nano',
        messages: [
          { role: 'system', content: prompts.system },
          { role: 'user', content: prompts.user }
        ],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required, please add credits.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      const errorText = await response.text()
      console.error('AI Gateway error:', response.status, errorText)
      throw new Error(`AI Gateway error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || '{}'

    // Parse JSON from response (handle markdown code blocks)
    let mlPredictions: any
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      mlPredictions = JSON.parse(cleaned)
    } catch {
      console.error('Failed to parse AI response as JSON, using raw content')
      mlPredictions = { raw: content, predictions: [], insights: [] }
    }

    console.log(`ML predictions generated for ${analysisType}`)

    return new Response(
      JSON.stringify({
        success: true,
        analysis_type: analysisType,
        predictions: mlPredictions,
        model: 'openai/gpt-5-nano',
        confidence: 0.85
      }),
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
        system: `You are an ML revenue forecasting expert. Analyze historical data and predict future revenue. Always respond with valid JSON only, no markdown.`,
        user: `Historical Data:
Orders: ${ordersPreview}
Revenue Summary: ${revenueSummary}

Generate revenue predictions for next 6 months. Return JSON:
{"predictions":[{"month":"string","value":0,"confidence":0.9,"confidence_lower":0,"confidence_upper":0}],"trends":{"growth_rate":0,"seasonality":"string"},"insights":[{"type":"string","message":"string","priority":"high","actions":["string"]}],"recommendations":[{"action":"string","priority":"high"}]}`
      }

    case 'optimization':
      return {
        system: `You are an ML business optimization expert. Analyze data and provide actionable optimization recommendations. Always respond with valid JSON only, no markdown.`,
        user: `Data:
Products: ${productsPreview}
Orders: ${ordersPreview}
Customers: ${customersPreview}

Generate optimization recommendations. Return JSON:
{"optimizations":[{"type":"pricing","recommendation":"string","predicted_impact":0,"confidence":0.8}],"insights":[{"type":"optimization","message":"string","priority":"high","actions":["string"]}],"quick_wins":[{"action":"string","effort":"low","impact":"high"}]}`
      }

    case 'churn':
      return {
        system: `You are a customer churn prediction expert. Analyze behavior and predict risk. Always respond with valid JSON only, no markdown.`,
        user: `Customer Data: ${customersPreview}
Orders: ${ordersPreview}

Predict churn risk. Return JSON:
{"segments":{"high_risk":0,"medium_risk":0,"low_risk":0},"insights":[{"type":"churn","message":"string","priority":"high","actions":["string"]}],"retention_actions":[{"action":"string","target_segment":"high_risk","expected_impact":"string"}]}`
      }

    case 'trends':
      return {
        system: `You are a market trend analysis expert. Identify category trends and growth opportunities. Always respond with valid JSON only, no markdown.`,
        user: `Market Data:
Products: ${productsPreview}
Orders: ${ordersPreview}

Analyze trends. Return JSON:
{"category_trends":[{"category":"string","trend":"growing","growth_rate":0,"opportunity_score":0}],"opportunities":[{"type":"string","description":"string","potential_revenue":0,"confidence":0.8}],"insights":[{"category":"string","message":"string","priority":"high","actions":["string"]}]}`
      }

    default:
      return {
        system: `You are a business analytics AI expert. Always respond with valid JSON only, no markdown.`,
        user: `Analyze this data and provide business insights: ${ordersPreview}
Return JSON: {"predictions":[],"insights":[],"recommendations":[]}`
      }
  }
}
