/**
 * AI SEO Optimizer - Phase 3.2
 * Analyses SEO score, generates meta tags, keyword suggestions, and content improvements.
 */
import { createEdgeFunction, z } from '../_shared/create-edge-function.ts'
import { callOpenAI } from '../_shared/ai-client.ts'

const seoSchema = z.object({
  action: z.enum(['analyze', 'optimize_meta', 'keyword_research', 'content_audit']),
  product_id: z.string().uuid().optional(),
  url: z.string().max(500).optional(),
  title: z.string().max(300).optional(),
  description: z.string().max(5000).optional(),
  content: z.string().max(20000).optional(),
  target_keywords: z.array(z.string()).max(10).optional(),
  language: z.string().max(5).default('fr'),
  niche: z.string().max(200).optional(),
})

type SEOInput = z.infer<typeof seoSchema>

const handler = createEdgeFunction<SEOInput>({
  requireAuth: true,
  inputSchema: seoSchema,
  rateLimit: { maxRequests: 30, windowMinutes: 60, action: 'ai_seo_optimizer' }
}, async (ctx) => {
  const { user, input, correlationId } = ctx
  console.log(`[${correlationId}] SEO ${input.action} for user ${user.id}`)

  const prompts: Record<string, { system: string; user: string }> = {
    analyze: {
      system: `You are an expert SEO analyst. Score and analyze SEO elements precisely.`,
      user: `Analyze SEO for:
Title: ${input.title || 'N/A'}
Description: ${input.description || 'N/A'}
Target keywords: ${input.target_keywords?.join(', ') || 'none'}
Language: ${input.language}

Use the seo_analysis tool to return your structured analysis.`
    },
    optimize_meta: {
      system: `You are an SEO meta tag specialist. Generate optimized meta tags for maximum CTR and ranking.`,
      user: `Generate optimized meta tags for:
Title: ${input.title}
Description: ${input.description || ''}
Keywords: ${input.target_keywords?.join(', ') || ''}
Niche: ${input.niche || 'e-commerce'}
Language: ${input.language}

Use the optimized_meta tool to return structured meta tags.`
    },
    keyword_research: {
      system: `You are a keyword research expert. Find high-value, low-competition keywords.`,
      user: `Research keywords for:
Niche: ${input.niche || input.title || 'e-commerce'}
Current keywords: ${input.target_keywords?.join(', ') || 'none'}
Language: ${input.language}

Use the keyword_results tool to return structured keyword data.`
    },
    content_audit: {
      system: `You are a content SEO auditor. Analyze content for SEO quality, readability, and optimization opportunities.`,
      user: `Audit this content for SEO:
Title: ${input.title || 'N/A'}
Content (first 3000 chars): ${(input.content || input.description || '').substring(0, 3000)}
Target keywords: ${input.target_keywords?.join(', ') || 'none'}
Language: ${input.language}

Use the content_audit tool to return structured audit results.`
    }
  }

  const tools: Record<string, any[]> = {
    analyze: [{
      type: 'function',
      function: {
        name: 'seo_analysis',
        description: 'Return SEO analysis results',
        parameters: {
          type: 'object',
          properties: {
            overall_score: { type: 'number', description: 'Score 0-100' },
            title_score: { type: 'number' },
            description_score: { type: 'number' },
            keyword_density: { type: 'number' },
            issues: { type: 'array', items: { type: 'object', properties: { severity: { type: 'string', enum: ['critical', 'warning', 'info'] }, message: { type: 'string' }, fix: { type: 'string' } }, required: ['severity', 'message', 'fix'] } },
            recommendations: { type: 'array', items: { type: 'string' } },
            competitor_gap: { type: 'array', items: { type: 'string' } }
          },
          required: ['overall_score', 'title_score', 'description_score', 'issues', 'recommendations']
        }
      }
    }],
    optimize_meta: [{
      type: 'function',
      function: {
        name: 'optimized_meta',
        description: 'Return optimized meta tags',
        parameters: {
          type: 'object',
          properties: {
            meta_title: { type: 'string', description: 'Optimized title tag (50-60 chars)' },
            meta_description: { type: 'string', description: 'Optimized meta description (150-160 chars)' },
            og_title: { type: 'string' },
            og_description: { type: 'string' },
            h1_suggestion: { type: 'string' },
            alt_titles: { type: 'array', items: { type: 'string' }, description: '3 alternative titles' },
            primary_keyword: { type: 'string' },
            secondary_keywords: { type: 'array', items: { type: 'string' } },
            schema_type: { type: 'string', description: 'Recommended schema.org type' }
          },
          required: ['meta_title', 'meta_description', 'h1_suggestion', 'primary_keyword']
        }
      }
    }],
    keyword_research: [{
      type: 'function',
      function: {
        name: 'keyword_results',
        description: 'Return keyword research results',
        parameters: {
          type: 'object',
          properties: {
            primary_keywords: { type: 'array', items: { type: 'object', properties: { keyword: { type: 'string' }, estimated_volume: { type: 'string', enum: ['high', 'medium', 'low'] }, competition: { type: 'string', enum: ['high', 'medium', 'low'] }, intent: { type: 'string', enum: ['transactional', 'informational', 'navigational', 'commercial'] }, priority: { type: 'number' } }, required: ['keyword', 'estimated_volume', 'competition', 'intent', 'priority'] } },
            long_tail_keywords: { type: 'array', items: { type: 'string' } },
            question_keywords: { type: 'array', items: { type: 'string' } },
            lsi_keywords: { type: 'array', items: { type: 'string' } },
            content_ideas: { type: 'array', items: { type: 'string' } }
          },
          required: ['primary_keywords', 'long_tail_keywords']
        }
      }
    }],
    content_audit: [{
      type: 'function',
      function: {
        name: 'content_audit',
        description: 'Return content audit results',
        parameters: {
          type: 'object',
          properties: {
            readability_score: { type: 'number' },
            seo_score: { type: 'number' },
            word_count_ok: { type: 'boolean' },
            keyword_usage: { type: 'object', properties: { density: { type: 'number' }, in_title: { type: 'boolean' }, in_first_paragraph: { type: 'boolean' }, in_headings: { type: 'boolean' } } },
            improvements: { type: 'array', items: { type: 'object', properties: { area: { type: 'string' }, current: { type: 'string' }, suggested: { type: 'string' }, impact: { type: 'string', enum: ['high', 'medium', 'low'] } }, required: ['area', 'suggested', 'impact'] } },
            missing_elements: { type: 'array', items: { type: 'string' } }
          },
          required: ['readability_score', 'seo_score', 'improvements']
        }
      }
    }]
  }

  const prompt = prompts[input.action]
  const toolDef = tools[input.action]
  const toolName = toolDef[0].function.name

  const aiData = await callOpenAI(
    [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }],
    { module: 'seo', maxTokens: 3000, enableCache: true, tool_choice: { type: 'function', function: { name: toolName } } }
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

  return new Response(JSON.stringify({ action: input.action, result }), {
    headers: { 'Content-Type': 'application/json' }, status: 200
  })
})

Deno.serve(handler)
