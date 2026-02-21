import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()

    // Support both calling conventions
    let userId: string
    let productIds: string[]
    let action: string
    let batchSize = 10

    if (body.userId && body.productIds && body.action) {
      // Direct format from BulkAIActions
      userId = body.userId
      productIds = body.productIds
      action = body.action
      batchSize = body.batchSize || 10
    } else if (body.filter_criteria && body.enrichment_types) {
      // Format from useApiAI.bulkEnrich
      // Extract auth user from JWT
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) throw new Error('Missing authorization')
      const token = authHeader.replace('Bearer ', '')
      const supabaseAuth = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      )
      const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token)
      if (userError || !user) throw new Error('Invalid session')

      userId = user.id
      productIds = body.filter_criteria?.product_ids || []
      // Map enrichment_types to action
      const types = body.enrichment_types || []
      if (types.includes('full')) action = 'full_optimization'
      else if (types.includes('seo')) action = 'generate_seo'
      else if (types.includes('description')) action = 'rewrite_descriptions'
      else if (types.includes('title')) action = 'rewrite_titles'
      else if (types.includes('attributes')) action = 'complete_attributes'
      else if (types.includes('pricing')) action = 'optimize_pricing'
      else action = 'full_optimization'
      batchSize = body.limit || 10
    } else {
      throw new Error('Missing required parameters')
    }

    if (!userId || !productIds || productIds.length === 0) {
      throw new Error('Missing required parameters: userId and productIds are required')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Process products in batches
    const results = []
    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize)
      
      for (const productId of batch) {
        try {
          // Get product
          const { data: product, error: fetchError } = await supabaseClient
            .from('products')
            .select('*')
            .eq('id', productId)
            .eq('user_id', userId)
            .single()

          if (fetchError && fetchError.code !== 'PGRST116') {
            // Try imported_products
            const { data: imported } = await supabaseClient
              .from('imported_products')
              .select('*')
              .eq('id', productId)
              .eq('user_id', userId)
              .single()
            
            if (!imported) continue
          }

          const currentProduct = product || await getImportedProduct(supabaseClient, productId, userId)
          if (!currentProduct) continue

          // Apply AI optimization based on action
          let updates: any = {}
          
          switch (action) {
            case 'rewrite_titles':
              updates.name = await generateOptimizedTitle(currentProduct)
              break
            case 'rewrite_descriptions':
              updates.description = await generateOptimizedDescription(currentProduct)
              break
            case 'complete_attributes':
              updates = await generateAttributes(currentProduct)
              break
            case 'generate_seo':
              updates.seo_title = await generateSEOTitle(currentProduct)
              updates.seo_description = await generateSEODescription(currentProduct)
              break
            case 'fix_spelling':
              updates.name = await fixSpelling(currentProduct.name)
              updates.description = await fixSpelling(currentProduct.description)
              break
            case 'optimize_images':
              // Generate alt text for images
              updates.image_alt = await generateImageAlt(currentProduct)
              break
            case 'optimize_pricing':
              updates.price = await optimizePricing(currentProduct)
              break
            case 'full_optimization':
              updates = await fullOptimization(currentProduct)
              break
          }

          // Update product
          if (Object.keys(updates).length > 0) {
            const table = product ? 'products' : 'imported_products'
            await supabaseClient
              .from(table)
              .update({ ...updates, updated_at: new Date().toISOString() })
              .eq('id', productId)
              .eq('user_id', userId)
            
            results.push({ productId, success: true })
          }
        } catch (error) {
          console.error(`Error processing product ${productId}:`, error)
          results.push({ productId, success: false, error: error.message })
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

async function getImportedProduct(client: any, productId: string, userId: string) {
  const { data } = await client
    .from('imported_products')
    .select('*')
    .eq('id', productId)
    .eq('user_id', userId)
    .single()
  return data
}

async function generateOptimizedTitle(product: any): Promise<string> {
  // Simulate AI title generation
  const title = product.name || 'Produit'
  return title.length < 30 
    ? `${title} - Haute Qualité | Livraison Rapide`
    : title
}

async function generateOptimizedDescription(product: any): Promise<string> {
  // Simulate AI description generation
  const name = product.name || 'ce produit'
  return `Découvrez ${name}, un produit de qualité supérieure. Caractéristiques principales:\n• Design élégant et moderne\n• Matériaux de haute qualité\n• Livraison rapide et sécurisée\n• Garantie satisfaction\n\nIdéal pour un usage quotidien, ${name} combine style et fonctionnalité.`
}

async function generateAttributes(product: any): Promise<any> {
  return {
    category: product.category || 'Général',
    tags: product.tags || ['nouveau', 'populaire']
  }
}

async function generateSEOTitle(product: any): Promise<string> {
  const title = product.name || 'Produit'
  return title.substring(0, 60)
}

async function generateSEODescription(product: any): Promise<string> {
  const name = product.name || 'ce produit'
  return `Achetez ${name} au meilleur prix. Livraison rapide, qualité garantie. Découvrez notre sélection.`.substring(0, 160)
}

async function fixSpelling(text: string | null): Promise<string> {
  if (!text) return ''
  // Simulate spell checking
  return text
    .replace(/é+/g, 'é')
    .replace(/\s+/g, ' ')
    .trim()
}

async function generateImageAlt(product: any): Promise<string> {
  return `${product.name || 'Produit'} - ${product.category || 'Catégorie'}`
}

async function optimizePricing(product: any): Promise<number> {
  const currentPrice = product.price || 0
  const costPrice = product.cost_price || currentPrice * 0.6
  // Target 40% margin
  return Math.round(costPrice * 1.4 * 100) / 100
}

async function fullOptimization(product: any): Promise<any> {
  return {
    name: await generateOptimizedTitle(product),
    description: await generateOptimizedDescription(product),
    seo_title: await generateSEOTitle(product),
    seo_description: await generateSEODescription(product),
    category: product.category || 'Général',
    price: await optimizePricing(product)
  }
}
