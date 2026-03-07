/**
 * AI Demand Predictor - Phase 3.3
 * Predicts product/category demand using sales velocity, trends, and seasonal patterns.
 */
import { createEdgeFunction, z } from '../_shared/create-edge-function.ts'
import { AI_MODEL, AI_GATEWAY_URL } from '../_shared/ai-config.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const demandSchema = z.object({
  scope: z.enum(['product', 'category', 'global']).default('global'),
  product_id: z.string().uuid().optional(),
  category: z.string().max(200).optional(),
  horizon_days: z.number().min(7).max(180).default(30),
})

type DemandInput = z.infer<typeof demandSchema>

const handler = createEdgeFunction<DemandInput>({
  requireAuth: true,
  inputSchema: demandSchema,
  rateLimit: { maxRequests: 20, windowMinutes: 60, action: 'ai_demand_prediction' }
}, async (ctx) => {
  const { user, input, correlationId } = ctx
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured')

  console.log(`[${correlationId}] Demand prediction (${input.scope}) for user ${user.id}`)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const since = new Date(Date.now() - 90 * 86400000).toISOString()

  // Fetch sales data
  let orderItemsQuery = supabase.from('order_items')
    .select('product_id, qty, unit_price, created_at, products!inner(title, category, stock_quantity, price)')
    .eq('products.user_id', user.id)
    .gte('created_at', since)
    .order('created_at', { ascending: true })
    .limit(1000)

  if (input.scope === 'product' && input.product_id) {
    orderItemsQuery = orderItemsQuery.eq('product_id', input.product_id)
  }

  const [itemsRes, productsRes] = await Promise.all([
    orderItemsQuery,
    supabase.from('products').select('id, title, category, stock_quantity, price, cost_price, status')
      .eq('user_id', user.id).eq('status', 'active').limit(200),
  ])

  const items = itemsRes.data || []
  const products = productsRes.data || []

  // Aggregate sales velocity per product
  const productSales: Record<string, { title: string; category: string; totalQty: number; totalRevenue: number; stock: number; salesByWeek: Record<string, number> }> = {}

  items.forEach((item: any) => {
    const pid = item.product_id
    if (!productSales[pid]) {
      productSales[pid] = {
        title: item.products?.title || 'Unknown',
        category: item.products?.category || 'uncategorized',
        totalQty: 0, totalRevenue: 0,
        stock: item.products?.stock_quantity || 0,
        salesByWeek: {}
      }
    }
    productSales[pid].totalQty += item.qty || 1
    productSales[pid].totalRevenue += (item.unit_price || 0) * (item.qty || 1)
    const weekKey = new Date(item.created_at).toISOString().substring(0, 10)
    productSales[pid].salesByWeek[weekKey] = (productSales[pid].salesByWeek[weekKey] || 0) + (item.qty || 1)
  })

  // Filter by category if needed
  let filteredSales = productSales
  if (input.scope === 'category' && input.category) {
    filteredSales = Object.fromEntries(
      Object.entries(productSales).filter(([, v]) => v.category.toLowerCase().includes(input.category!.toLowerCase()))
    )
  }

  // Top products by velocity
  const topProducts = Object.entries(filteredSales)
    .sort(([, a], [, b]) => b.totalQty - a.totalQty)
    .slice(0, 20)
    .map(([id, data]) => ({
      id, title: data.title, category: data.category,
      total_sold: data.totalQty, revenue: data.totalRevenue,
      current_stock: data.stock,
      daily_velocity: +(data.totalQty / 90).toFixed(2),
      days_of_stock: data.stock > 0 ? Math.round(data.stock / Math.max(data.totalQty / 90, 0.01)) : 0,
    }))

  const dataContext = `
Scope: ${input.scope}${input.category ? ` (category: ${input.category})` : ''}${input.product_id ? ` (product: ${input.product_id})` : ''}
Horizon: ${input.horizon_days} days
Total active products: ${products.length}
Products with sales data: ${Object.keys(filteredSales).length}
Top products by velocity: ${JSON.stringify(topProducts.slice(0, 10))}
Current date: ${new Date().toISOString().split('T')[0]}`

  const aiResponse = await fetch(AI_GATEWAY_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: `You are a demand forecasting AI for e-commerce. Analyze sales velocity, stock levels, and seasonal patterns to predict future demand accurately.` },
        { role: 'user', content: `Predict demand for the next ${input.horizon_days} days.\n\n${dataContext}\n\nUse the demand_prediction tool.` }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'demand_prediction',
          description: 'Return demand prediction results',
          parameters: {
            type: 'object',
            properties: {
              summary: { type: 'string' },
              overall_trend: { type: 'string', enum: ['growing', 'stable', 'declining'] },
              predicted_total_units: { type: 'number' },
              predicted_revenue: { type: 'number' },
              products_at_risk: { type: 'array', items: { type: 'object', properties: {
                product_id: { type: 'string' }, title: { type: 'string' },
                risk_type: { type: 'string', enum: ['stockout', 'overstock', 'declining_demand', 'seasonal_drop'] },
                days_until_stockout: { type: 'number' },
                recommended_reorder_qty: { type: 'number' },
                urgency: { type: 'string', enum: ['critical', 'warning', 'info'] }
              }, required: ['title', 'risk_type', 'urgency'] } },
              high_demand_products: { type: 'array', items: { type: 'object', properties: {
                product_id: { type: 'string' }, title: { type: 'string' },
                predicted_demand: { type: 'number' }, current_stock: { type: 'number' },
                growth_rate: { type: 'string' }, recommendation: { type: 'string' }
              }, required: ['title', 'predicted_demand'] } },
              category_breakdown: { type: 'array', items: { type: 'object', properties: {
                category: { type: 'string' }, trend: { type: 'string' },
                predicted_units: { type: 'number' }, share_pct: { type: 'number' }
              }, required: ['category', 'trend'] } },
              reorder_alerts: { type: 'array', items: { type: 'object', properties: {
                product_id: { type: 'string' }, title: { type: 'string' },
                reorder_by: { type: 'string' }, suggested_qty: { type: 'number' },
                estimated_cost: { type: 'number' }
              }, required: ['title', 'reorder_by', 'suggested_qty'] } },
              seasonal_insights: { type: 'string' }
            },
            required: ['summary', 'overall_trend', 'predicted_total_units', 'products_at_risk', 'high_demand_products']
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'demand_prediction' } },
      max_tokens: 4000,
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

  return new Response(JSON.stringify({ scope: input.scope, horizon_days: input.horizon_days, top_products: topProducts.slice(0, 5), prediction: result }), {
    headers: { 'Content-Type': 'application/json' }, status: 200
  })
})

Deno.serve(handler)
