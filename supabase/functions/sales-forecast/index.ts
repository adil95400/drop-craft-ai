/**
 * Sales Forecast — SECURED (JWT-first, RLS-enforced, Lovable AI Gateway)
 */
import { requireAuth, handlePreflight, successResponse, errorResponse } from '../_shared/jwt-auth.ts'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const { productId, timePeriod, analysisType } = await req.json()

    // RLS-scoped queries
    const [ordersRes, customersRes, productsRes] = await Promise.all([
      supabase.from('orders').select('id, total_amount, created_at, status')
        .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('customers').select('id, created_at'),
      supabase.from('imported_products').select('id, title, price, stock_quantity'),
    ])

    const orders = ordersRes.data || []
    const customers = customersRes.data || []
    const products = productsRes.data || []

    console.log('[SALES-FORECAST] Data retrieved', { orders: orders.length, customers: customers.length, products: products.length })

    // Use Lovable AI Gateway (no API key needed)
    const prompt = `You are a predictive sales analyst for e-commerce. Analyze:
- Orders: ${orders.length} over 12 months
- Customers: ${customers.length} total
- Products: ${products.length}
- Analysis type: ${analysisType || 'general'}
- Period: ${timePeriod || '6_months'}
- Product filter: ${productId || 'all'}

Respond ONLY in valid JSON:
{
  "predictions": {
    "3_months": { "revenue": number, "orders": number, "growth_rate": number },
    "6_months": { "revenue": number, "orders": number, "growth_rate": number },
    "12_months": { "revenue": number, "orders": number, "growth_rate": number }
  },
  "confidence_score": number,
  "market_insights": { "seasonal_trends": string, "demand_patterns": string, "competitive_position": string },
  "recommended_actions": [{ "priority": "high|medium|low", "action": string, "impact": string }],
  "risk_factors": [string],
  "opportunities": [string]
}`

    const aiResponse = await fetch('https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1/unified-ai', {
      method: 'POST',
      headers: {
        'Authorization': req.headers.get('Authorization')!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
      }),
    })

    const aiResult = await aiResponse.json()
    const content = aiResult.choices?.[0]?.message?.content || '{}'
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const aiAnalysis = JSON.parse(cleaned)

    // Save via RLS-scoped client
    const { data: savedAnalysis } = await supabase
      .from('sales_intelligence')
      .insert({
        user_id: userId,
        product_id: productId,
        analysis_type: 'forecast',
        time_period: timePeriod,
        predictions: aiAnalysis.predictions,
        confidence_score: aiAnalysis.confidence_score,
        market_insights: aiAnalysis.market_insights,
        recommended_actions: aiAnalysis.recommended_actions,
      })
      .select('id')
      .single()

    return successResponse({
      success: true,
      analysis: aiAnalysis,
      analysisId: savedAnalysis?.id,
    }, corsHeaders)

  } catch (err) {
    if (err instanceof Response) return err
    console.error('[SALES-FORECAST] Error:', err)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...getSecureCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  }
})
