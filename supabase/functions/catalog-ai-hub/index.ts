import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CatalogAIRequest {
  module: 'health' | 'backlog' | 'media' | 'variants' | 'attributes' | 'categories'
  action: 'analyze' | 'recommend' | 'apply'
  productIds?: string[]
  recommendationId?: string
  context?: Record<string, any>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const request: CatalogAIRequest = await req.json()
    console.log('[Catalog AI Hub] Request:', request.module, request.action)

    // Fetch products for analysis
    const { data: products, error: productsError } = await supabaseClient
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .limit(500)

    if (productsError) {
      console.error('Error fetching products:', productsError)
      throw productsError
    }

    // Also fetch imported products
    const { data: importedProducts } = await supabaseClient
      .from('imported_products')
      .select('*')
      .eq('user_id', user.id)
      .limit(500)

    const allProducts = [...(products || []), ...(importedProducts || [])]
    console.log('[Catalog AI Hub] Analyzing', allProducts.length, 'products')

    // Build context for AI analysis
    const catalogContext = buildCatalogContext(allProducts, request.module)

    // Generate AI recommendations using Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-nano',
        messages: [
          {
            role: 'system',
            content: getSystemPrompt(request.module)
          },
          {
            role: 'user',
            content: JSON.stringify({
              action: request.action,
              context: catalogContext,
              additionalContext: request.context
            })
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_catalog_recommendations',
              description: 'Generate actionable catalog optimization recommendations',
              parameters: {
                type: 'object',
                properties: {
                  recommendations: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        type: { type: 'string', enum: ['quick_win', 'strategic', 'automation', 'batch_fix'] },
                        priority: { type: 'number' },
                        title: { type: 'string' },
                        description: { type: 'string' },
                        impact: { type: 'string', enum: ['high', 'medium', 'low'] },
                        estimatedGain: { type: 'number' },
                        affectedProductIds: { type: 'array', items: { type: 'string' } },
                        actionType: { type: 'string' }
                      },
                      required: ['id', 'type', 'priority', 'title', 'description', 'impact', 'actionType']
                    }
                  },
                  insights: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        category: { type: 'string' },
                        insight: { type: 'string' },
                        confidence: { type: 'number' }
                      }
                    }
                  },
                  healthScore: { type: 'number' },
                  trendPrediction: { type: 'string', enum: ['improving', 'stable', 'declining'] }
                },
                required: ['recommendations', 'insights']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_catalog_recommendations' } }
      })
    })

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        )
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
        )
      }
      const errorText = await aiResponse.text()
      console.error('AI gateway error:', aiResponse.status, errorText)
      throw new Error('AI gateway error')
    }

    const aiResult = await aiResponse.json()
    console.log('[Catalog AI Hub] AI response received')

    // Parse tool call result
    let recommendations = { recommendations: [], insights: [], healthScore: 0 }
    try {
      const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0]
      if (toolCall?.function?.arguments) {
        recommendations = JSON.parse(toolCall.function.arguments)
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
    }

    // If action is 'apply', execute the recommendation
    if (request.action === 'apply' && request.recommendationId) {
      const applyResult = await applyRecommendation(
        supabaseClient,
        user.id,
        request.recommendationId,
        request.productIds || [],
        request.module
      )
      
      return new Response(
        JSON.stringify({
          success: true,
          action: 'applied',
          result: applyResult
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Store recommendations for tracking
    await supabaseClient
      .from('ai_optimization_jobs')
      .insert({
        user_id: user.id,
        job_type: `catalog_${request.module}_${request.action}`,
        status: 'completed',
        input_data: { module: request.module, productCount: allProducts.length },
        output_data: recommendations,
        completed_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({
        success: true,
        module: request.module,
        action: request.action,
        data: recommendations,
        productCount: allProducts.length,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[Catalog AI Hub] Error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: 'Failed to process catalog AI request'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function buildCatalogContext(products: any[], module: string) {
  const totalProducts = products.length
  
  // Basic stats
  const withImages = products.filter(p => p.image_url).length
  const withCategory = products.filter(p => p.category).length
  const withStock = products.filter(p => (p.stock_quantity || 0) > 0).length
  const withPrice = products.filter(p => (p.price || 0) > 0).length
  const withDescription = products.filter(p => p.description && p.description.length > 50).length
  
  // Calculate health score
  const healthScore = Math.round(
    ((withImages / totalProducts) * 25) +
    ((withCategory / totalProducts) * 20) +
    ((withStock / totalProducts) * 25) +
    ((withPrice / totalProducts) * 20) +
    ((withDescription / totalProducts) * 10)
  )

  // Category distribution
  const categories: Record<string, number> = {}
  products.forEach(p => {
    const cat = p.category || 'Non catégorisé'
    categories[cat] = (categories[cat] || 0) + 1
  })

  // Module-specific context
  const moduleContext: Record<string, any> = {}

  switch (module) {
    case 'health':
      moduleContext.optimizedCount = products.filter(p => 
        p.image_url && p.category && (p.price || 0) > 0 && (p.stock_quantity || 0) > 0
      ).length
      moduleContext.blockingCount = products.filter(p => 
        !p.image_url || (p.stock_quantity || 0) === 0 || (p.price || 0) === 0
      ).length
      break

    case 'media':
      moduleContext.withGallery = products.filter(p => 
        Array.isArray(p.images) && p.images.length > 1
      ).length
      moduleContext.withVideo = products.filter(p => 
        p.video_url || (Array.isArray(p.videos) && p.videos.length > 0)
      ).length
      moduleContext.missingAlt = products.filter(p => 
        p.image_url && !p.image_alt
      ).length
      break

    case 'variants':
      moduleContext.withVariants = products.filter(p => 
        Array.isArray(p.variants) && p.variants.length > 0
      ).length
      moduleContext.variantIssues = products.filter(p => {
        if (!Array.isArray(p.variants)) return false
        return p.variants.some((v: any) => !v.sku || (v.inventory_quantity || 0) === 0)
      }).length
      break

    case 'attributes':
      moduleContext.missingBrand = products.filter(p => !p.brand).length
      moduleContext.missingGtin = products.filter(p => !p.gtin && !p.barcode).length
      moduleContext.shortDescription = products.filter(p => 
        !p.description || p.description.length < 100
      ).length
      break

    case 'categories':
      moduleContext.uncategorized = products.filter(p => !p.category).length
      moduleContext.categoryDistribution = categories
      break

    case 'backlog':
      moduleContext.criticalIssues = products.filter(p => 
        !p.image_url || (p.stock_quantity || 0) === 0
      ).length
      moduleContext.warningIssues = products.filter(p => 
        (p.stock_quantity || 0) < 5 || !p.category
      ).length
      break
  }

  return {
    totalProducts,
    healthScore,
    stats: { withImages, withCategory, withStock, withPrice, withDescription },
    categoryDistribution: Object.entries(categories).slice(0, 10),
    moduleContext
  }
}

function getSystemPrompt(module: string): string {
  const basePrompt = `Tu es un expert en optimisation de catalogues e-commerce. 
Tu analyses les données du catalogue et génères des recommandations actionnables pour améliorer la qualité, la visibilité et les performances commerciales.

Règles:
- Toutes les recommandations doivent être concrètes et immédiatement applicables
- Priorise par impact business (ROI, visibilité, conversion)
- Utilise un langage clair et professionnel en français
- Chaque recommendation doit avoir un type parmi: quick_win, strategic, automation, batch_fix
- Les impacts sont: high (>20% amélioration), medium (10-20%), low (<10%)
`

  const modulePrompts: Record<string, string> = {
    health: `${basePrompt}\n\nFocus: Santé globale du catalogue. Identifie les produits bloquants, les opportunités d'optimisation rapide, et les tendances de qualité.`,
    
    media: `${basePrompt}\n\nFocus: Médias produits. Identifie les produits sans images, galeries incomplètes, vidéos manquantes. Suggère des enrichissements automatisables.`,
    
    variants: `${basePrompt}\n\nFocus: Variantes produits. Analyse la cohérence des variantes, les ruptures par variante, les SKU manquants.`,
    
    attributes: `${basePrompt}\n\nFocus: Attributs produits. Identifie les GTIN/EAN manquants, marques non renseignées, descriptions courtes pour les marketplaces.`,
    
    categories: `${basePrompt}\n\nFocus: Catégorisation. Suggère des mappings de catégories, identifie les produits non catégorisés, optimise la taxonomie.`,
    
    backlog: `${basePrompt}\n\nFocus: Backlog à traiter. Priorise les corrections par impact, estime le temps de résolution, suggère des automatisations.`
  }

  return modulePrompts[module] || basePrompt
}

async function applyRecommendation(
  supabase: any,
  userId: string,
  recommendationId: string,
  productIds: string[],
  module: string
): Promise<{ success: boolean; updatedCount: number; message: string }> {
  console.log('[Catalog AI Hub] Applying recommendation:', recommendationId, 'to', productIds.length, 'products')

  let updatedCount = 0
  let message = ''

  // Apply based on recommendation type
  switch (recommendationId) {
    case 'fix_images':
      // Queue products for image enrichment
      const imageJobs = productIds.map(id => ({
        user_id: userId,
        job_type: 'image_enrichment',
        target_id: id,
        target_type: 'product',
        status: 'pending',
        priority: 1
      }))
      
      const { error: imageError } = await supabase
        .from('ai_optimization_jobs')
        .insert(imageJobs)

      if (!imageError) {
        updatedCount = productIds.length
        message = `${updatedCount} produits mis en file d'enrichissement d'images`
      }
      break

    case 'fix_categories':
      // Queue for AI categorization
      const catJobs = productIds.map(id => ({
        user_id: userId,
        job_type: 'ai_categorization',
        target_id: id,
        target_type: 'product',
        status: 'pending',
        priority: 2
      }))
      
      const { error: catError } = await supabase
        .from('ai_optimization_jobs')
        .insert(catJobs)

      if (!catError) {
        updatedCount = productIds.length
        message = `${updatedCount} produits en attente de catégorisation IA`
      }
      break

    case 'fix_attributes':
      // Queue for attribute enrichment
      const attrJobs = productIds.map(id => ({
        user_id: userId,
        job_type: 'attribute_enrichment',
        target_id: id,
        target_type: 'product',
        status: 'pending',
        priority: 2
      }))
      
      const { error: attrError } = await supabase
        .from('ai_optimization_jobs')
        .insert(attrJobs)

      if (!attrError) {
        updatedCount = productIds.length
        message = `${updatedCount} produits en attente d'enrichissement d'attributs`
      }
      break

    default:
      // Generic job creation
      const { error: genericError } = await supabase
        .from('ai_optimization_jobs')
        .insert({
          user_id: userId,
          job_type: `catalog_${module}_${recommendationId}`,
          target_type: 'batch',
          input_data: { productIds, recommendationId },
          status: 'pending',
          priority: 3
        })

      if (!genericError) {
        updatedCount = productIds.length
        message = `Action "${recommendationId}" planifiée pour ${updatedCount} produits`
      }
  }

  return { success: updatedCount > 0, updatedCount, message }
}
