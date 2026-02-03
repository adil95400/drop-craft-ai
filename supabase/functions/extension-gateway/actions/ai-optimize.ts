/**
 * AI Optimization Handler
 * Handles AI_OPTIMIZE_* and AI_GENERATE_* actions
 */

import { z } from "zod"
import { GatewayContext, HandlerResult } from '../types.ts'

// =============================================================================
// SCHEMAS
// =============================================================================

const AIOptimizePayload = z.object({
  product: z.object({
    title: z.string().min(1).max(500),
    description: z.string().max(10000).optional(),
    category: z.string().max(100).optional(),
    keywords: z.array(z.string()).max(20).optional(),
  }),
  language: z.string().max(5).optional().default('fr'),
  tone: z.enum(['professional', 'casual', 'luxury', 'fun']).optional().default('professional'),
})

// =============================================================================
// AI PROMPTS
// =============================================================================

const PROMPTS = {
  title: (product: any, language: string) => `
Optimize this e-commerce product title for maximum conversion and SEO.
Current title: "${product.title}"
Category: ${product.category || 'General'}

Requirements:
- Keep under 80 characters
- Include primary keyword
- Be compelling and click-worthy
- Language: ${language}

Return ONLY the optimized title, nothing else.
`,
  
  description: (product: any, language: string) => `
Write a compelling product description for e-commerce.
Product: "${product.title}"
Current description: "${product.description || 'None'}"
Category: ${product.category || 'General'}

Requirements:
- 150-300 words
- Highlight benefits, not just features
- Include emotional triggers
- Easy to scan with short paragraphs
- Language: ${language}

Return ONLY the description, no markdown formatting.
`,

  full: (product: any, language: string) => `
Create a complete product listing optimization:
Product: "${product.title}"
Description: "${product.description || 'None'}"
Category: ${product.category || 'General'}

Provide:
1. Optimized title (under 80 chars)
2. SEO meta description (under 160 chars)
3. Full description (150-300 words)
4. 5 bullet points for key features
5. 10 relevant keywords/tags

Language: ${language}
Format as JSON with keys: title, metaDescription, description, bulletPoints (array), keywords (array)
`,

  seo: (product: any, language: string) => `
Generate SEO metadata for this product:
Title: "${product.title}"
Description: "${product.description || 'None'}"
Category: ${product.category || 'General'}

Provide:
1. SEO title (under 60 chars)
2. Meta description (under 160 chars)
3. Focus keyword
4. Secondary keywords (5)
5. Open Graph title
6. Open Graph description

Language: ${language}
Format as JSON with keys: seoTitle, metaDescription, focusKeyword, secondaryKeywords (array), ogTitle, ogDescription
`,

  tags: (product: any, language: string) => `
Generate relevant tags/keywords for this e-commerce product:
Title: "${product.title}"
Description: "${product.description || 'None'}"
Category: ${product.category || 'General'}

Requirements:
- 10-15 relevant tags
- Mix of broad and specific terms
- Include category terms
- Include use-case terms
- Language: ${language}

Return ONLY a JSON array of strings, nothing else.
`,
}

// =============================================================================
// AI CALL HELPER
// =============================================================================

