import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { authenticateUser } from '../_shared/secure-auth.ts'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/secure-cors.ts'
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from '../_shared/rate-limit.ts'

/**
 * AI Optimize Product - Enterprise-Safe
 * 
 * Security:
 * - JWT authentication required
 * - Rate limiting per user
 * - Product ownership verification
 * - User data scoping
 */

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  
  const preflightResponse = handleCorsPreflightRequest(req, corsHeaders)
  if (preflightResponse) return preflightResponse

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Authenticate user
    const { user } = await authenticateUser(req, supabase)
    const userId = user.id

    // Rate limit - AI operations are expensive
    const rateLimitResult = await checkRateLimit(
      supabase,
      userId,
      'ai_optimize_product',
      { maxRequests: 20, windowMinutes: 60 } // 20 AI optimizations per hour
    )
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, corsHeaders)
    }

    const { productId, mode = 'full' } = await req.json()

    if (!productId) {
      return new Response(
        JSON.stringify({ success: false, error: 'productId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`AI Optimizing product ${productId} for user ${userId} (mode: ${mode})`)

    // Fetch product - VERIFY OWNERSHIP
    const [productsResult, importedResult] = await Promise.all([
      supabase.from('products').select('*').eq('id', productId).eq('user_id', userId).maybeSingle(),
      supabase.from('imported_products').select('*').eq('id', productId).eq('user_id', userId).maybeSingle()
    ])

    const product = productsResult.data || importedResult.data
    const table = productsResult.data ? 'products' : 'imported_products'

    if (!product) {
      return new Response(
        JSON.stringify({ success: false, error: 'Product not found or not authorized' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build AI prompt based on mode
    let systemPrompt = ''
    let userPrompt = ''

    if (mode === 'full') {
      systemPrompt = `You are an expert e-commerce product optimizer. Generate optimized product content for dropshipping that converts visitors into buyers.`
      userPrompt = `Optimize this product for maximum sales:

Product Name: ${product.name}
Description: ${product.description || 'None'}
Price: ${product.price}€
Cost: ${product.cost_price || 0}€
Category: ${product.category || 'Uncategorized'}

Generate:
1. Optimized SEO title (50-60 chars, include main keyword)
2. Compelling description (150-300 words, benefits-focused, with call-to-action)
3. 8-10 relevant tags (comma-separated)
4. Optimal price recommendation (considering ${((product.price - (product.cost_price || 0)) / product.price * 100).toFixed(0)}% current margin)
5. SEO meta description (150-160 chars)

Format as JSON with keys: title, description, tags, recommendedPrice, seoDescription`
    } else if (mode === 'title') {
      systemPrompt = 'You are an SEO expert. Generate optimized product titles.'
      userPrompt = `Create an SEO-optimized title for: ${product.name}\nCategory: ${product.category}\nFormat: JSON with key "title"`
    } else if (mode === 'description') {
      systemPrompt = 'You are a copywriter specializing in e-commerce product descriptions.'
      userPrompt = `Write a compelling description for: ${product.name}\nCurrent: ${product.description || 'None'}\nFormat: JSON with key "description"`
    }

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-nano',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'optimize_product',
            description: 'Return optimized product content',
            parameters: {
              type: 'object',
              properties: mode === 'full' ? {
                title: { type: 'string' },
                description: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                recommendedPrice: { type: 'number' },
                seoDescription: { type: 'string' }
              } : mode === 'title' ? {
                title: { type: 'string' }
              } : {
                description: { type: 'string' }
              },
              required: mode === 'full' ? ['title', 'description', 'tags', 'recommendedPrice', 'seoDescription'] : [mode],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'optimize_product' } }
      })
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('Lovable AI error:', aiResponse.status, errorText)
      throw new Error(`AI optimization failed: ${aiResponse.status}`)
    }

    const aiData = await aiResponse.json()
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0]
    if (!toolCall) {
      throw new Error('No optimization data returned from AI')
    }

    const optimized = JSON.parse(toolCall.function.arguments)
    console.log('AI optimization result:', optimized)

    // Prepare updates
    const updates: any = {
      last_optimized_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (mode === 'full' || mode === 'title') {
      updates.name = optimized.title
      updates.seo_title = optimized.title
    }

    if (mode === 'full' || mode === 'description') {
      updates.description = optimized.description
      if (mode === 'full') {
        updates.seo_description = optimized.seoDescription
      }
    }

    if (mode === 'full') {
      updates.tags = optimized.tags
      updates.seo_keywords = optimized.tags
      // Only update price if it's reasonable (within 20% of current)
      const priceDiff = Math.abs(optimized.recommendedPrice - product.price) / product.price
      if (priceDiff <= 0.2) {
        updates.price = optimized.recommendedPrice
      }
    }

    // Update product - SCOPED TO USER
    const { error: updateError } = await supabase
      .from(table)
      .update(updates)
      .eq('id', productId)
      .eq('user_id', userId) // CRITICAL: Verify ownership

    if (updateError) throw updateError

    // Log activity - SCOPED TO USER
    await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: 'product_ai_optimized',
        entity_type: 'product',
        entity_id: productId,
        description: `Product optimized by Lovable AI (${mode} mode)`,
        details: { original: { name: product.name, price: product.price }, optimized, mode }
      })

    return new Response(
      JSON.stringify({
        success: true,
        productId,
        mode,
        optimized,
        updates
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in ai-optimize-product:', error)
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { 
        status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
