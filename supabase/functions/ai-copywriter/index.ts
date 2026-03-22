/**
 * AI Copywriter - Phase 3.2
 * Generates marketing copy: emails, ad copy, landing pages, product descriptions.
 */
import { createEdgeFunction, z } from '../_shared/create-edge-function.ts'
import { callOpenAI } from '../_shared/ai-client.ts'

const copySchema = z.object({
  content_type: z.enum(['email', 'ad_copy', 'landing_page', 'product_description', 'social_post', 'blog_outline']),
  tone: z.enum(['professional', 'casual', 'luxury', 'urgency', 'playful', 'authoritative']).default('professional'),
  brand_name: z.string().max(100).optional(),
  product_name: z.string().max(200).optional(),
  product_info: z.string().max(2000).optional(),
  target_audience: z.string().max(500).optional(),
  key_benefits: z.array(z.string()).max(10).optional(),
  cta: z.string().max(200).optional(),
  language: z.string().max(5).default('fr'),
  variants: z.number().min(1).max(5).default(3),
  max_length: z.number().max(5000).optional(),
})

type CopyInput = z.infer<typeof copySchema>

const handler = createEdgeFunction<CopyInput>({
  requireAuth: true,
  inputSchema: copySchema,
  rateLimit: { maxRequests: 40, windowMinutes: 60, action: 'ai_copywriter' }
}, async (ctx) => {
  const { user, input, correlationId } = ctx
  console.log(`[${correlationId}] Copywriter ${input.content_type} for user ${user.id}`)

  const context = `
Brand: ${input.brand_name || 'N/A'}
Product: ${input.product_name || 'N/A'}
Info: ${input.product_info || 'N/A'}
Audience: ${input.target_audience || 'general'}
Benefits: ${input.key_benefits?.join(', ') || 'N/A'}
CTA: ${input.cta || 'auto'}
Tone: ${input.tone}
Language: ${input.language}
Variants: ${input.variants}`

  const typePrompts: Record<string, string> = {
    email: `Generate ${input.variants} email marketing variants with subject lines, preview text, body (HTML), and CTA buttons.`,
    ad_copy: `Generate ${input.variants} ad copy variants for paid advertising. Include headline, description, display URL suggestion, and CTA. Optimize for CTR.`,
    landing_page: `Generate landing page copy: hero headline + subheadline, 3 benefit sections, social proof section, FAQ (3 items), and final CTA. Single variant, comprehensive.`,
    product_description: `Generate ${input.variants} product description variants optimized for conversion. Include short (50 words) and long (150 words) versions.`,
    social_post: `Generate ${input.variants} social media post variants. Include caption, hashtags, emoji usage, and hook.`,
    blog_outline: `Generate a detailed blog post outline with title, meta description, H2/H3 structure, key points per section, and internal linking suggestions.`,
  }

  const toolParams: Record<string, any> = {
    email: {
      type: 'object',
      properties: {
        variants: { type: 'array', items: { type: 'object', properties: {
          subject: { type: 'string' }, preview_text: { type: 'string' },
          body_html: { type: 'string' }, cta_text: { type: 'string' },
          estimated_open_rate: { type: 'string', enum: ['high', 'medium', 'low'] }
        }, required: ['subject', 'body_html', 'cta_text'] } }
      }, required: ['variants']
    },
    ad_copy: {
      type: 'object',
      properties: {
        variants: { type: 'array', items: { type: 'object', properties: {
          headline: { type: 'string' }, description: { type: 'string' },
          cta: { type: 'string' }, display_url: { type: 'string' },
          platform_fit: { type: 'array', items: { type: 'string' } }
        }, required: ['headline', 'description', 'cta'] } }
      }, required: ['variants']
    },
    landing_page: {
      type: 'object',
      properties: {
        hero: { type: 'object', properties: { headline: { type: 'string' }, subheadline: { type: 'string' }, cta_text: { type: 'string' } }, required: ['headline', 'subheadline'] },
        benefits: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' }, icon_suggestion: { type: 'string' } }, required: ['title', 'description'] } },
        social_proof: { type: 'object', properties: { headline: { type: 'string' }, testimonials: { type: 'array', items: { type: 'object', properties: { quote: { type: 'string' }, author: { type: 'string' } } } } } },
        faq: { type: 'array', items: { type: 'object', properties: { question: { type: 'string' }, answer: { type: 'string' } }, required: ['question', 'answer'] } },
        final_cta: { type: 'object', properties: { headline: { type: 'string' }, button_text: { type: 'string' }, urgency_text: { type: 'string' } } }
      }, required: ['hero', 'benefits', 'faq']
    },
    product_description: {
      type: 'object',
      properties: {
        variants: { type: 'array', items: { type: 'object', properties: {
          short: { type: 'string' }, long: { type: 'string' },
          bullet_points: { type: 'array', items: { type: 'string' } },
          seo_keywords: { type: 'array', items: { type: 'string' } }
        }, required: ['short', 'long'] } }
      }, required: ['variants']
    },
    social_post: {
      type: 'object',
      properties: {
        variants: { type: 'array', items: { type: 'object', properties: {
          caption: { type: 'string' }, hashtags: { type: 'array', items: { type: 'string' } },
          hook: { type: 'string' }, best_platform: { type: 'string' }
        }, required: ['caption', 'hook'] } }
      }, required: ['variants']
    },
    blog_outline: {
      type: 'object',
      properties: {
        title: { type: 'string' }, meta_description: { type: 'string' },
        sections: { type: 'array', items: { type: 'object', properties: {
          heading: { type: 'string' }, level: { type: 'string', enum: ['h2', 'h3'] },
          key_points: { type: 'array', items: { type: 'string' } },
          word_count_target: { type: 'number' }
        }, required: ['heading', 'key_points'] } },
        internal_links: { type: 'array', items: { type: 'string' } },
        estimated_word_count: { type: 'number' }
      }, required: ['title', 'sections']
    }
  }

  const toolName = `generate_${input.content_type}`

  const aiData = await callOpenAI(
    [
      { role: 'system', content: `You are an elite marketing copywriter. Write compelling, conversion-optimized copy. Always match the requested tone and language.` },
      { role: 'user', content: `${typePrompts[input.content_type]}\n\nContext:\n${context}` }
    ],
    {
      module: 'marketing',
      tools: [{ type: 'function', function: { name: toolName, description: `Generate ${input.content_type} copy`, parameters: toolParams[input.content_type] } }],
      tool_choice: { type: 'function', function: { name: toolName } },
      maxTokens: 4000,
      enableCache: true,
    }
  )

  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0]
  let result: any

  if (toolCall) {
    result = JSON.parse(toolCall.function.arguments)
  } else {
    const text = aiData.choices?.[0]?.message?.content || '{}'
    const match = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/)
    result = JSON.parse(match?.[1] || match?.[0] || '{}')
  }

  return new Response(JSON.stringify({ content_type: input.content_type, tone: input.tone, language: input.language, result }), {
    headers: { 'Content-Type': 'application/json' }, status: 200
  })
})

Deno.serve(handler)