async function callAI(prompt: string): Promise<string> {
  const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY')
  
  if (!openRouterApiKey) {
    throw new Error('AI service not configured')
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://shopopti.io',
      'X-Title': 'ShopOpti Extension',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`AI request failed: ${error}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

// =============================================================================
// HANDLERS
// =============================================================================

async function optimizeTitle(payload: any, ctx: GatewayContext): Promise<HandlerResult> {
  const parsed = AIOptimizePayload.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: { code: 'INVALID_PAYLOAD', message: 'Invalid payload' } }
  }

  try {
    const prompt = PROMPTS.title(parsed.data.product, parsed.data.language)
    const optimizedTitle = await callAI(prompt)

    // Log action
    await ctx.supabase.from('extension_action_logs').insert({
      user_id: ctx.userId,
      action_type: 'AI_OPTIMIZE_TITLE',
      action_status: 'success',
      product_title: parsed.data.product.title?.substring(0, 200),
      metadata: { optimizationType: 'title', language: parsed.data.language },
      extension_version: ctx.extensionVersion,
    }).catch(() => {})

    return {
      success: true,
      data: {
        original: parsed.data.product.title,
        optimized: optimizedTitle.trim(),
      }
    }
  } catch (error) {
    return { success: false, error: { code: 'HANDLER_ERROR', message: error.message } }
  }
}

async function optimizeDescription(payload: any, ctx: GatewayContext): Promise<HandlerResult> {
  const parsed = AIOptimizePayload.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: { code: 'INVALID_PAYLOAD', message: 'Invalid payload' } }
  }

  try {
    const prompt = PROMPTS.description(parsed.data.product, parsed.data.language)
    const optimizedDesc = await callAI(prompt)

    await ctx.supabase.from('extension_action_logs').insert({
      user_id: ctx.userId,
      action_type: 'AI_OPTIMIZE_DESCRIPTION',
      action_status: 'success',
      product_title: parsed.data.product.title?.substring(0, 200),
      metadata: { optimizationType: 'description', language: parsed.data.language },
      extension_version: ctx.extensionVersion,
    }).catch(() => {})

    return {
      success: true,
      data: {
        original: parsed.data.product.description,
        optimized: optimizedDesc.trim(),
      }
    }
  } catch (error) {
    return { success: false, error: { code: 'HANDLER_ERROR', message: error.message } }
  }
}

async function optimizeFull(payload: any, ctx: GatewayContext): Promise<HandlerResult> {
  const parsed = AIOptimizePayload.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: { code: 'INVALID_PAYLOAD', message: 'Invalid payload' } }
  }

  try {
    const prompt = PROMPTS.full(parsed.data.product, parsed.data.language)
    const result = await callAI(prompt)

    // Try to parse as JSON
    let parsedResult: any
    try {
      // Extract JSON from response
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      parsedResult = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: result }
    } catch {
      parsedResult = { raw: result }
    }

    await ctx.supabase.from('extension_action_logs').insert({
      user_id: ctx.userId,
      action_type: 'AI_OPTIMIZE_FULL',
      action_status: 'success',
      product_title: parsed.data.product.title?.substring(0, 200),
      metadata: { optimizationType: 'full', language: parsed.data.language },
      extension_version: ctx.extensionVersion,
    }).catch(() => {})

    return {
      success: true,
      data: parsedResult
    }
  } catch (error) {
    return { success: false, error: { code: 'HANDLER_ERROR', message: error.message } }
  }
}

async function generateSEO(payload: any, ctx: GatewayContext): Promise<HandlerResult> {
  const parsed = AIOptimizePayload.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: { code: 'INVALID_PAYLOAD', message: 'Invalid payload' } }
  }

  try {
    const prompt = PROMPTS.seo(parsed.data.product, parsed.data.language)
    const result = await callAI(prompt)

    let parsedResult: any
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      parsedResult = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: result }
    } catch {
      parsedResult = { raw: result }
    }

    await ctx.supabase.from('extension_action_logs').insert({
      user_id: ctx.userId,
      action_type: 'AI_GENERATE_SEO',
      action_status: 'success',
      product_title: parsed.data.product.title?.substring(0, 200),
      metadata: { optimizationType: 'seo', language: parsed.data.language },
      extension_version: ctx.extensionVersion,
    }).catch(() => {})

    return {
      success: true,
      data: parsedResult
    }
  } catch (error) {
    return { success: false, error: { code: 'HANDLER_ERROR', message: error.message } }
  }
}

async function generateTags(payload: any, ctx: GatewayContext): Promise<HandlerResult> {
  const parsed = AIOptimizePayload.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: { code: 'INVALID_PAYLOAD', message: 'Invalid payload' } }
  }

  try {
    const prompt = PROMPTS.tags(parsed.data.product, parsed.data.language)
    const result = await callAI(prompt)

    let tags: string[]
    try {
      const jsonMatch = result.match(/\[[\s\S]*\]/)
      tags = jsonMatch ? JSON.parse(jsonMatch[0]) : [result]
    } catch {
      tags = result.split(',').map(t => t.trim()).filter(Boolean)
    }

    await ctx.supabase.from('extension_action_logs').insert({
      user_id: ctx.userId,
      action_type: 'AI_GENERATE_TAGS',
      action_status: 'success',
      product_title: parsed.data.product.title?.substring(0, 200),
      metadata: { optimizationType: 'tags', language: parsed.data.language, tagsCount: tags.length },
      extension_version: ctx.extensionVersion,
    }).catch(() => {})

    return {
      success: true,
      data: { tags }
    }
  } catch (error) {
    return { success: false, error: { code: 'HANDLER_ERROR', message: error.message } }
  }
}

// =============================================================================
// ROUTER
// =============================================================================

export async function handleAIAction(
  action: string,
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  switch (action) {
    case 'AI_OPTIMIZE_TITLE':
      return optimizeTitle(payload, ctx)
    case 'AI_OPTIMIZE_DESCRIPTION':
      return optimizeDescription(payload, ctx)
    case 'AI_OPTIMIZE_FULL':
      return optimizeFull(payload, ctx)
    case 'AI_GENERATE_SEO':
      return generateSEO(payload, ctx)
    case 'AI_GENERATE_TAGS':
      return generateTags(payload, ctx)
    default:
      return {
        success: false,
        error: { code: 'UNKNOWN_ACTION', message: `Unknown AI action: ${action}` }
      }
  }
}
