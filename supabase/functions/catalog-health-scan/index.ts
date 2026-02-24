/**
 * Catalog Health Scan — SECURED (JWT-first, RLS-enforced)
 * Scores all user products on 6 pillars and persists to product_scores.
 */

import { requireAuth, handlePreflight, successResponse, errorResponse } from '../_shared/jwt-auth.ts'

const PILLAR_WEIGHTS = { title: 20, description: 20, images: 20, pricing: 15, identifiers: 15, seo: 10 }

function scoreProduct(p: any) {
  const title = p.title || p.name || ''
  const desc = (p.description || '').replace(/<[^>]*>/g, '').trim()
  const images = p.images || []
  const imageCount = images.length + (p.image_url && !images.includes(p.image_url) ? 1 : 0)
  const price = Number(p.price || p.sale_price || 0)
  const costPrice = Number(p.cost_price || 0)
  const stock = p.stock_quantity ?? -1

  // Title (0-100)
  let titleScore = 0
  if (title.length >= 25 && title.length <= 80) titleScore += 35
  else if (title.length > 0 && title.length < 25) titleScore += Math.round((title.length / 25) * 20)
  else if (title.length > 80) titleScore += 25
  if (title.split(/\s+/).length >= 4) titleScore += 25
  else if (title.split(/\s+/).length >= 2) titleScore += 15
  if (/^[A-ZÀ-ÿ]/.test(title)) titleScore += 15
  if (!/[!]{2,}|[A-Z]{10,}/i.test(title)) titleScore += 15
  if (!title.includes('  ')) titleScore += 10
  titleScore = Math.min(100, titleScore)

  // Description (0-100)
  let descScore = 0
  if (desc.length >= 150) descScore += 35
  else if (desc.length > 0) descScore += Math.round((desc.length / 150) * 20)
  if (desc.split(/\s+/).length >= 30) descScore += 20
  else if (desc.split(/\s+/).length >= 10) descScore += 10
  if (/<(ul|ol|li|h[2-6]|strong|p)/.test(p.description || '')) descScore += 15
  else if (desc.length > 200) descScore += 8
  if (/\d/.test(desc)) descScore += 10
  if (/[.!?]$/.test(desc)) descScore += 10
  if (desc && desc !== title) descScore += 10
  descScore = Math.min(100, descScore)

  // Images (0-100)
  let imgScore = 0
  if (imageCount >= 1) imgScore += 30
  if (imageCount >= 3) imgScore += 30
  else if (imageCount >= 2) imgScore += 15
  if (imageCount >= 5) imgScore += 20
  else if (imageCount >= 3) imgScore += 10
  if (p.image_url) imgScore += 20
  imgScore = Math.min(100, imgScore)

  // Pricing (0-100)
  let pricingScore = 0
  if (price > 0) {
    pricingScore += 35
    if (costPrice > 0) {
      pricingScore += 15
      const margin = ((price - costPrice) / price) * 100
      if (margin >= 20) pricingScore += 10
    }
    if (stock > 5) pricingScore += 25
    else if (stock > 0) pricingScore += 15
    else if (stock < 0) pricingScore += 10
    if (p.status === 'active') pricingScore += 15
    else if (p.status === 'draft') pricingScore += 5
  }
  pricingScore = Math.min(100, pricingScore)

  // Identifiers (0-100)
  let idScore = 0
  if (p.sku) idScore += 30
  if (p.category) idScore += 25
  if (p.brand) idScore += 20
  if (p.barcode) idScore += 15
  if ((p.tags?.length || 0) >= 2) idScore += 10
  else if ((p.tags?.length || 0) > 0) idScore += 5
  idScore = Math.min(100, idScore)

  // SEO (0-100)
  let seoScore = 0
  const seoTitle = p.seo_title || ''
  if (seoTitle.length >= 20 && seoTitle.length <= 60) seoScore += 30
  else if (seoTitle.length > 0) seoScore += 15
  const seoDesc = p.seo_description || ''
  if (seoDesc.length >= 100 && seoDesc.length <= 160) seoScore += 30
  else if (seoDesc.length > 0) seoScore += 15
  if ((p.tags?.length || 0) >= 3) seoScore += 20
  else if ((p.tags?.length || 0) >= 1) seoScore += 8
  const titleWords = title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3)
  const descLower = desc.toLowerCase()
  const overlap = titleWords.filter((w: string) => descLower.includes(w)).length
  if (overlap >= 2) seoScore += 20
  else if (overlap >= 1) seoScore += 10
  seoScore = Math.min(100, seoScore)

  const overall = Math.round(
    (titleScore * PILLAR_WEIGHTS.title +
     descScore * PILLAR_WEIGHTS.description +
     imgScore * PILLAR_WEIGHTS.images +
     pricingScore * PILLAR_WEIGHTS.pricing +
     idScore * PILLAR_WEIGHTS.identifiers +
     seoScore * PILLAR_WEIGHTS.seo) / 100
  )

  const issues: any[] = []
  if (!title) issues.push({ category: 'title', message: 'Titre manquant', severity: 'error' })
  else if (title.length < 25) issues.push({ category: 'title', message: 'Titre trop court', severity: 'warning' })
  if (!desc) issues.push({ category: 'description', message: 'Description manquante', severity: 'error' })
  else if (desc.length < 150) issues.push({ category: 'description', message: 'Description courte', severity: 'warning' })
  if (imageCount === 0) issues.push({ category: 'images', message: 'Aucune image', severity: 'error' })
  if (price <= 0) issues.push({ category: 'pricing', message: 'Prix non défini', severity: 'error' })
  if (!p.sku) issues.push({ category: 'identifiers', message: 'SKU manquant', severity: 'warning' })
  if (!seoTitle) issues.push({ category: 'seo', message: 'Titre SEO manquant', severity: 'warning' })

  const recommendations: any[] = []
  if (titleScore < 60) recommendations.push({ category: 'title', message: 'Optimiser le titre avec des mots-clés', impact: 'high' })
  if (descScore < 60) recommendations.push({ category: 'description', message: 'Enrichir la description produit', impact: 'high' })
  if (imgScore < 60) recommendations.push({ category: 'images', message: 'Ajouter plus d\'images', impact: 'high' })
  if (seoScore < 40) recommendations.push({ category: 'seo', message: 'Générer les méta-données SEO', impact: 'medium' })

  return {
    overall, titleScore, descScore, imgScore, seoScore, pricingScore, idScore,
    issues, recommendations
  }
}

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const body = await req.json().catch(() => ({}))
    const action = body.action || 'batch_scan'

    if (action === 'batch_scan') {
      const { data: products, error: pErr } = await supabase
        .from('products')
        .select('id, title, name, description, image_url, images, price, cost_price, stock_quantity, sku, barcode, category, brand, tags, seo_title, seo_description, status')
        .eq('user_id', userId)
        .limit(1000)

      if (pErr) throw pErr

      let scanned = 0
      let totalScore = 0
      const batchSize = 50

      for (let i = 0; i < (products || []).length; i += batchSize) {
        const batch = products!.slice(i, i + batchSize)
        const upserts = batch.map(p => {
          const result = scoreProduct(p)
          scanned++
          totalScore += result.overall
          return {
            user_id: userId,
            product_id: p.id,
            overall_score: result.overall,
            title_score: result.titleScore,
            description_score: result.descScore,
            images_score: result.imgScore,
            seo_score: result.seoScore,
            pricing_score: result.pricingScore,
            attributes_score: result.idScore,
            issues: result.issues,
            recommendations: result.recommendations,
            last_analyzed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        })

        await supabase.from('product_scores').upsert(upserts, { onConflict: 'product_id' })
      }

      const averageScore = scanned > 0 ? Math.round(totalScore / scanned) : 0

      return successResponse({ ok: true, scanned, averageScore, timestamp: new Date().toISOString() }, corsHeaders)
    }

    if (action === 'single_scan') {
      const productId = body.product_id
      if (!productId) throw new Error('product_id required')

      const { data: product, error: pErr } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('user_id', userId)
        .single()

      if (pErr || !product) throw new Error('Product not found')

      const result = scoreProduct(product)

      await supabase.from('product_scores').upsert({
        user_id: userId,
        product_id: productId,
        overall_score: result.overall,
        title_score: result.titleScore,
        description_score: result.descScore,
        images_score: result.imgScore,
        seo_score: result.seoScore,
        pricing_score: result.pricingScore,
        attributes_score: result.idScore,
        issues: result.issues,
        recommendations: result.recommendations,
        last_analyzed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'product_id' })

      return successResponse({ ok: true, score: result.overall, details: result }, corsHeaders)
    }

    return errorResponse('Unknown action', corsHeaders, 400)
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[catalog-health-scan] Error:', err)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : 'Erreur interne' }),
      { status: 500, headers: { ...getSecureCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  }
})