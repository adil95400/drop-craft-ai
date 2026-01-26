import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions'

interface OptimizationRequest {
  type: 'title' | 'description' | 'seo' | 'tags' | 'full'
  product: {
    title: string
    description?: string
    price?: number
    category?: string
    platform?: string
  }
  language?: string
  targetMarket?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const requestId = crypto.randomUUID().slice(0, 8)
  console.log(`[${requestId}] AI Optimize request`)

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Validate extension token
    const extensionToken = req.headers.get('x-extension-token')
    if (!extensionToken?.startsWith('ext_')) {
      return new Response(JSON.stringify({ error: 'Token invalide' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: authData } = await supabase
      .from('extension_auth_tokens')
      .select('user_id, is_active')
      .eq('token', extensionToken)
      .eq('is_active', true)
      .single()

    if (!authData) {
      return new Response(JSON.stringify({ error: 'Token expiré' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { type, product, language = 'fr', targetMarket = 'France' }: OptimizationRequest = await req.json()

    if (!product?.title) {
      return new Response(JSON.stringify({ error: 'Produit requis' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`[${requestId}] Optimizing: ${type} for "${product.title.substring(0, 50)}"`)

    if (!LOVABLE_API_KEY) {
      // Fallback sans IA
      return new Response(JSON.stringify({
        success: true,
        optimized: {
          title: cleanTitle(product.title),
          description: product.description || '',
          seo_title: product.title.substring(0, 60),
          seo_description: (product.description || '').substring(0, 160),
          tags: extractTags(product.title)
        },
        fallback: true
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Build AI prompt based on type
    const prompts = {
      title: `Tu es un expert e-commerce. Optimise ce titre produit pour le SEO et la conversion.
Titre original: "${product.title}"
Catégorie: ${product.category || 'Non spécifiée'}
Prix: ${product.price || 'Non spécifié'}€
Marché: ${targetMarket}
Langue: ${language}

Réponds UNIQUEMENT avec le titre optimisé, sans guillemets ni explication.`,

      description: `Tu es un copywriter e-commerce expert. Réécris cette description produit pour maximiser les ventes.
Titre: "${product.title}"
Description originale: "${product.description || 'Aucune'}"
Prix: ${product.price || 'Non spécifié'}€
Marché: ${targetMarket}

Écris une description de 150-300 mots en ${language}:
- Commence par un hook accrocheur
- Utilise des bullet points pour les caractéristiques
- Inclus un appel à l'action
- Optimise pour le SEO

Réponds UNIQUEMENT avec la description, sans titre ni explication.`,

      seo: `Tu es un expert SEO e-commerce. Génère les métadonnées SEO optimisées.
Titre: "${product.title}"
Description: "${product.description?.substring(0, 500) || 'Aucune'}"
Marché: ${targetMarket}
Langue: ${language}

Réponds en JSON strict:
{
  "seo_title": "titre SEO max 60 caractères",
  "seo_description": "meta description max 160 caractères avec mots-clés"
}`,

      tags: `Tu es un expert e-commerce. Génère des tags produit pertinents.
Titre: "${product.title}"
Catégorie: ${product.category || 'Non spécifiée'}
Marché: ${targetMarket}

Génère 5-10 tags pertinents pour le référencement.
Réponds en JSON: ["tag1", "tag2", "tag3", ...]`,

      full: `Tu es un expert e-commerce et copywriter. Optimise complètement ce produit.
Titre: "${product.title}"
Description: "${product.description?.substring(0, 1000) || 'Aucune'}"
Prix: ${product.price || 'Non spécifié'}€
Catégorie: ${product.category || 'Non spécifiée'}
Plateforme source: ${product.platform || 'Inconnue'}
Marché cible: ${targetMarket}
Langue: ${language}

Réponds UNIQUEMENT en JSON valide:
{
  "title": "titre optimisé max 80 caractères",
  "description": "description HTML 150-300 mots avec bullet points",
  "seo_title": "meta title max 60 caractères",
  "seo_description": "meta description max 160 caractères",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`
    }

    const systemPrompt = "Tu es un assistant e-commerce expert en SEO et copywriting. Réponds toujours de manière concise et professionnelle."
    const userPrompt = prompts[type] || prompts.title

    // Call AI Gateway
    const aiResponse = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error(`[${requestId}] AI error:`, aiResponse.status, errorText)
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requêtes atteinte, réessayez plus tard' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      // Fallback
      return new Response(JSON.stringify({
        success: true,
        optimized: {
          title: cleanTitle(product.title),
          description: product.description || '',
          seo_title: product.title.substring(0, 60),
          seo_description: (product.description || '').substring(0, 160),
          tags: extractTags(product.title)
        },
        fallback: true
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const aiData = await aiResponse.json()
    const content = aiData.choices?.[0]?.message?.content || ''

    console.log(`[${requestId}] AI response received, ${content.length} chars`)

    // Parse response based on type
    let optimized: any = {}

    if (type === 'title') {
      optimized = { title: content.trim().replace(/^["']|["']$/g, '') }
    } else if (type === 'description') {
      optimized = { description: content.trim() }
    } else if (type === 'seo' || type === 'tags' || type === 'full') {
      try {
        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
        if (jsonMatch) {
          optimized = JSON.parse(jsonMatch[0])
        } else {
          optimized = type === 'tags' ? { tags: content.split(',').map((t: string) => t.trim()) } : { raw: content }
        }
      } catch (e) {
        console.warn(`[${requestId}] JSON parse warning:`, e)
        optimized = { raw: content }
      }
    }

    // Log usage
    await supabase.from('extension_analytics').insert({
      user_id: authData.user_id,
      event_type: 'ai_optimization',
      event_data: {
        type,
        product_title: product.title.substring(0, 50),
        language,
        tokens_used: aiData.usage?.total_tokens || 0
      }
    }).catch(() => {})

    console.log(`[${requestId}] ✅ Optimization complete`)

    return new Response(JSON.stringify({
      success: true,
      optimized,
      tokens_used: aiData.usage?.total_tokens || 0
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error(`[${requestId}] Error:`, error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: (error as Error).message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// Helper functions
function cleanTitle(title: string): string {
  return title
    .replace(/\|.*$/, '')
    .replace(/-\s*(Amazon|AliExpress|Shopify).*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 80)
}

function extractTags(title: string): string[] {
  const words = title.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 10)
  
  return [...new Set(words)]
}
