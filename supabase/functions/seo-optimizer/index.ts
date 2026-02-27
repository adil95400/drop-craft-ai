/**
 * SEO Optimizer - Analyse et optimise le SEO des produits via Lovable AI
 * Accepte: { product_ids: string[], target_keywords?: string[], language?: string }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const { product_ids, target_keywords, language = 'fr' } = body

    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return new Response(JSON.stringify({ error: 'product_ids requis' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`[SEO-OPTIMIZER] User ${user.id} optimizing ${product_ids.length} products`)

    // Fetch products from both tables
    const results = []

    for (const productId of product_ids.slice(0, 10)) {
      // Try products table first, then imported_products
      let product = null
      let sourceTable = 'products'

      const { data: p1 } = await supabase
        .from('products')
        .select('id, name, description, category, sku, price, seo_title, seo_description, image_url')
        .eq('id', productId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (p1) {
        product = p1
      } else {
        const { data: p2 } = await supabase
          .from('imported_products')
          .select('id, name, description, category, sku, price, seo_title, seo_description, image_urls')
          .eq('id', productId)
          .eq('user_id', user.id)
          .maybeSingle()
        if (p2) {
          product = p2
          sourceTable = 'imported_products'
        }
      }

      if (!product) {
        results.push({ productId, status: 'not_found' })
        continue
      }

      // Use Lovable AI for SEO analysis
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
      if (!LOVABLE_API_KEY) {
        results.push({ productId, status: 'error', message: 'AI non configurée' })
        continue
      }

      const prompt = `Analyse SEO pour ce produit e-commerce et génère des optimisations.
Langue: ${language}
${target_keywords?.length ? `Mots-clés cibles: ${target_keywords.join(', ')}` : ''}

Produit:
- Titre: ${product.name || 'Sans titre'}
- Description: ${(product.description || '').slice(0, 500)}
- Catégorie: ${product.category || 'Non défini'}
- Prix: ${product.price || 0}€

Génère un JSON avec:
{
  "seo_title": "titre SEO optimisé (50-60 car.)",
  "seo_description": "meta description optimisée (140-160 car.)",
  "score": 0-100,
  "issues": [{"type": "warning|error", "message": "description du problème"}],
  "recommendations": ["conseil 1", "conseil 2"]
}`

      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'openai/gpt-5-nano',
            messages: [
              { role: 'system', content: 'Tu es un expert SEO e-commerce. Réponds uniquement en JSON valide.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.2,
          }),
        })

        if (!aiResponse.ok) {
          console.error(`AI error: ${aiResponse.status}`)
          results.push({ productId, status: 'error', message: 'Erreur IA' })
          continue
        }

        const aiData = await aiResponse.json()
        const content = aiData.choices?.[0]?.message?.content || ''
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        
        if (!jsonMatch) {
          results.push({ productId, status: 'error', message: 'Réponse IA invalide' })
          continue
        }

        const seoData = JSON.parse(jsonMatch[0])

        // Update product with SEO data
        const updatePayload: Record<string, any> = {}
        if (seoData.seo_title) updatePayload.seo_title = seoData.seo_title.slice(0, 200)
        if (seoData.seo_description) updatePayload.seo_description = seoData.seo_description.slice(0, 500)

        if (Object.keys(updatePayload).length > 0) {
          await supabase
            .from(sourceTable)
            .update(updatePayload)
            .eq('id', productId)
            .eq('user_id', user.id)
        }

        results.push({
          productId,
          status: 'completed',
          seo_title: seoData.seo_title,
          seo_description: seoData.seo_description,
          score: seoData.score || 0,
          issues: seoData.issues || [],
          recommendations: seoData.recommendations || [],
        })
      } catch (aiErr) {
        console.error('AI processing error:', aiErr)
        results.push({ productId, status: 'error', message: 'Erreur de traitement' })
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[SEO-OPTIMIZER] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur interne' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
