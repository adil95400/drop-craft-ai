import { handlePreflight, requireAuth, errorResponse, successResponse } from '../_shared/jwt-auth.ts'

// Channel-specific validation rules
const CHANNEL_RULES: Record<string, Array<{
  code: string; field: string; severity: 'error' | 'warning' | 'info'
  check: (product: any) => boolean; message: string; suggestion?: string; autoFixable?: boolean
}>> = {
  google_shopping: [
    { code: 'MISSING_GTIN', field: 'sku', severity: 'error', check: (p) => !p.sku || p.sku.length < 8, message: 'GTIN/EAN manquant ou invalide', suggestion: 'Ajouter un code GTIN-13 ou EAN valide', autoFixable: false },
    { code: 'TITLE_TOO_SHORT', field: 'title', severity: 'warning', check: (p) => !p.title || p.title.length < 25, message: 'Titre trop court (< 25 car.)', suggestion: 'Enrichir le titre avec marque + attributs clés', autoFixable: true },
    { code: 'TITLE_TOO_LONG', field: 'title', severity: 'warning', check: (p) => p.title && p.title.length > 150, message: 'Titre trop long (> 150 car.)', suggestion: 'Réduire à 150 caractères max', autoFixable: true },
    { code: 'MISSING_DESCRIPTION', field: 'description', severity: 'error', check: (p) => !p.description || p.description.length < 10, message: 'Description manquante ou trop courte', suggestion: 'Ajouter une description de 150-5000 caractères', autoFixable: true },
    { code: 'MISSING_IMAGE', field: 'main_image_url', severity: 'error', check: (p) => !p.main_image_url && (!p.images || p.images.length === 0), message: 'Image principale manquante', suggestion: 'Ajouter au moins une image produit HD', autoFixable: false },
    { code: 'MISSING_PRICE', field: 'price', severity: 'error', check: (p) => !p.price || p.price <= 0, message: 'Prix manquant ou invalide', suggestion: 'Définir un prix de vente > 0', autoFixable: false },
    { code: 'MISSING_CATEGORY', field: 'category', severity: 'warning', check: (p) => !p.category, message: 'Catégorie produit manquante', autoFixable: false },
    { code: 'MISSING_BRAND', field: 'brand', severity: 'warning', check: (p) => !p.brand, message: 'Marque manquante', autoFixable: false },
    { code: 'LOW_STOCK', field: 'stock_quantity', severity: 'info', check: (p) => p.stock_quantity !== null && p.stock_quantity <= 0, message: 'Produit en rupture de stock', autoFixable: false },
    { code: 'DESCRIPTION_TOO_SHORT', field: 'description', severity: 'warning', check: (p) => p.description && p.description.length >= 10 && p.description.length < 150, message: 'Description trop courte (< 150 car.)', autoFixable: true },
  ],
  shopify: [
    { code: 'MISSING_TITLE', field: 'title', severity: 'error', check: (p) => !p.title, message: 'Titre produit manquant', autoFixable: false },
    { code: 'MISSING_IMAGE', field: 'main_image_url', severity: 'warning', check: (p) => !p.main_image_url && (!p.images || p.images.length === 0), message: 'Aucune image produit', autoFixable: false },
    { code: 'MISSING_PRICE', field: 'price', severity: 'error', check: (p) => !p.price || p.price <= 0, message: 'Prix non défini', autoFixable: false },
    { code: 'NO_SEO_TITLE', field: 'seo_title', severity: 'warning', check: (p) => !p.seo_title, message: 'Titre SEO manquant', autoFixable: true },
    { code: 'NO_SEO_DESC', field: 'seo_description', severity: 'warning', check: (p) => !p.seo_description, message: 'Méta-description SEO manquante', autoFixable: true },
    { code: 'MISSING_SKU', field: 'sku', severity: 'info', check: (p) => !p.sku, message: 'SKU manquant', autoFixable: false },
  ],
  facebook: [
    { code: 'MISSING_TITLE', field: 'title', severity: 'error', check: (p) => !p.title, message: 'Titre manquant', autoFixable: false },
    { code: 'MISSING_IMAGE', field: 'main_image_url', severity: 'error', check: (p) => !p.main_image_url, message: 'Image manquante', autoFixable: false },
    { code: 'MISSING_PRICE', field: 'price', severity: 'error', check: (p) => !p.price, message: 'Prix manquant', autoFixable: false },
    { code: 'MISSING_DESCRIPTION', field: 'description', severity: 'error', check: (p) => !p.description, message: 'Description manquante', autoFixable: true },
  ],
  amazon: [
    { code: 'MISSING_GTIN', field: 'sku', severity: 'error', check: (p) => !p.sku || p.sku.length < 10, message: 'UPC/EAN requis par Amazon', autoFixable: false },
    { code: 'MISSING_TITLE', field: 'title', severity: 'error', check: (p) => !p.title, message: 'Titre manquant', autoFixable: false },
    { code: 'MISSING_IMAGE', field: 'main_image_url', severity: 'error', check: (p) => !p.main_image_url, message: 'Image principale manquante', autoFixable: false },
    { code: 'MISSING_PRICE', field: 'price', severity: 'error', check: (p) => !p.price, message: 'Prix manquant', autoFixable: false },
  ],
}

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const { action, channel, reportId } = await req.json()

    if (action === 'run_diagnostic') {
      const channels = channel ? [channel] : ['google_shopping', 'shopify', 'facebook', 'amazon']

      // RLS-scoped query
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id, title, description, price, cost_price, sku, category, brand, main_image_url, images, stock_quantity, status, seo_title, seo_description, bullet_points, profit_margin')
        .in('status', ['active', 'draft'])
        .limit(1000)

      if (prodError) throw prodError

      const reports = []

      for (const ch of channels) {
        const rules = CHANNEL_RULES[ch] || CHANNEL_RULES.google_shopping
        let validCount = 0, warningCount = 0, errorCount = 0
        const items: any[] = []

        for (const product of (products || [])) {
          let productHasError = false, productHasWarning = false

          for (const rule of rules) {
            if (rule.check(product)) {
              items.push({
                product_id: product.id, product_title: product.title || 'Sans titre',
                severity: rule.severity, rule_code: rule.code, field_name: rule.field,
                message: rule.message, suggestion: rule.suggestion || null,
                current_value: String(product[rule.field as keyof typeof product] ?? ''),
                auto_fixable: rule.autoFixable || false,
              })
              if (rule.severity === 'error') productHasError = true
              if (rule.severity === 'warning') productHasWarning = true
            }
          }

          if (productHasError) errorCount++
          else if (productHasWarning) warningCount++
          else validCount++
        }

        const total = products?.length || 0
        const score = total > 0 ? Math.round((validCount / total) * 100 * 100) / 100 : 100

        const { data: report, error: repError } = await supabase
          .from('feed_diagnostic_reports')
          .insert({
            user_id: userId, channel: ch, total_products: total,
            valid_products: validCount, warning_products: warningCount, error_products: errorCount, score,
            summary: {
              top_issues: items.reduce((acc: Record<string, number>, item: any) => {
                acc[item.rule_code] = (acc[item.rule_code] || 0) + 1; return acc
              }, {}),
              by_severity: { error: errorCount, warning: warningCount, valid: validCount },
            },
          })
          .select()
          .single()

        if (repError) throw repError

        if (items.length > 0) {
          const itemsWithReport = items.map(i => ({ ...i, report_id: report.id }))
          for (let i = 0; i < itemsWithReport.length; i += 100) {
            await supabase.from('feed_diagnostic_items').insert(itemsWithReport.slice(i, i + 100))
          }
        }

        reports.push({ ...report, items_count: items.length })
      }

      return successResponse({ reports }, corsHeaders)
    }

    if (action === 'get_report') {
      if (!reportId) return errorResponse('reportId requis', corsHeaders, 400)

      const { data: report } = await supabase
        .from('feed_diagnostic_reports')
        .select('*')
        .eq('id', reportId)
        .single()

      const { data: items } = await supabase
        .from('feed_diagnostic_items')
        .select('*')
        .eq('report_id', reportId)
        .order('severity', { ascending: true })
        .limit(500)

      return successResponse({ report, items }, corsHeaders)
    }

    if (action === 'list_reports') {
      const { data: reports } = await supabase
        .from('feed_diagnostic_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      return successResponse({ reports }, corsHeaders)
    }

    return errorResponse('Action inconnue', corsHeaders, 400)
  } catch (error: any) {
    if (error instanceof Response) return error
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return errorResponse(error.message, getSecureCorsHeaders(origin), 400)
  }
})
