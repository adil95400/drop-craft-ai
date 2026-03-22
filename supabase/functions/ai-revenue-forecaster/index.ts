/**
 * AI Revenue Forecaster - Phase 3.3
 * Predicts revenue trajectories at 30/60/90 days using historical data and AI reasoning.
 */
import { createEdgeFunction, z } from '../_shared/create-edge-function.ts'
import { callOpenAI } from '../_shared/ai-client.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const forecastSchema = z.object({
  period: z.enum(['30', '60', '90']).default('30'),
  granularity: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
  include_seasonality: z.boolean().default(true),
  scenario: z.enum(['optimistic', 'realistic', 'pessimistic']).default('realistic'),
})

type ForecastInput = z.infer<typeof forecastSchema>

const handler = createEdgeFunction<ForecastInput>({
  requireAuth: true,
  inputSchema: forecastSchema,
  rateLimit: { maxRequests: 15, windowMinutes: 60, action: 'ai_revenue_forecast' }
}, async (ctx) => {
  const { user, input, correlationId } = ctx
  console.log(`[${correlationId}] Revenue forecast ${input.period}d for user ${user.id}`)

  // Fetch real historical data
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const lookbackDays = parseInt(input.period) * 2
  const since = new Date(Date.now() - lookbackDays * 86400000).toISOString()

  const [ordersRes, productsRes, snapshotsRes] = await Promise.all([
    supabase.from('orders').select('total_amount, created_at, status, profit_margin')
      .eq('user_id', user.id).gte('created_at', since).order('created_at', { ascending: true }).limit(500),
    supabase.from('products').select('price, cost_price, stock_quantity, category, status')
      .eq('user_id', user.id).eq('status', 'active').limit(200),
    supabase.from('analytics_snapshots').select('metrics, snapshot_date, snapshot_type')
      .eq('user_id', user.id).gte('snapshot_date', since).order('snapshot_date', { ascending: true }).limit(100),
  ])

  const orders = ordersRes.data || []
  const products = productsRes.data || []
  const snapshots = snapshotsRes.data || []

  // Aggregate historical revenue by week
  const weeklyRevenue: Record<string, number> = {}
  const weeklyOrders: Record<string, number> = {}
  orders.forEach((o: any) => {
    if (o.status === 'cancelled') return
    const d = new Date(o.created_at)
    const week = `${d.getFullYear()}-W${Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7).toString().padStart(2, '0')}`
    weeklyRevenue[week] = (weeklyRevenue[week] || 0) + (o.total_amount || 0)
    weeklyOrders[week] = (weeklyOrders[week] || 0) + 1
  })

  const totalRevenue = orders.reduce((s: number, o: any) => s + (o.status !== 'cancelled' ? (o.total_amount || 0) : 0), 0)
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0
  const avgMargin = orders.reduce((s: number, o: any) => s + (o.profit_margin || 0), 0) / Math.max(orders.length, 1)
  const totalStock = products.reduce((s: number, p: any) => s + (p.stock_quantity || 0), 0)
  const avgProductPrice = products.length > 0 ? products.reduce((s: number, p: any) => s + (p.price || 0), 0) / products.length : 0

  const dataContext = `
Historical data (last ${lookbackDays} days):
- Total revenue: €${totalRevenue.toFixed(2)}
- Total orders: ${orders.length}
- Average order value: €${avgOrderValue.toFixed(2)}
- Average margin: ${(avgMargin * 100).toFixed(1)}%
- Active products: ${products.length}
- Total stock: ${totalStock} units
- Average product price: €${avgProductPrice.toFixed(2)}
- Weekly revenue breakdown: ${JSON.stringify(weeklyRevenue)}
- Weekly orders breakdown: ${JSON.stringify(weeklyOrders)}
- Scenario: ${input.scenario}
- Include seasonality: ${input.include_seasonality}`

  const aiData = await callOpenAI(
    [
        { role: 'system', content: `You are a financial forecasting AI. Analyze e-commerce revenue data and produce accurate forecasts with confidence intervals. Be data-driven and realistic.` },
        { role: 'user', content: `Forecast revenue for the next ${input.period} days (${input.granularity} granularity, ${input.scenario} scenario).\n\n${dataContext}\n\nUse the revenue_forecast tool.` }
      ],
    { module: 'automation', maxTokens: 4000, enableCache: true, tools: [{
        type: 'function',
        function: {
          name: 'revenue_forecast',
          description: 'Return revenue forecast',
          parameters: {
            type: 'object',
            properties: {
              summary: { type: 'string' },
              total_predicted_revenue: { type: 'number' },
              confidence_interval: { type: 'object', properties: { low: { type: 'number' }, high: { type: 'number' }, confidence_pct: { type: 'number' } }, required: ['low', 'high'] },
              growth_rate_pct: { type: 'number' },
              predicted_orders: { type: 'number' },
              predicted_aov: { type: 'number' },
              timeline: { type: 'array', items: { type: 'object', properties: { period: { type: 'string' }, revenue: { type: 'number' }, orders: { type: 'number' }, cumulative: { type: 'number' } }, required: ['period', 'revenue'] } },
              risk_factors: { type: 'array', items: { type: 'object', properties: { factor: { type: 'string' }, impact: { type: 'string', enum: ['high', 'medium', 'low'] }, mitigation: { type: 'string' } }, required: ['factor', 'impact'] } },
              opportunities: { type: 'array', items: { type: 'object', properties: { opportunity: { type: 'string' }, potential_revenue: { type: 'number' }, effort: { type: 'string', enum: ['low', 'medium', 'high'] } }, required: ['opportunity'] } },
              seasonality_notes: { type: 'string' }
            },
            required: ['summary', 'total_predicted_revenue', 'confidence_interval', 'timeline', 'risk_factors']
          }
        }
      }], tool_choice: { type: 'function', function: { name: 'revenue_forecast' } }
    }
  )

  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0]
  let result: any

  if (toolCall) {
    result = JSON.parse(toolCall.function.arguments)
  } else {
    const text = aiData.choices?.[0]?.message?.content || '{}'
    const match = text.match(/\{[\s\S]*\}/)
    result = JSON.parse(match?.[0] || '{}')
  }

  // Store snapshot
  await supabase.from('analytics_snapshots').insert({
    user_id: user.id,
    snapshot_type: 'revenue_forecast',
    snapshot_date: new Date().toISOString().split('T')[0],
    metrics: { period: input.period, scenario: input.scenario, ...result },
  })

  return new Response(JSON.stringify({ period: input.period, scenario: input.scenario, historical: { totalRevenue, orderCount: orders.length, avgOrderValue, avgMargin }, forecast: result }), {
    headers: { 'Content-Type': 'application/json' }, status: 200
  })
})

Deno.serve(handler)
