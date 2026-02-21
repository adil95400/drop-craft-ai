import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Channel-specific validation rules
const CHANNEL_RULES: Record<string, Array<{
  code: string
  field: string
  severity: 'error' | 'warning' | 'info'
  check: (product: any) => boolean
  message: string
  suggestion?: string
  autoFixable?: boolean
}>> = {
  google_shopping: [
    { code: 'MISSING_GTIN', field: 'sku', severity: 'error', check: (p) => !p.sku || p.sku.length < 8, message: 'GTIN/EAN manquant ou invalide', suggestion: 'Ajouter un code GTIN-13 ou EAN valide', autoFixable: false },
    { code: 'TITLE_TOO_SHORT', field: 'title', severity: 'warning', check: (p) => !p.title || p.title.length < 25, message: 'Titre trop court (< 25 car.)', suggestion: 'Enrichir le titre avec marque + attributs clés', autoFixable: true },
    { code: 'TITLE_TOO_LONG', field: 'title', severity: 'warning', check: (p) => p.title && p.title.length > 150, message: 'Titre trop long (> 150 car.)', suggestion: 'Réduire à 150 caractères max', autoFixable: true },
    { code: 'MISSING_DESCRIPTION', field: 'description', severity: 'error', check: (p) => !p.description || p.description.length < 10, message: 'Description manquante ou trop courte', suggestion: 'Ajouter une description de 150-5000 caractères', autoFixable: true },
    { code: 'MISSING_IMAGE', field: 'main_image_url', severity: 'error', check: (p) => !p.main_image_url && (!p.images || p.images.length === 0), message: 'Image principale manquante', suggestion: 'Ajouter au moins une image produit HD', autoFixable: false },
    { code: 'MISSING_PRICE', field: 'price', severity: 'error', check: (p) => !p.price || p.price <= 0, message: 'Prix manquant ou invalide', suggestion: 'Définir un prix de vente > 0', autoFixable: false },
    { code: 'MISSING_CATEGORY', field: 'category', severity: 'warning', check: (p) => !p.category, message: 'Catégorie produit manquante', suggestion: 'Assigner une catégorie Google Product Category', autoFixable: false },
    { code: 'MISSING_BRAND', field: 'brand', severity: 'warning', check: (p) => !p.brand, message: 'Marque manquante', suggestion: 'Renseigner la marque du produit', autoFixable: false },
    { code: 'LOW_STOCK', field: 'stock_quantity', severity: 'info', check: (p) => p.stock_quantity !== null && p.stock_quantity <= 0, message: 'Produit en rupture de stock', suggestion: 'Mettre à jour le stock ou désactiver le produit', autoFixable: false },
    { code: 'DESCRIPTION_TOO_SHORT', field: 'description', severity: 'warning', check: (p) => p.description && p.description.length >= 10 && p.description.length < 150, message: 'Description trop courte (< 150 car.)', suggestion: 'Enrichir la description pour un meilleur référencement', autoFixable: true },
  ],
  shopify: [
    { code: 'MISSING_TITLE', field: 'title', severity: 'error', check: (p) => !p.title, message: 'Titre produit manquant', suggestion: 'Ajouter un titre descriptif', autoFixable: false },
    { code: 'MISSING_IMAGE', field: 'main_image_url', severity: 'warning', check: (p) => !p.main_image_url && (!p.images || p.images.length === 0), message: 'Aucune image produit', suggestion: 'Ajouter des images pour améliorer la conversion', autoFixable: false },
    { code: 'MISSING_PRICE', field: 'price', severity: 'error', check: (p) => !p.price || p.price <= 0, message: 'Prix non défini', suggestion: 'Configurer un prix de vente', autoFixable: false },
    { code: 'NO_SEO_TITLE', field: 'seo_title', severity: 'warning', check: (p) => !p.seo_title, message: 'Titre SEO manquant', suggestion: 'Optimiser avec un titre SEO < 60 caractères', autoFixable: true },
    { code: 'NO_SEO_DESC', field: 'seo_description', severity: 'warning', check: (p) => !p.seo_description, message: 'Méta-description SEO manquante', suggestion: 'Ajouter une méta-description < 160 caractères', autoFixable: true },
    { code: 'MISSING_SKU', field: 'sku', severity: 'info', check: (p) => !p.sku, message: 'SKU manquant', suggestion: 'Ajouter un SKU pour le suivi inventaire', autoFixable: false },
    { code: 'LOW_MARGIN', field: 'profit_margin', severity: 'warning', check: (p) => p.profit_margin !== null && p.profit_margin < 15, message: 'Marge faible (< 15%)', suggestion: 'Revoir le pricing ou les coûts fournisseur', autoFixable: false },
  ],
  facebook: [
    { code: 'MISSING_TITLE', field: 'title', severity: 'error', check: (p) => !p.title, message: 'Titre manquant', suggestion: 'Ajouter un titre', autoFixable: false },
    { code: 'MISSING_IMAGE', field: 'main_image_url', severity: 'error', check: (p) => !p.main_image_url, message: 'Image manquante', suggestion: 'Image requise pour Facebook Catalog', autoFixable: false },
    { code: 'MISSING_PRICE', field: 'price', severity: 'error', check: (p) => !p.price, message: 'Prix manquant', suggestion: 'Définir un prix', autoFixable: false },
    { code: 'MISSING_DESCRIPTION', field: 'description', severity: 'error', check: (p) => !p.description, message: 'Description manquante', suggestion: 'Ajouter une description', autoFixable: true },
    { code: 'TITLE_TOO_LONG', field: 'title', severity: 'warning', check: (p) => p.title && p.title.length > 200, message: 'Titre trop long pour Facebook', suggestion: 'Réduire à 200 caractères', autoFixable: true },
  ],
  amazon: [
    { code: 'MISSING_GTIN', field: 'sku', severity: 'error', check: (p) => !p.sku || p.sku.length < 10, message: 'UPC/EAN requis par Amazon', suggestion: 'Fournir un code UPC ou EAN valide', autoFixable: false },
    { code: 'MISSING_BULLET_POINTS', field: 'bullet_points', severity: 'warning', check: (p) => !p.bullet_points || (Array.isArray(p.bullet_points) && p.bullet_points.length < 3), message: 'Moins de 3 bullet points', suggestion: 'Ajouter au moins 5 bullet points pour Amazon', autoFixable: true },
    { code: 'MISSING_TITLE', field: 'title', severity: 'error', check: (p) => !p.title, message: 'Titre manquant', suggestion: 'Ajouter un titre avec marque + attributs', autoFixable: false },
    { code: 'MISSING_IMAGE', field: 'main_image_url', severity: 'error', check: (p) => !p.main_image_url, message: 'Image principale manquante', suggestion: 'Image fond blanc requise par Amazon', autoFixable: false },
    { code: 'MISSING_PRICE', field: 'price', severity: 'error', check: (p) => !p.price, message: 'Prix manquant', suggestion: 'Définir un prix', autoFixable: false },
  ],
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Non autorisé')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    ).auth.getUser()

    if (authError || !user) throw new Error('Non autorisé')

    const { action, channel, reportId } = await req.json()

    if (action === 'run_diagnostic') {
      const channels = channel ? [channel] : ['google_shopping', 'shopify', 'facebook', 'amazon']

      // Fetch user products
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id, title, description, price, cost_price, sku, category, brand, main_image_url, images, stock_quantity, status, seo_title, seo_description, bullet_points, profit_margin')
        .eq('user_id', user.id)
        .in('status', ['active', 'draft'])
        .limit(1000)

      if (prodError) throw prodError

      const reports = []

      for (const ch of channels) {
        const rules = CHANNEL_RULES[ch] || CHANNEL_RULES.google_shopping
        let validCount = 0
        let warningCount = 0
        let errorCount = 0
        const items: any[] = []

        for (const product of (products || [])) {
          let productHasError = false
          let productHasWarning = false

          for (const rule of rules) {
            if (rule.check(product)) {
              items.push({
                product_id: product.id,
                product_title: product.title || 'Sans titre',
                severity: rule.severity,
                rule_code: rule.code,
                field_name: rule.field,
                message: rule.message,
                suggestion: rule.suggestion || null,
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

        // Create report
        const { data: report, error: repError } = await supabase
          .from('feed_diagnostic_reports')
          .insert({
            user_id: user.id,
            channel: ch,
            total_products: total,
            valid_products: validCount,
            warning_products: warningCount,
            error_products: errorCount,
            score,
            summary: {
              top_issues: items.reduce((acc: Record<string, number>, item: any) => {
                acc[item.rule_code] = (acc[item.rule_code] || 0) + 1
                return acc
              }, {}),
              by_severity: { error: errorCount, warning: warningCount, valid: validCount },
            },
          })
          .select()
          .single()

        if (repError) throw repError

        // Insert items
        if (items.length > 0) {
          const itemsWithReport = items.map(i => ({ ...i, report_id: report.id }))
          // Batch insert in chunks
          for (let i = 0; i < itemsWithReport.length; i += 100) {
            await supabase.from('feed_diagnostic_items').insert(itemsWithReport.slice(i, i + 100))
          }
        }

        reports.push({ ...report, items_count: items.length })
      }

      return new Response(JSON.stringify({ success: true, reports }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'get_report') {
      if (!reportId) throw new Error('reportId requis')

      const { data: report } = await supabase
        .from('feed_diagnostic_reports')
        .select('*')
        .eq('id', reportId)
        .eq('user_id', user.id)
        .single()

      const { data: items } = await supabase
        .from('feed_diagnostic_items')
        .select('*')
        .eq('report_id', reportId)
        .order('severity', { ascending: true })
        .limit(500)

      return new Response(JSON.stringify({ success: true, report, items }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'list_reports') {
      const { data: reports } = await supabase
        .from('feed_diagnostic_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      return new Response(JSON.stringify({ success: true, reports }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error('Action inconnue')
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
