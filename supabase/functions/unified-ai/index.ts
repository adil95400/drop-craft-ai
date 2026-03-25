import { createClient } from 'npm:@supabase/supabase-js@2';
import { authenticateUser } from '../_shared/secure-auth.ts'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/secure-cors.ts'
import { checkRateLimit, createRateLimitResponse } from '../_shared/rate-limit.ts'
import { secureUpdate } from '../_shared/db-helpers.ts'

/**
 * Unified AI - Real GPT-5-nano via Lovable AI Gateway
 * 
 * Endpoints:
 * - optimize-product: AI-powered product optimization (title, description, SEO)
 * - generate-description: Batch AI description generation
 * - price-optimization: AI pricing strategy
 * - automation: AI automation tasks
 * - predictive-analytics: AI-powered sales predictions
 * - generate-marketing: AI marketing content generation
 */

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
import { callOpenAI } from '../_shared/ai-client.ts'

async function callAI(systemPrompt: string, userPrompt: string, options: { temperature?: number; maxTokens?: number; useToolCalling?: boolean; tools?: any[] } = {}) {
  const reqOptions: any = {
    module: 'automation' as const,
    temperature: options.temperature ?? 0.7,
    maxTokens: options.maxTokens ?? 1500,
    enableCache: true,
  };
  if (options.tools) {
    reqOptions.tools = options.tools;
    reqOptions.tool_choice = { type: 'function', function: { name: options.tools[0].function.name } };
  }

  const data = await callOpenAI(
    [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
    reqOptions
  );

  if (options.tools && data.choices?.[0]?.message?.tool_calls?.[0]) {
    const toolCall = data.choices[0].message.tool_calls[0];
    return JSON.parse(toolCall.function.arguments);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty AI response');

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { content };
  } catch {
    return { content };
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  const preflightResponse = handleCorsPreflightRequest(req, corsHeaders)
  if (preflightResponse) return preflightResponse

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { user } = await authenticateUser(req, supabase)
    const userId = user.id

    const url = new URL(req.url)
    const endpoint = url.pathname.split('/').pop()
    const body = await req.json()

    // Rate limit per endpoint
    const rateLimitResult = await checkRateLimit(
      supabase, userId,
      `unified_ai:${endpoint}`,
      { maxRequests: 30, windowMinutes: 60 }
    )
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, corsHeaders)
    }

    let result: any

    switch (endpoint) {
      case 'optimize-product':
        if (body.optimizationType === 'custom' && body.customPrompt) {
          result = await handleCustomPrompt(body.customPrompt)
        } else {
          result = await handleProductOptimization(supabase, body, userId)
        }
        break
      case 'generate-description':
        result = await handleDescriptionGeneration(supabase, body, userId)
        break
      case 'price-optimization':
        result = await handlePriceOptimization(supabase, body, userId)
        break
      case 'automation':
        result = await handleAIAutomation(supabase, body, userId)
        break
      case 'predictive-analytics':
        result = await handlePredictiveAnalytics(supabase, body, userId)
        break
      case 'generate-marketing':
        result = await handleMarketingContent(body)
        break
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown AI endpoint' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error in unified AI:', error)
    
    if (error.message === 'RATE_LIMITED') {
      return new Response(
        JSON.stringify({ error: 'Trop de requêtes IA. Réessayez dans quelques instants.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (error.message === 'CREDITS_EXHAUSTED') {
      return new Response(
        JSON.stringify({ error: 'Crédits IA épuisés. Rechargez vos crédits.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      }
    )
  }
})

// ─── PRODUCT OPTIMIZATION ──────────────────────────────────────
async function handleProductOptimization(supabase: any, body: any, userId: string) {
  const { productId, optimizationType } = body
  if (!productId) throw new Error('productId is required')

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('user_id', userId)
    .single()

  if (error || !product) throw new Error('Product not found or not authorized')

  const systemPrompt = `Tu es un expert en optimisation de fiches produits e-commerce.
Ton objectif: maximiser le taux de conversion, le référencement SEO et l'attractivité du produit.
Réponds UNIQUEMENT en JSON valide.`

  const optimizationPrompts: Record<string, string> = {
    title: `Optimise le titre produit pour le SEO et la conversion.
Produit actuel: "${product.name}"
Catégorie: ${product.category || 'Non spécifiée'}
Prix: ${product.price}€

Retourne: {"optimized_title": "...", "seo_title": "...", "seo_keywords": ["..."], "improvements": ["..."], "confidence": 0.0-1.0}`,

    description: `Réécris la description produit pour maximiser la conversion.
Produit: "${product.name}"
Description actuelle: "${product.description || 'Aucune'}"
Catégorie: ${product.category || 'Non spécifiée'}

Retourne: {"optimized_description": "...", "bullet_points": ["..."], "seo_meta_description": "...", "improvements": ["..."], "confidence": 0.0-1.0}`,

    full: `Optimise complètement cette fiche produit.
Nom: "${product.name}"
Description: "${product.description || 'Aucune'}"
Catégorie: ${product.category || 'Non spécifiée'}
Prix: ${product.price}€
Tags: ${product.tags?.join(', ') || 'Aucun'}

Retourne: {"optimized_title": "...", "optimized_description": "...", "seo_title": "...", "seo_description": "...", "suggested_tags": ["..."], "bullet_points": ["..."], "improvements": ["..."], "confidence": 0.0-1.0}`,

    price: `Analyse et recommande un prix optimal.
Produit: "${product.name}"
Prix actuel: ${product.price}€
Coût fournisseur: ${product.cost_price || 'Inconnu'}€
Catégorie: ${product.category || 'Non spécifiée'}

Retourne: {"recommended_price": 0, "min_price": 0, "max_price": 0, "margin_percentage": 0, "strategy": "...", "reasoning": "...", "confidence": 0.0-1.0}`
  }

  const prompt = optimizationPrompts[optimizationType] || optimizationPrompts.full
  const aiResult = await callAI(systemPrompt, prompt, { temperature: 0.6 })

  // Apply optimizations to product
  const updates: Record<string, any> = {}
  if (aiResult.optimized_title) updates.name = aiResult.optimized_title
  if (aiResult.optimized_description) updates.description = aiResult.optimized_description
  if (aiResult.seo_title) updates.seo_title = aiResult.seo_title
  if (aiResult.seo_description) updates.seo_description = aiResult.seo_description
  if (aiResult.suggested_tags) updates.tags = aiResult.suggested_tags
  if (aiResult.recommended_price && optimizationType === 'price') {
    updates.price = aiResult.recommended_price
  }

  if (Object.keys(updates).length > 0) {
    await secureUpdate(supabase, 'products', productId, updates, userId)
  }

  // Log the AI generation
  await supabase.from('ai_generations').insert({
    user_id: userId,
    target_type: 'product',
    target_id: productId,
    task: `optimize_${optimizationType}`,
    provider: 'openai',
    model: 'gpt-5-nano',
    input_json: { product_name: product.name, type: optimizationType },
    output_json: aiResult,
    language: 'fr'
  }).catch(() => {}) // Non-blocking

  return {
    success: true,
    productId,
    optimizationType,
    data: aiResult,
    fieldsUpdated: Object.keys(updates),
    timestamp: new Date().toISOString()
  }
}

// ─── DESCRIPTION GENERATION ────────────────────────────────────
async function handleDescriptionGeneration(supabase: any, body: any, userId: string) {
  const { productIds, template, tone } = body
  if (!productIds?.length) throw new Error('productIds array is required')

  const limitedIds = productIds.slice(0, 10) // Max 10 per batch

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, description, category, price, tags')
    .in('id', limitedIds)
    .eq('user_id', userId)

  if (error || !products?.length) throw new Error('Products not found or not authorized')

  const systemPrompt = `Tu es un copywriter e-commerce expert en conversion.
Génère des descriptions produits engageantes, SEO-optimisées et persuasives.
Ton: ${tone || 'professionnel et engageant'}
${template ? `Template à suivre: ${template}` : ''}
Réponds en JSON avec un tableau de résultats.`

  const productList = products.map((p: any) =>
    `- ID: ${p.id} | Nom: ${p.name} | Catégorie: ${p.category || 'N/A'} | Prix: ${p.price}€`
  ).join('\n')

  const userPrompt = `Génère des descriptions optimisées pour ces ${products.length} produits:

${productList}

Retourne: [{"id": "...", "description": "...", "bullet_points": ["..."], "seo_meta": "..."}]`

  const aiResult = await callAI(systemPrompt, userPrompt, { maxTokens: 3000 })

  // Apply descriptions
  const results = Array.isArray(aiResult) ? aiResult : aiResult.products || [aiResult]
  let updated = 0

  for (const result of results) {
    if (result.id && result.description) {
      const updateData: any = { description: result.description }
      if (result.seo_meta) updateData.seo_description = result.seo_meta
      await secureUpdate(supabase, 'products', result.id, updateData, userId)
      updated++
    }
  }

  return {
    success: true,
    productsUpdated: updated,
    totalProducts: products.length,
    data: results,
    timestamp: new Date().toISOString()
  }
}

// ─── PRICE OPTIMIZATION ────────────────────────────────────────
async function handlePriceOptimization(supabase: any, body: any, userId: string) {
  const { productIds, strategy } = body
  if (!productIds?.length) throw new Error('productIds array is required')

  const limitedIds = productIds.slice(0, 20)

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, price, cost_price, category, stock_quantity')
    .in('id', limitedIds)
    .eq('user_id', userId)

  if (error || !products?.length) throw new Error('Products not found or not authorized')

  const systemPrompt = `Tu es un expert en pricing e-commerce et stratégie de marge.
Analyse les produits et recommande des prix optimaux selon la stratégie demandée.
Réponds UNIQUEMENT en JSON valide.`

  const productList = products.map((p: any) =>
    `- ID: ${p.id} | ${p.name} | Prix: ${p.price}€ | Coût: ${p.cost_price || '?'}€ | Stock: ${p.stock_quantity || '?'} | Cat: ${p.category || 'N/A'}`
  ).join('\n')

  const userPrompt = `Stratégie de pricing: ${strategy || 'balanced'}

Produits:
${productList}

Pour chaque produit, recommande un prix optimal.
Retourne: [{"id": "...", "current_price": 0, "recommended_price": 0, "margin_pct": 0, "reasoning": "..."}]`

  const aiResult = await callAI(systemPrompt, userPrompt, { temperature: 0.4 })

  const results = Array.isArray(aiResult) ? aiResult : aiResult.products || [aiResult]
  let updated = 0

  for (const result of results) {
    if (result.id && result.recommended_price && result.recommended_price > 0) {
      await secureUpdate(supabase, 'products', result.id, {
        price: result.recommended_price,
        profit_margin: result.margin_pct || null
      }, userId)
      updated++
    }
  }

  return {
    success: true,
    productsUpdated: updated,
    strategy: strategy || 'balanced',
    data: results,
    timestamp: new Date().toISOString()
  }
}

// ─── AI AUTOMATION ─────────────────────────────────────────────
async function handleAIAutomation(supabase: any, body: any, userId: string) {
  const { automationType, config } = body
  if (!automationType) throw new Error('automationType is required')

  const systemPrompt = `Tu es un assistant d'automatisation e-commerce IA.
Analyse la demande et fournis des recommandations d'automatisation concrètes.
Réponds en JSON.`

  const userPrompt = `Type d'automatisation: ${automationType}
Configuration: ${JSON.stringify(config || {})}

Analyse et retourne: {"recommendations": ["..."], "estimated_impact": "...", "steps": ["..."], "priority": "high|medium|low"}`

  const aiResult = await callAI(systemPrompt, userPrompt)

  // Log automation
  await supabase.from('ai_optimization_jobs').insert({
    user_id: userId,
    job_type: automationType,
    input_data: config,
    output_data: aiResult,
    status: 'completed',
  }).catch(() => {})

  return {
    success: true,
    automationType,
    data: aiResult,
    timestamp: new Date().toISOString()
  }
}

// ─── PREDICTIVE ANALYTICS ──────────────────────────────────────
async function handlePredictiveAnalytics(supabase: any, body: any, userId: string) {
  const { metric, period } = body

  // Fetch real user data for predictions
  const { data: orders } = await supabase
    .from('orders')
    .select('total_amount, created_at, status')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: products } = await supabase
    .from('products')
    .select('price, stock_quantity, category, created_at')
    .eq('user_id', userId)
    .limit(50)

  const orderSummary = orders?.length
    ? `${orders.length} commandes récentes, CA total: ${orders.reduce((s: number, o: any) => s + (o.total_amount || 0), 0).toFixed(2)}€`
    : 'Aucune commande récente'

  const productSummary = products?.length
    ? `${products.length} produits, stock moyen: ${Math.round(products.reduce((s: number, p: any) => s + (p.stock_quantity || 0), 0) / products.length)}`
    : 'Aucun produit'

  const systemPrompt = `Tu es un analyste IA spécialisé en e-commerce prédictif.
Analyse les données et fournis des prédictions actionables.
Réponds en JSON.`

  const userPrompt = `Données du vendeur:
- ${orderSummary}
- ${productSummary}
- Métrique demandée: ${metric || 'revenue'}
- Période: ${period || '30 jours'}

Retourne: {
  "predictions": [{"date": "...", "value": 0, "confidence": 0.0-1.0}],
  "trend": "up|down|stable",
  "trend_percentage": 0,
  "insights": ["..."],
  "recommendations": ["..."],
  "risk_factors": ["..."]
}`

  const aiResult = await callAI(systemPrompt, userPrompt, { temperature: 0.3 })

  return {
    success: true,
    metric: metric || 'revenue',
    period: period || '30 jours',
    data: aiResult,
    timestamp: new Date().toISOString()
  }
}

// ─── MARKETING CONTENT ─────────────────────────────────────────
async function handleMarketingContent(body: any) {
  const { contentType, productName, productDescription, platform, goal } = body
  if (!contentType || !productName) throw new Error('contentType and productName required')

  const systemPrompt = `Tu es un expert en marketing digital et copywriting e-commerce.
Génère du contenu marketing persuasif et optimisé pour la conversion.
Réponds en JSON.`

  const prompts: Record<string, string> = {
    email: `Crée une campagne email pour "${productName}".
Description: ${productDescription || 'N/A'}
Objectif: ${goal || 'Augmenter les ventes'}
Retourne: {"subject": "...", "preview_text": "...", "body_html": "...", "cta_text": "...", "cta_url_suggestion": "..."}`,

    social: `Crée 3 posts réseaux sociaux pour "${productName}" sur ${platform || 'Instagram'}.
Description: ${productDescription || 'N/A'}
Objectif: ${goal || 'Engagement'}
Retourne: [{"text": "...", "hashtags": ["..."], "cta": "...", "best_time": "..."}]`,

    ad: `Crée des textes publicitaires pour "${productName}" sur ${platform || 'Facebook Ads'}.
Description: ${productDescription || 'N/A'}
Retourne: {"headline": "...", "description": "...", "long_description": "...", "cta": "...", "target_audience": "..."}`,

    blog: `Crée un article de blog SEO pour promouvoir "${productName}".
Description: ${productDescription || 'N/A'}
Retourne: {"title": "...", "meta_description": "...", "introduction": "...", "sections": [{"heading": "...", "content": "..."}], "conclusion": "...", "keywords": ["..."]}`
  }

  const aiResult = await callAI(systemPrompt, prompts[contentType] || prompts.social, { temperature: 0.8 })

  return {
    success: true,
    contentType,
    platform: platform || 'general',
    data: aiResult,
    timestamp: new Date().toISOString()
  }
}
