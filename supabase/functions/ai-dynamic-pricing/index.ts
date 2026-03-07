/**
 * AI Dynamic Pricing - Phase 3.3
 * Recommends optimal prices based on demand, competition, margins, and elasticity.
 */
import { createEdgeFunction, z } from '../_shared/create-edge-function.ts'
import { AI_MODEL, AI_GATEWAY_URL } from '../_shared/ai-config.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const pricingSchema = z.object({
  product_ids: z.array(z.string().uuid()).min(1).max(20).optional(),
  strategy: z.enum(['maximize_revenue', 'maximize_margin', 'maximize_volume', 'competitive', 'penetration']).default('maximize_margin'),
  constraints: z.object({
    min_margin_pct: z.number().min(0).max(100).default(15),
    max_price_change_pct: z.number().min(1).max(50).default(20),
    respect_map: z.boolean().default(true),
  }).optional(),
})

type PricingInput = z.infer<typeof pricingSchema>

const handler = createEdgeFunction<PricingInput>({
  requireAuth: true,
  inputSchema: pricingSchema,
  rateLimit: { maxRequests: 15, windowMinutes: 60, action: 'ai_dynamic_pricing' }
}, async (ctx) => {
  const { user, input, correlationId } = ctx
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured')

  console.log(`[${correlationId}] Dynamic pricing (${input.strategy}) for user ${user.id}`)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const since = new Date(Date.now() - 60 * 86400000).toISOString()

  // Fetch products
  let productsQuery = supabase.from('products')
    .select('id, title, price, cost_price, compare_at_price, stock_quantity, category, sku')
    .eq('user_id', user.id).eq('status', 'active')

  if (input.product_ids?.length) {
    productsQuery = productsQuery.in('id', input.product_ids)
  } else {
    productsQuery = productsQuery.limit(20)
  }

  const [productsRes, orderItemsRes, priceHistoryRes] = await Promise.all([
    productsQuery,
    supabase.from('order_items')
      .select('product_id, qty, unit_price, created_at')
      .gte('created_at', since)
      .limit(1000),
    supabase.from('price_change_history')
      .select('product_id, old_price, new_price, change_reason, created_at')
      .eq('user_id', user.id)
      .gte('created_at', since)
      .limit(200),
  ])

  const products = productsRes.data || []
  const orderItems = orderItemsRes.data || []
  const priceHistory = priceHistoryRes.data || []

  // Build product analysis
  const productAnalysis = products.map((p: any) => {
    const sales = orderItems.filter((i: any) => i.product_id === p.id)
    const totalSold = sales.reduce((s: number, i: any) => s + (i.qty || 1), 0)
    const totalRevenue = sales.reduce((s: number, i: any) => s + (i.unit_price || 0) * (i.qty || 1), 0)
    const margin = p.cost_price ? ((p.price - p.cost_price) / p.price * 100) : null
    const history = priceHistory.filter((h: any) => h.product_id === p.id)

    return {
      id: p.id, title: p.title, current_price: p.price,
      cost_price: p.cost_price, compare_at_price: p.compare_at_price,
      stock: p.stock_quantity, category: p.category,
      units_sold_60d: totalSold, revenue_60d: +totalRevenue.toFixed(2),
      current_margin_pct: margin ? +margin.toFixed(1) : null,
      daily_velocity: +(totalSold / 60).toFixed(2),
      price_changes_count: history.length,
    }
  })

  const constraints = input.constraints || { min_margin_pct: 15, max_price_change_pct: 20, respect_map: true }

  const dataContext = `
Strategy: ${input.strategy}
Constraints: min margin ${constraints.min_margin_pct}%, max price change ±${constraints.max_price_change_pct}%, MAP respected: ${constraints.respect_map}
Products to price (${productAnalysis.length}):
${JSON.stringify(productAnalysis, null, 2)}`

  const aiResponse = await fetch(AI_GATEWAY_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: `You are a pricing optimization AI. Recommend optimal prices based on sales data, margins, stock levels, and the chosen strategy. Always respect constraints. Be precise with numbers.` },
        { role: 'user', content: `Generate dynamic pricing recommendations.\n\n${dataContext}\n\nUse the pricing_recommendations tool.` }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'pricing_recommendations',
          description: 'Return pricing recommendations',
          parameters: {
            type: 'object',
            properties: {
              summary: { type: 'string' },
              total_revenue_impact: { type: 'object', properties: {
                current_projected: { type: 'number' }, optimized_projected: { type: 'number' },
                delta_pct: { type: 'number' }, delta_amount: { type: 'number' }
              }, required: ['current_projected', 'optimized_projected', 'delta_pct'] },
              recommendations: { type: 'array', items: { type: 'object', properties: {
                product_id: { type: 'string' }, title: { type: 'string' },
                current_price: { type: 'number' }, recommended_price: { type: 'number' },
                change_pct: { type: 'number' }, new_margin_pct: { type: 'number' },
                reasoning: { type: 'string' },
                confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
                action: { type: 'string', enum: ['increase', 'decrease', 'keep', 'promotional'] },
                suggested_compare_at: { type: 'number' },
                expected_volume_change_pct: { type: 'number' }
              }, required: ['product_id', 'title', 'current_price', 'recommended_price', 'reasoning', 'confidence', 'action'] } },
              bundle_opportunities: { type: 'array', items: { type: 'object', properties: {
                products: { type: 'array', items: { type: 'string' } },
                bundle_price: { type: 'number' }, savings_pct: { type: 'number' },
                rationale: { type: 'string' }
              }, required: ['products', 'bundle_price'] } },
              pricing_insights: { type: 'array', items: { type: 'string' } }
            },
            required: ['summary', 'total_revenue_impact', 'recommendations']
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'pricing_recommendations' } },
      max_tokens: 5000,
    }),
  })

  if (!aiResponse.ok) {
    const status = aiResponse.status
    if (status === 429 || status === 402) {
      return new Response(JSON.stringify({ error: status === 429 ? 'Rate limit' : 'Crédits épuisés' }), { status, headers: { 'Content-Type': 'application/json' } })
    }
    throw new Error(`AI error: ${status}`)
  }

  const aiData = await aiResponse.json()
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0]
  let result: any

  if (toolCall) {
    result = JSON.parse(toolCall.function.arguments)
  } else {
    const text = aiData.choices?.[0]?.message?.content || '{}'
    const match = text.match(/\{[\s\S]*\}/)
    result = JSON.parse(match?.[0] || '{}')
  }

  return new Response(JSON.stringify({ strategy: input.strategy, constraints, products_analyzed: productAnalysis.length, pricing: result }), {
    headers: { 'Content-Type': 'application/json' }, status: 200
  })
})

Deno.serve(handler)
