import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReadinessRequest {
  productId: string
  productSource: 'products' | 'imported_products' | 'supplier_products'
  userId: string
}

async function analyzeShoppingReadiness(product: any): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured')
  }
  
  const prompt = `Analyse ce produit e-commerce pour l'indexation dans Google AI Shopping et ChatGPT Shopping.

Produit:
- Nom: ${product.name || 'Sans nom'}
- Description: ${product.description || 'Sans description'}
- Prix: ${product.price || 0}€
- Images: ${product.image_url ? 'Oui' : 'Non'}
- Catégorie: ${product.category || 'Non défini'}
- SKU: ${product.sku || 'Non défini'}
- Attributs: ${JSON.stringify(product.attributes || {})}

Critères Google AI Shopping:
- Titre descriptif (50-80 caractères)
- Description détaillée (150+ mots)
- Prix clair
- Images haute qualité
- Catégorie précise
- Attributs structurés (taille, couleur, matière)
- Disponibilité (stock)

Critères ChatGPT Shopping:
- Titre clair et naturel
- Description conversationnelle
- Prix visible
- Attributs clés explicites
- Catégorisation logique

Analyse et retourne:
{
  "google_ready": true/false,
  "chatgpt_ready": true/false,
  "google_score": 0-100,
  "chatgpt_score": 0-100,
  "issues": [
    {"platform": "google/chatgpt", "issue": "description", "message": "Description trop courte (< 150 mots)", "severity": "error/warning"}
  ],
  "recommendations": [
    {"action": "...", "priority": "high/medium/low"}
  ]
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
          { role: 'system', content: 'Tu es un expert en optimisation e-commerce pour Google et ChatGPT Shopping. Réponds uniquement en JSON valide.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
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
    console.error('Error analyzing shopping readiness:', error)
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

    const { productId, productSource, userId }: ReadinessRequest = await req.json()

    if (!productId || !productSource || !userId) {
      throw new Error('Missing required fields')
    }

    console.log(`Analyzing shopping readiness for product ${productId}`)

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

    // Analyser avec l'IA
    const analysis = await analyzeShoppingReadiness(product)
    console.log('Shopping readiness analysis:', analysis)

    // Mettre à jour product_ai_attributes
    const { error: updateError } = await supabaseClient
      .from('product_ai_attributes')
      .upsert({
        user_id: userId,
        product_id: productId,
        product_source: productSource,
        google_shopping_ready: analysis.google_ready,
        chatgpt_shopping_ready: analysis.chatgpt_ready,
        shopping_readiness_issues: analysis.issues || [],
      }, {
        onConflict: 'user_id,product_id,product_source'
      })

    if (updateError) {
      console.error('Error saving readiness analysis:', updateError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in analyze-shopping-readiness:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})