/**
 * SEO Hub — Consolidated SEO operations
 * Replaces ~10 individual SEO functions
 * 
 * Actions: audit, optimize, generate, fix, issues, translate, score
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
import { generateText } from '../_shared/ai-client.ts'

async function callAI(system: string, prompt: string) {
  if (!OPENAI_API_KEY) return null
  const res = await fetch(AI_GATEWAY_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 1200,
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.choices?.[0]?.message?.content || null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const action = body.action || new URL(req.url).searchParams.get('action')

    switch (action) {
      case 'audit': {
        const { product_id } = body
        if (!product_id) throw new Error('product_id required')

        const { data: product } = await supabase.from('products')
          .select('id, title, description, seo_title, seo_description, tags, images')
          .eq('id', product_id).eq('user_id', user.id).single()

        if (!product) throw new Error('Product not found')

        const issues: any[] = []
        let score = 100

        if (!product.seo_title || product.seo_title.length < 30) {
          issues.push({ type: 'warning', field: 'seo_title', message: 'Title trop court (<30 caractères)' })
          score -= 15
        }
        if (product.seo_title && product.seo_title.length > 60) {
          issues.push({ type: 'warning', field: 'seo_title', message: 'Title trop long (>60 caractères)' })
          score -= 10
        }
        if (!product.seo_description || product.seo_description.length < 120) {
          issues.push({ type: 'warning', field: 'seo_description', message: 'Meta description trop courte' })
          score -= 15
        }
        if (!product.description || product.description.length < 100) {
          issues.push({ type: 'error', field: 'description', message: 'Description produit insuffisante' })
          score -= 20
        }
        if (!product.tags || product.tags.length === 0) {
          issues.push({ type: 'info', field: 'tags', message: 'Aucun tag défini' })
          score -= 10
        }
        if (!product.images || (Array.isArray(product.images) && product.images.length === 0)) {
          issues.push({ type: 'error', field: 'images', message: 'Aucune image produit' })
          score -= 20
        }

        // Store audit result
        await supabase.from('seo_scores').upsert({
          user_id: user.id,
          product_id,
          score: Math.max(0, score),
          issues,
          audited_at: new Date().toISOString(),
        }, { onConflict: 'product_id' }).catch(() => {})

        return jsonResponse({ product_id, score: Math.max(0, score), issues, total_issues: issues.length })
      }

      case 'generate': {
        const { product_id, fields } = body
        if (!product_id) throw new Error('product_id required')

        const { data: product } = await supabase.from('products')
          .select('*').eq('id', product_id).eq('user_id', user.id).single()
        if (!product) throw new Error('Product not found')

        const targetFields = fields || ['seo_title', 'seo_description']
        const result: any = {}

        const aiResult = await callAI(
          'Tu es un expert SEO e-commerce. Génère du contenu SEO optimisé en français.',
          `Produit: ${product.title}\nDescription: ${product.description || 'N/A'}\nPrix: ${product.price}€\n\nGénère:\n- seo_title (max 60 chars, avec mot-clé principal)\n- seo_description (120-160 chars, call-to-action)\n- tags (5-8 tags pertinents séparés par des virgules)\n\nFormat JSON: {"seo_title":"...","seo_description":"...","tags":"..."}`
        )

        if (aiResult) {
          try {
            const parsed = JSON.parse(aiResult.replace(/```json?\n?/g, '').replace(/```/g, '').trim())
            result.seo_title = parsed.seo_title
            result.seo_description = parsed.seo_description
            result.tags = parsed.tags?.split(',').map((t: string) => t.trim()) || []
          } catch {
            result.seo_title = `${product.title} - Achat en ligne au meilleur prix`
            result.seo_description = `Découvrez ${product.title}. Livraison rapide et retours gratuits. Commandez maintenant!`
          }
        } else {
          result.seo_title = `${product.title} - Achat en ligne au meilleur prix`
          result.seo_description = `Découvrez ${product.title}. Livraison rapide et retours gratuits.`
        }

        return jsonResponse({ product_id, generated: result })
      }

      case 'fix': {
        const { product_id, fixes } = body
        if (!product_id || !fixes) throw new Error('product_id and fixes required')

        const updateData: any = { updated_at: new Date().toISOString() }
        if (fixes.seo_title) updateData.seo_title = fixes.seo_title
        if (fixes.seo_description) updateData.seo_description = fixes.seo_description
        if (fixes.tags) updateData.tags = fixes.tags

        const { error } = await supabase.from('products')
          .update(updateData).eq('id', product_id).eq('user_id', user.id)
        if (error) throw error

        return jsonResponse({ message: 'SEO fixes applied', product_id })
      }

      case 'issues': {
        const { limit = 20 } = body
        const { data: products } = await supabase.from('products')
          .select('id, title, seo_title, seo_description, description')
          .eq('user_id', user.id)
          .limit(limit)

        const productsWithIssues = (products || []).filter((p: any) => 
          !p.seo_title || !p.seo_description || (p.description || '').length < 100
        ).map((p: any) => ({
          id: p.id,
          title: p.title,
          missing: [
            !p.seo_title && 'seo_title',
            !p.seo_description && 'seo_description',
            (p.description || '').length < 100 && 'description',
          ].filter(Boolean)
        }))

        return jsonResponse({ products_with_issues: productsWithIssues, count: productsWithIssues.length })
      }

      case 'score': {
        const { data: products } = await supabase.from('products')
          .select('id, title, seo_title, seo_description, description, tags, images')
          .eq('user_id', user.id)
          .limit(100)

        let totalScore = 0
        const scores = (products || []).map((p: any) => {
          let s = 100
          if (!p.seo_title) s -= 20
          if (!p.seo_description) s -= 20
          if (!p.description || p.description.length < 100) s -= 20
          if (!p.tags?.length) s -= 10
          s = Math.max(0, s)
          totalScore += s
          return { id: p.id, title: p.title, score: s }
        })

        const avg = scores.length ? Math.round(totalScore / scores.length) : 0
        return jsonResponse({ average_score: avg, products: scores.slice(0, 20), total_analyzed: scores.length })
      }

      default:
        return jsonResponse({ error: `Unknown action: ${action}`, available_actions: [
          'audit', 'generate', 'fix', 'issues', 'score'
        ]}, 400)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error'
    return new Response(JSON.stringify({ error: message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Content-Type': 'application/json',
    }
  })
}
