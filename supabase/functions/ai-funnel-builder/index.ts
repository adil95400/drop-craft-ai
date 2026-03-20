/**
 * AI Funnel Builder - Phase 3.2
 * Generates complete sales funnel strategies with page sequences, copy, and conversion optimization.
 */
import { createEdgeFunction, z } from '../_shared/create-edge-function.ts'
import { AI_MODEL, AI_GATEWAY_URL } from '../_shared/ai-config.ts'

const funnelSchema = z.object({
  funnel_type: z.enum(['lead_magnet', 'product_launch', 'webinar', 'tripwire', 'evergreen', 'flash_sale']),
  product_name: z.string().max(200),
  product_price: z.number().optional(),
  target_audience: z.string().max(500),
  niche: z.string().max(200).optional(),
  brand_name: z.string().max(100).optional(),
  budget: z.enum(['low', 'medium', 'high']).default('medium'),
  language: z.string().max(5).default('fr'),
})

type FunnelInput = z.infer<typeof funnelSchema>

const handler = createEdgeFunction<FunnelInput>({
  requireAuth: true,
  inputSchema: funnelSchema,
  rateLimit: { maxRequests: 15, windowMinutes: 60, action: 'ai_funnel_builder' }
}, async (ctx) => {
  const { user, input, correlationId } = ctx
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured')

  console.log(`[${correlationId}] Funnel ${input.funnel_type} for user ${user.id}`)

  const systemPrompt = `You are an expert sales funnel architect and conversion rate optimizer.
Design complete, actionable sales funnels with specific copy, email sequences, and conversion strategies.
Always think about the customer journey from awareness to purchase.`

  const userPrompt = `Design a complete ${input.funnel_type} funnel:
Product: ${input.product_name} (${input.product_price ? '€' + input.product_price : 'price TBD'})
Brand: ${input.brand_name || 'N/A'}
Audience: ${input.target_audience}
Niche: ${input.niche || 'e-commerce'}
Budget: ${input.budget}
Language: ${input.language}

Use the build_funnel tool to return the complete funnel structure.`

  const aiResponse = await fetch(AI_GATEWAY_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      tools: [{
        type: 'function',
        function: {
          name: 'build_funnel',
          description: 'Build a complete sales funnel',
          parameters: {
            type: 'object',
            properties: {
              funnel_name: { type: 'string' },
              summary: { type: 'string', description: 'Brief strategy overview' },
              estimated_conversion_rate: { type: 'string' },
              stages: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    stage_name: { type: 'string' },
                    stage_type: { type: 'string', enum: ['awareness', 'interest', 'consideration', 'conversion', 'retention'] },
                    channel: { type: 'string' },
                    page_type: { type: 'string', enum: ['landing_page', 'opt_in', 'sales_page', 'checkout', 'upsell', 'thank_you', 'email'] },
                    headline: { type: 'string' },
                    copy_brief: { type: 'string' },
                    cta: { type: 'string' },
                    kpi: { type: 'string' },
                    tips: { type: 'array', items: { type: 'string' } }
                  },
                  required: ['stage_name', 'stage_type', 'page_type', 'headline', 'cta']
                }
              },
              email_sequence: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    day: { type: 'number' },
                    subject: { type: 'string' },
                    purpose: { type: 'string' },
                    key_message: { type: 'string' },
                    cta: { type: 'string' }
                  },
                  required: ['day', 'subject', 'purpose']
                }
              },
              traffic_sources: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    source: { type: 'string' },
                    strategy: { type: 'string' },
                    budget_allocation: { type: 'string' },
                    expected_cpa: { type: 'string' }
                  },
                  required: ['source', 'strategy']
                }
              },
              optimization_tips: { type: 'array', items: { type: 'string' } },
              estimated_timeline_days: { type: 'number' }
            },
            required: ['funnel_name', 'summary', 'stages', 'email_sequence', 'traffic_sources']
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'build_funnel' } },
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
    const match = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/)
    result = JSON.parse(match?.[1] || match?.[0] || '{}')
  }

  return new Response(JSON.stringify({ funnel_type: input.funnel_type, result }), {
    headers: { 'Content-Type': 'application/json' }, status: 200
  })
})

Deno.serve(handler)
