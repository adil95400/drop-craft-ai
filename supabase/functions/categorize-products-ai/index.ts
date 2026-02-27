import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

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
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured')
  }
  
  const prompt = `Catégorise ce produit e-commerce avec précision (97% de confiance minimum).

Produit:
- Nom: ${product.name || 'Sans nom'}
- Description: ${product.description || 'Sans description'}
- Prix: ${product.price || 0}€
- Catégorie actuelle: ${product.category || 'Non catégorisé'}

Analyse et retourne:
1. **category** - Catégorie principale (ex: "Vêtements", "Électronique", "Maison & Jardin", "Sports", "Beauté")
2. **subcategory** - Sous-catégorie précise (ex: "T-Shirts", "Smartphones", "Décoration murale")
3. **confidence** - Score de confiance (0-1, minimum 0.97 requis)
4. **reasoning** - Explication courte de la catégorisation

Format JSON strict:
{
  "category": "...",
  "subcategory": "...",
  "confidence": 0.98,
  "reasoning": "..."
}`

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          { role: 'system', content: 'Tu es un expert en catégorisation e-commerce. Réponds uniquement en JSON valide.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1, // Basse température pour cohérence
      }),
    })
    
    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`)
    }
    
    const data = await response.json()
    const content = data.choices[0].message.content
    
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid AI response format')
    }
    
    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Error categorizing product:', error)
    throw error
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { productIds, productSource, userId }: CategorizeRequest = await req.json()

    if (!productIds || productIds.length === 0 || !productSource || !userId) {
      throw new Error('Missing required fields')
    }

    console.log(`Categorizing ${productIds.length} products from ${productSource}`)

    const results = []
    let processed = 0
    let failed = 0

    for (const productId of productIds) {
      try {
        // Récupérer le produit
        const { data: product, error: productError } = await supabaseClient
          .from(productSource)
          .select('*')
          .eq('id', productId)
          .single()

        if (productError || !product) {
          console.error(`Product ${productId} not found`)
          failed++
          continue
        }

        // Catégoriser avec l'IA
        const categorization = await categorizeProduct(product)
        
        if (categorization.confidence < 0.97) {
          console.warn(`Low confidence (${categorization.confidence}) for product ${productId}`)
        }

        // Sauvegarder dans product_ai_attributes
        const { error: upsertError } = await supabaseClient
          .from('product_ai_attributes')
          .upsert({
            user_id: userId,
            product_id: productId,
            product_source: productSource,
            ai_category: categorization.category,
            ai_subcategory: categorization.subcategory,
            category_confidence: categorization.confidence,
          }, {
            onConflict: 'user_id,product_id,product_source'
          })

        if (upsertError) {
          console.error(`Error saving categorization for ${productId}:`, upsertError)
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

        // Petit délai pour éviter rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        console.error(`Error processing product ${productId}:`, error)
        failed++
      }
    }

    console.log(`Categorization complete: ${processed} succeeded, ${failed} failed`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed,
        failed,
        results
      }),
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