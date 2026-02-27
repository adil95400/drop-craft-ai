import { handlePreflight, requireAuth, errorResponse, successResponse } from '../_shared/jwt-auth.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

// ── Versioned prompts ──────────────────────────────────────────────────
const PROMPT_VERSION = '1.3.0'
const MODEL = 'openai/gpt-5-nano'

const SYSTEM_PROMPT = `Tu es un expert en e-commerce et SEO. Tu enrichis les fiches produits pour maximiser les conversions et le référencement naturel. Tu retournes uniquement du JSON valide structuré.`

function buildUserPrompt(product: any, language: string, tone: string): string {
  const imageCount = Array.isArray(product.images) ? product.images.length : 0
  return `Enrichis ce produit pour le rendre attractif et SEO-optimisé.

Produit actuel:
- Titre: ${product.title || 'N/A'}
- Description: ${product.description || 'N/A'}
- Catégorie: ${product.category || 'N/A'}
- Prix: ${product.price || 'N/A'}
- Nombre d'images: ${imageCount}

Langue cible: ${language}
Ton de marque: ${tone}

Génère un JSON avec:
- title: titre optimisé (max 80 caractères, avec mots-clés pertinents)
- description: description enrichie (150-300 mots, persuasive, SEO-friendly)
- category: catégorie suggérée si manquante ou améliorée
- seo_title: balise title SEO (max 60 caractères)
- seo_description: meta description (max 160 caractères)
- tags: tableau de 5-8 tags pertinents
- image_alt_texts: tableau de ${Math.max(1, imageCount)} textes alternatifs SEO pour les images`
}

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const { product_ids, language = 'fr', tone = 'professionnel' } = await req.json()

    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return errorResponse('product_ids required', corsHeaders, 400)
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      return errorResponse('LOVABLE_API_KEY not configured', corsHeaders, 500)
    }

    // Create job (use service-scoped client for background work)
    const bgSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: job, error: jobError } = await bgSupabase
      .from('jobs')
      .insert({
        user_id: userId,
        job_type: 'ai_enrich',
        status: 'running',
        total_items: product_ids.length,
        processed_items: 0,
        failed_items: 0,
        progress_percent: 0,
        name: `Enrichissement IA (${product_ids.length} produits)`,
        started_at: new Date().toISOString(),
        metadata: { prompt_version: PROMPT_VERSION, model: MODEL, language, tone, items_succeeded: 0 },
      })
      .select('id')
      .single()

    if (jobError) throw jobError

    // ── Background processing ──────────────────────────────────────────
    const processProducts = async () => {
      let succeeded = 0
      let failed = 0

      for (let i = 0; i < product_ids.length; i++) {
        const productId = product_ids[i]
        const startTime = Date.now()

        try {
          // Use RLS-scoped client to verify ownership
          const { data: product } = await supabase
            .from('products')
            .select('title, description, category, price, images')
            .eq('id', productId)
            .single()

          if (!product) {
            await bgSupabase.from('product_ai_enrichments').insert({
              product_id: productId, job_id: job.id, user_id: userId,
              status: 'failed', error_message: 'Product not found',
              model: MODEL, prompt_version: PROMPT_VERSION, language, tone,
            })
            failed++
            continue
          }

          const userPrompt = buildUserPrompt(product, language, tone)

          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: MODEL,
              messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userPrompt },
              ],
              temperature: 0.7,
            }),
          })

          const durationMs = Date.now() - startTime

          if (!aiResponse.ok) {
            const errBody = await aiResponse.text()
            console.error(`AI error for ${productId}: ${aiResponse.status}`)
            await bgSupabase.from('product_ai_enrichments').insert({
              product_id: productId, job_id: job.id, user_id: userId,
              original_title: product.title, original_description: product.description,
              original_category: product.category, status: 'failed',
              error_message: `AI ${aiResponse.status}: ${errBody.substring(0, 500)}`,
              model: MODEL, prompt_version: PROMPT_VERSION, language, tone, generation_time_ms: durationMs,
            })
            failed++
            continue
          }

          const aiData = await aiResponse.json()
          const content = aiData.choices?.[0]?.message?.content || ''
          let enriched: any = {}

          try {
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            enriched = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content)
          } catch {
            console.error(`JSON parse error for ${productId}`)
            failed++
            continue
          }

          // Persist enrichment
          await bgSupabase.from('product_ai_enrichments').insert({
            product_id: productId, job_id: job.id, user_id: userId,
            original_title: product.title, original_description: product.description,
            original_category: product.category,
            enriched_title: enriched.title || null, enriched_description: enriched.description || null,
            enriched_category: enriched.category || null, enriched_seo_title: enriched.seo_title || null,
            enriched_seo_description: enriched.seo_description || null, enriched_tags: enriched.tags || null,
            model: MODEL, prompt_version: PROMPT_VERSION, language, tone,
            generation_time_ms: durationMs, status: 'generated',
          })

          // Apply to product via RLS-scoped client
          const updateData: any = {}
          if (enriched.title) updateData.title = enriched.title
          if (enriched.description) updateData.description = enriched.description
          if (enriched.category) updateData.category = enriched.category
          if (enriched.seo_title) updateData.seo_title = enriched.seo_title
          if (enriched.seo_description) updateData.seo_description = enriched.seo_description
          if (enriched.tags) updateData.tags = enriched.tags

          if (enriched.image_alt_texts && Array.isArray(product.images) && product.images.length > 0) {
            const updatedImages = product.images.map((img: any, idx: number) => {
              const altText = enriched.image_alt_texts[idx] || enriched.image_alt_texts[0] || enriched.title
              return typeof img === 'string' ? { url: img, alt: altText } : { ...img, alt: altText }
            })
            updateData.images = updatedImages
          }

          if (Object.keys(updateData).length > 0) {
            await supabase.from('products').update(updateData).eq('id', productId)

            await bgSupabase.from('product_ai_enrichments')
              .update({ status: 'applied', applied_at: new Date().toISOString() })
              .eq('product_id', productId).eq('job_id', job.id).eq('status', 'generated')

            succeeded++
          } else {
            failed++
          }
        } catch (err) {
          console.error(`Error enriching ${productId}:`, err)
          failed++
        }

        // Update job progress
        const processed = i + 1
        const progress = Math.round((processed / product_ids.length) * 100)
        await bgSupabase.from('jobs').update({
          processed_items: processed, failed_items: failed, progress_percent: progress,
          progress_message: `${processed}/${product_ids.length} produits traités`,
          metadata: { prompt_version: PROMPT_VERSION, model: MODEL, language, tone, items_succeeded: succeeded },
        }).eq('id', job.id)
      }

      await bgSupabase.from('jobs').update({
        status: failed === product_ids.length ? 'failed' : 'completed',
        completed_at: new Date().toISOString(), progress_percent: 100,
        progress_message: `Terminé: ${succeeded} enrichis, ${failed} échecs`,
        error_message: failed > 0 ? `${failed} produit(s) non enrichi(s)` : null,
      }).eq('id', job.id)
    }

    processProducts().catch((err) => console.error('[ai-enrich-import] background error:', err))

    return successResponse({ job_id: job.id, message: 'Enrichissement IA démarré' }, corsHeaders)
  } catch (error: any) {
    if (error instanceof Response) return error
    console.error('[ai-enrich-import] error:', error)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return errorResponse(error.message || 'Unknown error', getSecureCorsHeaders(origin), 500)
  }
})
