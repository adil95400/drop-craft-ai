import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AttributesRequest {
  productId: string
  productSource: 'products' | 'imported_products' | 'supplier_products'
  userId: string
}

async function generateAttributes(product: any): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured')
  }
  
  const prompt = `Analysez ce produit e-commerce et générez des attributs détaillés en JSON:

Produit:
- Nom: ${product.name || 'Sans nom'}
- Description: ${product.description || 'Sans description'}
- Catégorie: ${product.category || 'Non catégorisé'}
- Prix: ${product.price || 0}€

Générez:
1. **material** (texte) - matière principale (ex: "Coton", "Acier inoxydable", "Bois massif")
2. **color** (array) - couleurs principales (ex: ["Noir", "Gris"])
3. **style** (array) - styles/genres (ex: ["Moderne", "Minimaliste", "Élégant"])
4. **target_audience** (array) - public cible (ex: ["Homme", "Femme", "Enfant", "Professionnel"])
5. **season** (array) - saisons appropriées (ex: ["Printemps", "Été", "Automne", "Hiver", "Toute saison"])
6. **ai_category** (texte) - catégorie principale détectée
7. **ai_subcategory** (texte) - sous-catégorie spécifique
8. **category_confidence** (nombre 0-1) - confiance dans la catégorisation
9. **seo_keywords** (array) - 8-10 mots-clés SEO pertinents
10. **meta_title** (texte) - titre SEO optimisé (50-60 caractères)
11. **meta_description** (texte) - meta description (150-160 caractères)

Format de réponse (JSON strict):
{
  "material": "...",
  "color": ["...", "..."],
  "style": ["...", "..."],
  "target_audience": ["...", "..."],
  "season": ["...", "..."],
  "ai_category": "...",
  "ai_subcategory": "...",
  "category_confidence": 0.95,
  "seo_keywords": ["...", "...", "..."],
  "meta_title": "...",
  "meta_description": "..."
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
          { role: 'system', content: 'Tu es un expert en e-commerce et catégorisation de produits. Réponds uniquement en JSON valide.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
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
    console.error('Error generating attributes:', error)
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

    const { productId, productSource, userId }: AttributesRequest = await req.json()

    if (!productId || !productSource || !userId) {
      throw new Error('Missing required fields')
    }

    console.log(`Generating attributes for product ${productId} from ${productSource}`)

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

    // Générer les attributs avec l'IA
    const attributes = await generateAttributes(product)
    console.log('Attributes generated:', attributes)

    // Sauvegarder dans la DB
    const { data: savedAttributes, error: insertError } = await supabaseClient
      .from('product_ai_attributes')
      .upsert({
        user_id: userId,
        product_id: productId,
        product_source: productSource,
        material: attributes.material,
        color: attributes.color,
        style: attributes.style,
        target_audience: attributes.target_audience,
        season: attributes.season,
        ai_category: attributes.ai_category,
        ai_subcategory: attributes.ai_subcategory,
        category_confidence: attributes.category_confidence,
        seo_keywords: attributes.seo_keywords,
        meta_title: attributes.meta_title,
        meta_description: attributes.meta_description,
        google_shopping_ready: false,
        chatgpt_shopping_ready: false,
        shopping_readiness_issues: [],
      }, {
        onConflict: 'user_id,product_id,product_source'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error saving attributes:', insertError)
      throw insertError
    }

    console.log('Attributes saved successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        attributes: savedAttributes 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in generate-product-attributes:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})