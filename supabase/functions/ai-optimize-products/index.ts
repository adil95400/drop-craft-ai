import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OptimizeRequest {
  productIds: string[]
}

interface OptimizationResult {
  productId: string
  success: boolean
  optimizations?: {
    title?: string
    description?: string
    seo_title?: string
    seo_description?: string
    tags?: string[]
  }
  error?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { productIds }: OptimizeRequest = await req.json()

    if (!productIds || productIds.length === 0) {
      throw new Error('No product IDs provided')
    }

    console.log(`Optimizing ${productIds.length} products for user ${user.id}`)

    // Récupérer les produits
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .in('id', productIds)

    if (productsError || !products) {
      throw new Error('Failed to fetch products')
    }

    const results: OptimizationResult[] = []

    for (const product of products) {
      try {
        console.log(`Optimizing product: ${product.title || product.id}`)

        // Générer des optimisations IA
        const optimizations = await generateOptimizations(product)

        // Mettre à jour le produit avec les optimisations
        const { error: updateError } = await supabase
          .from('products')
          .update({
            title: optimizations.title || product.title,
            description: optimizations.description || product.description,
            seo_title: optimizations.seo_title,
            seo_description: optimizations.seo_description,
            tags: optimizations.tags || product.tags,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id)
          .eq('user_id', user.id)

        if (updateError) {
          throw new Error(`Update failed: ${updateError.message}`)
        }

        results.push({
          productId: product.id,
          success: true,
          optimizations
        })

        // Logger l'activité
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'ai_optimize_product',
          description: `AI optimized product: ${product.title || product.id}`,
          entity_type: 'product',
          entity_id: product.id,
          details: { optimizations }
        })

      } catch (error) {
        console.error(`Error optimizing product ${product.id}:`, error)
        results.push({
          productId: product.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    console.log(`Optimization complete: ${successCount} success, ${failCount} failed`)

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        totalProducts: productIds.length,
        successCount,
        failCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Optimization error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Générer des optimisations IA pour un produit
async function generateOptimizations(product: any): Promise<{
  title?: string
  description?: string
  seo_title?: string
  seo_description?: string
  tags?: string[]
}> {
  const currentTitle = product.title || product.name || ''
  const currentDescription = product.description || ''
  const category = product.category || ''
  const price = product.price || 0

  // Optimisation du titre (max 60 caractères pour SEO)
  let optimizedTitle = currentTitle
  if (currentTitle.length < 30) {
    optimizedTitle = `${currentTitle} - ${category} Premium`.substring(0, 60)
  } else if (currentTitle.length > 60) {
    optimizedTitle = currentTitle.substring(0, 57) + '...'
  }

  // Optimisation de la description
  let optimizedDescription = currentDescription
  if (currentDescription.length < 100) {
    optimizedDescription = `${currentDescription}\n\n✨ Qualité premium garantie\n🚚 Livraison rapide\n💯 Satisfaction client`
  }

  // Génération du titre SEO
  const seoTitle = `${optimizedTitle} | Achat en ligne`.substring(0, 60)

  // Génération de la meta description SEO (max 160 caractères)
  const seoDescription = `Découvrez ${optimizedTitle}. ${category ? `Catégorie: ${category}.` : ''} Prix: ${price}€. Livraison rapide et retours gratuits.`.substring(0, 160)

  // Génération de tags pertinents
  const baseTags = [category, 'qualité', 'premium', 'livraison rapide'].filter(Boolean)
  const productTags = (product.tags || []) as string[]
  const allTags = [...new Set([...productTags, ...baseTags])]

  return {
    title: optimizedTitle,
    description: optimizedDescription,
    seo_title: seoTitle,
    seo_description: seoDescription,
    tags: allTags.slice(0, 10)
  }
}
