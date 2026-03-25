import { createClient } from 'npm:@supabase/supabase-js@2';
import { generateJSON } from '../_shared/ai-client.ts'
import { checkAndIncrementQuota, quotaExceededResponse } from '../_shared/ai-quota.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CategorizeRequest {
  productIds: string[]
  productSource: 'products' | 'imported_products' | 'supplier_products'
  userId: string
}

async function categorizeProduct(product: any): Promise<any> {
  const prompt = `Catégorise ce produit e-commerce avec précision (97% de confiance minimum).

Produit:
- Nom: ${product.name || 'Sans nom'}
- Description: ${product.description || 'Sans description'}
- Prix: ${product.price || 0}€
- Catégorie actuelle: ${product.category || 'Non catégorisé'}

Analyse et retourne:
1. **category** - Catégorie principale
2. **subcategory** - Sous-catégorie précise
3. **confidence** - Score de confiance (0-1, minimum 0.97)
4. **reasoning** - Explication courte

Format JSON: {"category":"...","subcategory":"...","confidence":0.98,"reasoning":"..."}`

  return await generateJSON(
    'Tu es un expert en catégorisation e-commerce. Réponds uniquement en JSON valide.',
    prompt,
    { module: 'product', temperature: 0.1, enableCache: true }
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { productIds, productSource, userId }: CategorizeRequest = await req.json()

    if (!productIds || productIds.length === 0 || !productSource || !userId) {
      throw new Error('Missing required fields')
    }

    // Quota check (1 per product)
    const quota = await checkAndIncrementQuota(userId, 'product', productIds.length)
    if (!quota.allowed) return quotaExceededResponse(corsHeaders, quota)

    console.log(`Categorizing ${productIds.length} products from ${productSource}`)

    const results = []
    let processed = 0
    let failed = 0

    for (const productId of productIds) {
      try {
        const { data: product, error: productError } = await supabaseClient
          .from(productSource)
          .select('*')
          .eq('id', productId)
          .single()

        if (productError || !product) {
          failed++
          continue
        }

        const categorization = await categorizeProduct(product)

        if (categorization.confidence < 0.97) {
          console.warn(`Low confidence (${categorization.confidence}) for product ${productId}`)
        }

        const { error: upsertError } = await supabaseClient
          .from('product_ai_attributes')
          .upsert({
            user_id: userId,
            product_id: productId,
            product_source: productSource,
            ai_category: categorization.category,
            ai_subcategory: categorization.subcategory,
            category_confidence: categorization.confidence,
          }, { onConflict: 'user_id,product_id,product_source' })

        if (upsertError) {
          failed++
        } else {
          processed++
          results.push({
            productId,
            category: categorization.category,
            subcategory: categorization.subcategory,
            confidence: categorization.confidence
          })
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        console.error(`Error processing product ${productId}:`, error)
        failed++
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed, failed, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in categorize-products-ai:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
