/**
 * customer-intelligence — SECURED (P0)
 * 
 * Fixes:
 * - REMOVED hardcoded credentials from another project (!)
 * - JWT auth via getClaims()
 * - ANON_KEY + JWT for RLS enforcement
 * - Secure CORS headers
 * - Correct Lovable AI gateway URL
 * - Rate limited: 30 analyses/hour
 */
import { requireAuth, handlePreflight, errorResponse, successResponse } from '../_shared/jwt-auth.ts'
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limiter.ts'

interface CustomerData {
  customer_id: string
  customer_email: string
  customer_name?: string
  total_orders?: number
  total_spent?: number
  avg_order_value?: number
  last_order_date?: string
  first_order_date?: string
}

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    // 1. JWT Auth
    const auth = await requireAuth(req)

    // 2. Rate limit
    const rateCheck = await checkRateLimit(auth.userId, 'customer-intelligence', 30, 60)
    if (!rateCheck.allowed) {
      return rateLimitResponse(auth.corsHeaders, 'Limite atteinte (30/heure).')
    }

    // 3. Parse input
    const body = await req.json().catch(() => null)
    if (!body || !body.customerData) {
      return errorResponse('customerData is required', auth.corsHeaders)
    }

    const customerData: CustomerData = body.customerData
    if (!customerData.customer_id || !customerData.customer_email) {
      return errorResponse('customer_id and customer_email are required', auth.corsHeaders)
    }

    console.log(`[customer-intelligence] User ${auth.userId} analyzing: ${customerData.customer_email}`)

    // 4. AI analysis via Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      return errorResponse('AI service not configured', auth.corsHeaders, 500)
    }

    const prompt = `Analyze this customer's behavior and provide insights:

Customer: ${customerData.customer_name || customerData.customer_email}
Total Orders: ${customerData.total_orders || 0}
Total Spent: $${customerData.total_spent || 0}
Average Order Value: $${customerData.avg_order_value || 0}
Last Order: ${customerData.last_order_date || 'Never'}
First Order: ${customerData.first_order_date || 'Never'}

Respond in JSON format with these exact fields:
{
  "behavioral_score": number (0-100),
  "engagement_level": "low"|"medium"|"high"|"very_high",
  "customer_segment": "vip"|"loyal"|"at_risk"|"new"|"dormant"|"champion",
  "segment_confidence": number (0-100),
  "purchase_frequency": string,
  "lifetime_value": number,
  "predicted_next_purchase_days": number,
  "churn_probability": number (0-100),
  "churn_risk_level": "low"|"medium"|"high"|"critical",
  "key_insights": [string],
  "recommended_actions": [string],
  "preferences": [string]
}`

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a customer analytics expert. Provide accurate, actionable insights. Always respond with valid JSON only.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!aiResponse.ok) {
      const status = aiResponse.status
      await aiResponse.text() // consume body
      return errorResponse(`AI analysis failed: ${status}`, auth.corsHeaders, status >= 500 ? 500 : status)
    }

    const aiData = await aiResponse.json()
    const content = aiData.choices[0]?.message?.content || '{}'

    let analysis: any
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      analysis = JSON.parse(jsonMatch ? jsonMatch[0] : content)
    } catch {
      return errorResponse('Invalid AI response format', auth.corsHeaders, 500)
    }

    // 5. Save via RLS-scoped client
    const { data: savedAnalysis, error: saveError } = await auth.supabase
      .from('customer_behavior_analytics')
      .insert({
        user_id: auth.userId,
        customer_id: customerData.customer_id,
        behavior_type: 'general',
        behavioral_score: analysis.behavioral_score || 50,
        churn_probability: analysis.churn_probability,
        lifetime_value: analysis.lifetime_value,
        analysis_data: {
          customer_email: customerData.customer_email,
          customer_name: customerData.customer_name,
          engagement_level: analysis.engagement_level,
          customer_segment: analysis.customer_segment,
          segment_confidence: analysis.segment_confidence,
          purchase_frequency: analysis.purchase_frequency,
          avg_order_value: customerData.avg_order_value,
          total_orders: customerData.total_orders,
          total_spent: customerData.total_spent,
          predicted_next_purchase_days: analysis.predicted_next_purchase_days,
          churn_risk_level: analysis.churn_risk_level,
          preferences: analysis.preferences,
        },
        recommendations: {
          key_insights: analysis.key_insights || [],
          recommended_actions: analysis.recommended_actions || [],
        },
      })
      .select()
      .single()

    if (saveError) {
      console.error('[customer-intelligence] DB error:', saveError)
      return errorResponse('Failed to save analysis', auth.corsHeaders, 500)
    }

    return successResponse(
      {
        analysis: {
          id: savedAnalysis.id,
          customer_id: savedAnalysis.customer_id,
          customer_email: customerData.customer_email,
          customer_name: customerData.customer_name,
          analysis_date: savedAnalysis.created_at,
          behavioral_score: savedAnalysis.behavioral_score,
          engagement_level: analysis.engagement_level,
          purchase_frequency: analysis.purchase_frequency,
          avg_order_value: customerData.avg_order_value,
          total_orders: customerData.total_orders || 0,
          total_spent: customerData.total_spent || 0,
          customer_segment: analysis.customer_segment,
          segment_confidence: analysis.segment_confidence,
          lifetime_value: savedAnalysis.lifetime_value,
          predicted_next_purchase_days: analysis.predicted_next_purchase_days,
          churn_probability: savedAnalysis.churn_probability,
          churn_risk_level: analysis.churn_risk_level,
          key_insights: analysis.key_insights || [],
          recommended_actions: analysis.recommended_actions || [],
          preferences: analysis.preferences || [],
        },
      },
      auth.corsHeaders
    )
  } catch (error) {
    if (error instanceof Response) return error
    console.error('[customer-intelligence] Error:', error)
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return errorResponse(
      error instanceof Error ? error.message : 'Internal error',
      getSecureCorsHeaders(req.headers.get('origin')),
      500
    )
  }
})
