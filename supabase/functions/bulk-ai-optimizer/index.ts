import { handlePreflight, requireAuth, errorResponse, successResponse } from '../_shared/jwt-auth.ts'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const body = await req.json()

    let productIds: string[] = []
    let action = 'full_optimization'
    let batchSize = 10

    if (body.productIds && body.action) {
      productIds = body.productIds
      action = body.action
      batchSize = body.batchSize || 10
    } else if (body.filter_criteria && body.enrichment_types) {
      productIds = body.filter_criteria?.product_ids || []
      const types: string[] = body.enrichment_types || []
      if (types.includes('full')) action = 'full_optimization'
      else if (types.includes('seo')) action = 'generate_seo'
      else if (types.includes('description')) action = 'rewrite_descriptions'
      else if (types.includes('title')) action = 'rewrite_titles'
      else if (types.includes('attributes')) action = 'complete_attributes'
      else if (types.includes('pricing')) action = 'optimize_pricing'
      else action = 'full_optimization'
      batchSize = body.limit || 10
    } else {
      return errorResponse('Missing required parameters', corsHeaders, 400)
    }

    if (productIds.length === 0) {
      return errorResponse('productIds are required', corsHeaders, 400)
    }

    const results: { productId: string; success: boolean; error?: string }[] = []

    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize)

      for (const pid of batch) {
        try {
          // RLS-scoped: only returns products owned by user
          const { data: product } = await supabase
            .from('products')
            .select('*')
            .eq('id', pid)
            .single()

          let imported = null
          if (!product) {
            const { data } = await supabase
              .from('imported_products')
              .select('*')
              .eq('id', pid)
              .single()
            imported = data
          }

          const current = product || imported
          if (!current) continue

          let updates: Record<string, unknown> = {}

          switch (action) {
            case 'rewrite_titles':
              updates.name = optimizeTitle(current)
              break
            case 'rewrite_descriptions':
              updates.description = optimizeDesc(current)
              break
            case 'complete_attributes':
              updates = { category: current.category || 'General', tags: current.tags || ['nouveau'] }
              break
            case 'generate_seo':
              updates.seo_title = (current.name || 'Produit').substring(0, 60)
              updates.seo_description = `Achetez ${current.name || 'ce produit'} au meilleur prix.`.substring(0, 160)
              break
            case 'fix_spelling':
              updates.name = (current.name || '').replace(/\s+/g, ' ').trim()
              updates.description = (current.description || '').replace(/\s+/g, ' ').trim()
              break
            case 'optimize_images':
              updates.image_alt = `${current.name || 'Produit'} - ${current.category || ''}`
              break
            case 'optimize_pricing': {
              const cost = current.cost_price || (current.price || 0) * 0.6
              updates.price = Math.round(cost * 1.4 * 100) / 100
              break
            }
            case 'full_optimization':
              updates = {
                name: optimizeTitle(current),
                description: optimizeDesc(current),
                seo_title: (current.name || 'Produit').substring(0, 60),
                seo_description: `Achetez ${current.name || 'ce produit'} au meilleur prix.`.substring(0, 160),
              }
              break
          }

          if (Object.keys(updates).length > 0) {
            const table = product ? 'products' : 'imported_products'
            await supabase
              .from(table)
              .update({ ...updates, updated_at: new Date().toISOString() })
              .eq('id', pid)
            results.push({ productId: pid, success: true })
          }
        } catch (e) {
          results.push({ productId: pid, success: false, error: (e as Error).message })
        }
      }
    }

    return successResponse({
      processed: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    }, corsHeaders)
  } catch (error: any) {
    if (error instanceof Response) return error
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return errorResponse(error.message, getSecureCorsHeaders(origin), 400)
  }
})

function optimizeTitle(p: Record<string, unknown>): string {
  const t = (p.name as string) || 'Produit'
  return t.length < 30 ? `${t} - Haute Qualite` : t
}

function optimizeDesc(p: Record<string, unknown>): string {
  const n = (p.name as string) || 'ce produit'
  return `Decouvrez ${n}, un produit de qualite superieure. Design elegant, livraison rapide, garantie satisfaction.`
}
