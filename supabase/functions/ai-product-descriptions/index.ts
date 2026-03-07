/**
 * AI Product Descriptions — Multi-langue, SEO-optimized
 * JWT-first auth, structured output via tool calling
 */
import { requireAuth, handlePreflight, errorResponse, successResponse } from '../_shared/jwt-auth.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { AI_MODEL, AI_GATEWAY_URL } from '../_shared/ai-config.ts'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const {
      productName, category, features = [], tone = 'professional', length = 'medium',
      languages = ['fr'], // array of ISO codes
      product_id,
      include_seo = true, // generate meta title/desc
      include_bullets = true, // generate bullet points
    } = await req.json()

    if (!productName) {
      return errorResponse('productName is required', corsHeaders)
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured')

    const lengthMap: Record<string, string> = {
      short: '50-100 words', medium: '100-200 words', long: '200-350 words'
    }

    const langNames: Record<string, string> = {
      fr: 'French', en: 'English', de: 'German', es: 'Spanish', it: 'Italian',
      pt: 'Portuguese', nl: 'Dutch', ar: 'Arabic', ja: 'Japanese', zh: 'Chinese',
      ko: 'Korean', pl: 'Polish', sv: 'Swedish', da: 'Danish', fi: 'Finnish',
      no: 'Norwegian', cs: 'Czech', ro: 'Romanian', tr: 'Turkish', ru: 'Russian',
    }

    const results: Record<string, any> = {}

    for (const lang of languages.slice(0, 5)) { // max 5 languages per call
      const langLabel = langNames[lang] || lang

      const systemPrompt = `You are an expert e-commerce SEO copywriter. Write in ${langLabel}. 
Generate compelling, conversion-optimized product content.
Use natural keyword integration, not keyword stuffing.
Adapt cultural tone for ${langLabel}-speaking markets.`

      const response = await fetch(AI_GATEWAY_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: AI_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Generate product content for:
Product: ${productName}
Category: ${category || 'General'}
Features: ${features.join(', ') || 'N/A'}
Tone: ${tone}
Description length: ${lengthMap[length] || '100-200 words'}` }
          ],
          tools: [{
            type: 'function',
            function: {
              name: 'product_content',
              description: 'Returns structured product content',
              parameters: {
                type: 'object',
                properties: {
                  title: { type: 'string', description: 'SEO-optimized product title (max 70 chars)' },
                  description: { type: 'string', description: 'Full product description with HTML formatting' },
                  meta_title: { type: 'string', description: 'SEO meta title (max 60 chars)' },
                  meta_description: { type: 'string', description: 'SEO meta description (max 155 chars)' },
                  bullet_points: { type: 'array', items: { type: 'string' }, description: '5 key selling points' },
                  keywords: { type: 'array', items: { type: 'string' }, description: '8-10 relevant SEO keywords' },
                  short_description: { type: 'string', description: 'One-liner summary (max 100 chars)' },
                },
                required: ['title', 'description', 'meta_title', 'meta_description', 'bullet_points', 'keywords', 'short_description'],
                additionalProperties: false,
              }
            }
          }],
          tool_choice: { type: 'function', function: { name: 'product_content' } },
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        if (response.status === 429) return errorResponse('Rate limit exceeded', corsHeaders, 429)
        if (response.status === 402) return errorResponse('Credits exhausted', corsHeaders, 402)
        console.error(`AI error for lang ${lang}:`, response.status)
        results[lang] = { error: `Generation failed (${response.status})` }
        continue
      }

      const data = await response.json()
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0]
      if (toolCall?.function?.arguments) {
        try {
          results[lang] = JSON.parse(toolCall.function.arguments)
        } catch {
          results[lang] = { error: 'Failed to parse AI response' }
        }
      } else {
        // Fallback: try to use content directly
        results[lang] = { description: data.choices?.[0]?.message?.content || '' }
      }
    }

    // Log generation
    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    await serviceSupabase.from('ai_generations').insert({
      user_id: userId,
      target_type: 'product',
      target_id: product_id || userId,
      task: 'multilang_description',
      provider: 'openai',
      model: 'gpt-5-nano',
      input_json: { productName, category, features, tone, length, languages },
      output_json: results,
      language: languages.join(','),
    }).catch(() => {})

    return successResponse({
      descriptions: results,
      languages_generated: Object.keys(results).filter(k => !results[k].error),
      languages_failed: Object.keys(results).filter(k => results[k].error),
    }, corsHeaders)

  } catch (error) {
    console.error('ai-product-descriptions error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    })
  }
})
