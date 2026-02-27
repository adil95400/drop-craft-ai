import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RewriteRequest {
  productId: string
  productSource: 'products' | 'imported_products' | 'supplier_products'
  userId: string
  rewriteType: 'title' | 'description' | 'both'
  tone: 'professional' | 'casual' | 'luxury' | 'technical' | 'creative'
}

const toneDescriptions = {
  professional: 'Professionnel et formel, adapté au B2B et e-commerce premium',
  casual: 'Décontracté et amical, proche du client',
  luxury: 'Luxueux et exclusif, vocabulaire raffiné, évoque le prestige',
  technical: 'Technique et précis, avec spécifications détaillées',
  creative: 'Créatif et original, storytelling engageant'
}

async function rewriteContent(
  product: any, 
  rewriteType: string, 
  tone: string
): Promise<{ title?: string; description?: string }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured')
  }
  
  const toneDesc = toneDescriptions[tone as keyof typeof toneDescriptions]
  
  let prompt = `Tu es un expert en copywriting e-commerce. Réécris le contenu de ce produit avec un ton ${tone} (${toneDesc}).

Produit actuel:
- Nom: ${product.name || 'Sans nom'}
- Description: ${product.description || 'Sans description'}
- Prix: ${product.price || 0}€
- Catégorie: ${product.category || 'Non catégorisé'}

`

  if (rewriteType === 'title' || rewriteType === 'both') {
    prompt += `
**TITRE** (50-80 caractères):
- Clair et descriptif
- Inclure le bénéfice principal
- Optimisé SEO avec mots-clés naturels
- Ton ${tone}
`
  }

  if (rewriteType === 'description' || rewriteType === 'both') {
    prompt += `
**DESCRIPTION** (150-300 mots):
- Structure: Hook engageant → Caractéristiques → Bénéfices → Call-to-action
- Paragraphes courts et aérés
- Points forts en listes à puces
- Ton ${tone}
- Optimisée pour la conversion
`
  }

  prompt += `
Format de réponse (JSON strict):
{
  ${rewriteType === 'title' || rewriteType === 'both' ? '"title": "...",' : ''}
  ${rewriteType === 'description' || rewriteType === 'both' ? '"description": "..."' : ''}
}`

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-nano',
        messages: [
          { role: 'system', content: 'Tu es un expert copywriter e-commerce. Réponds uniquement en JSON valide.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI API error:', response.status, errorText)
      throw new Error(`AI API error: ${response.status}`)
    }
    
    const data = await response.json()
    const content = data.choices[0].message.content
    
    // Extraire le JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('No JSON found in AI response:', content)
      throw new Error('Invalid AI response format')
    }
    
    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Error rewriting content:', error)
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

    const { productId, productSource, userId, rewriteType, tone }: RewriteRequest = await req.json()

    if (!productId || !productSource || !userId || !rewriteType || !tone) {
      throw new Error('Missing required fields')
    }

    console.log(`Rewriting ${rewriteType} for product ${productId} with ${tone} tone`)

    // Récupérer le produit
    const { data: product, error: productError } = await supabaseClient
      .from(productSource)
      .select('*')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      throw new Error(`Product not found: ${productError?.message}`)
    }

    console.log('Product retrieved:', product.name)

    // Générer le nouveau contenu
    const rewrittenContent = await rewriteContent(product, rewriteType, tone)
    console.log('Content rewritten:', rewrittenContent)

    // Sauvegarder dans l'historique
    const { data: rewriteRecord, error: insertError } = await supabaseClient
      .from('product_rewrites')
      .insert({
        user_id: userId,
        product_id: productId,
        product_source: productSource,
        rewrite_type: rewriteType,
        tone: tone,
        original_title: product.name,
        original_description: product.description,
        rewritten_title: rewrittenContent.title || null,
        rewritten_description: rewrittenContent.description || null,
        was_applied: false,
        ai_model: 'openai/gpt-5-nano',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error saving rewrite:', insertError)
      throw insertError
    }

    console.log('Rewrite saved successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        rewrite: rewriteRecord 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in rewrite-product-content:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})