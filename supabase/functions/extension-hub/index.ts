/**
 * Extension Hub — Consolidated router for extension edge functions
 * 
 * Replaces: extension-install, extension-version-check, extension-health-monitor,
 *           extension-auto-order, extension-price-monitor, extension-product-research,
 *           extension-login, extension-marketplace, extension-marketplace-sync
 */
import { createClient } from 'npm:@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token, x-extension-version',
}

const CURRENT_VERSION = '5.7.0'
const MIN_SUPPORTED_VERSION = '5.0.0'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const body = await req.json()
    const { handler, action, ...params } = body

    // Route to the correct handler
    switch (handler) {
      case 'install':
        return await handleInstall(req, supabase, params)
      case 'version-check':
        return await handleVersionCheck(req, supabase)
      case 'health-monitor':
        return await handleHealthMonitor(req, supabase, action, params)
      case 'auto-order':
        return await handleAutoOrder(req, supabase, action, params)
      case 'price-monitor':
        return await handlePriceMonitor(req, supabase, action, params)
      case 'product-research':
        return await handleProductResearch(req, supabase, action, params)
      case 'login':
        return await handleLogin(req, supabase, action, params)
      case 'marketplace':
        return await handleMarketplace(req, supabase, action, params)
      case 'marketplace-sync':
        return await handleMarketplaceSync(req, supabase, action, params)
      default:
        return jsonResponse({ error: `Unknown handler: ${handler}` }, 400)
    }
  } catch (error) {
    console.error('[extension-hub] Error:', error)
    return jsonResponse({ error: error.message }, 500)
  }
})

// ============================================================================
// HELPERS
// ============================================================================

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function authenticateJWT(req: Request, supabase: any) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) throw new Error('Missing authorization header')
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) throw new Error('Unauthorized')
  return user
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1
    if (parts1[i] < parts2[i]) return -1
  }
  return 0
}

// ============================================================================
// HANDLER: install
// ============================================================================

async function handleInstall(req: Request, supabase: any, params: any) {
  const user = await authenticateJWT(req, supabase)
  const { extension_id, config } = params

  console.log('Installing extension:', { extension_id, user_id: user.id })

  const { data: existing } = await supabase
    .from('installed_extensions')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('extension_id', extension_id)
    .maybeSingle()

  let installation

  if (existing) {
    if (existing.status === 'inactive') {
      const { data: updated, error } = await supabase
        .from('installed_extensions')
        .update({ status: 'active', config: config || {} })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error
      installation = updated
    } else {
      installation = existing
    }
  } else {
    const { data: newInstall, error } = await supabase
      .from('installed_extensions')
      .insert({
        user_id: user.id,
        extension_id,
        config: config || {},
        status: 'active',
        installed_at: new Date().toISOString()
      })
      .select()
      .single()
    if (error) throw error
    installation = newInstall
  }

  await supabase.from('activity_logs').insert({
    user_id: user.id,
    action: 'extension_installed',
    description: `Extension ${extension_id} installée`,
    entity_type: 'extension',
    entity_id: installation.id,
    metadata: { extension_id }
  })

  return jsonResponse({ success: true, installation })
}

// ============================================================================
// HANDLER: version-check
// ============================================================================

async function handleVersionCheck(req: Request, supabase: any) {
  const currentVersion = req.headers.get('x-extension-version') || '0.0.0'
  const updateAvailable = compareVersions(CURRENT_VERSION, currentVersion) > 0
  const updateRequired = compareVersions(MIN_SUPPORTED_VERSION, currentVersion) > 0

  const { data: changelog } = await supabase
    .from('extension_versions')
    .select('version, release_notes, released_at')
    .gt('version', currentVersion)
    .order('released_at', { ascending: false })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!

  const versionInfo = {
    current: currentVersion,
    latest: CURRENT_VERSION,
    updateAvailable,
    updateRequired,
    changelog: changelog?.map((v: any) => `v${v.version}: ${v.release_notes}`) || [
      'v1.2.0: Amélioration de la synchronisation temps réel',
      'v1.1.0: Ajout du système d\'authentification sécurisé',
      'v1.0.0: Version initiale avec scraping automatique'
    ],
    downloadUrl: `${supabaseUrl}/functions/v1/extension-download`
  }

  await supabase.from('extension_analytics').insert({
    event_type: 'version_check',
    event_data: {
      current_version: currentVersion,
      latest_version: CURRENT_VERSION,
      update_available: updateAvailable,
      update_required: updateRequired
    }
  })

  if (updateRequired) {
    console.log(`⚠️ Critical update required for version ${currentVersion}`)
  }

  return jsonResponse(versionInfo)
}

// ============================================================================
// HANDLER: health-monitor
// ============================================================================

async function handleHealthMonitor(req: Request, supabase: any, action: string, params: any) {
  const token = req.headers.get('x-extension-token')
  let userId: string | null = null

  if (token) {
    const { data: authData } = await supabase
      .from('extension_auth_tokens')
      .select('user_id')
      .eq('token', token)
      .eq('is_active', true)
      .single()
    userId = authData?.user_id
  }

  if (action === 'report_error') {
    const { error_type, error_message, stack_trace, context } = params.data || params
    await supabase.from('extension_errors').insert({
      user_id: userId,
      error_type, error_message, stack_trace, context,
      extension_version: context?.version,
      browser_info: context?.browser
    })
    if (error_type === 'critical') console.error('🚨 Critical extension error:', error_message)
    return jsonResponse({ success: true, message: 'Error reported' })
  }

  if (action === 'heartbeat') {
    const { version, browser, active_tabs } = params.data || params
    await supabase.from('extension_heartbeats').insert({
      user_id: userId,
      extension_version: version,
      browser_info: browser,
      active_tabs,
      timestamp: new Date().toISOString()
    })
    return jsonResponse({ success: true, status: 'alive' })
  }

  if (action === 'metrics') {
    const { data: errors } = await supabase
      .from('extension_errors')
      .select('id, error_type, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    const { data: heartbeats } = await supabase
      .from('extension_heartbeats')
      .select('user_id')
      .gte('timestamp', new Date(Date.now() - 5 * 60 * 1000).toISOString())

    const activeUsers = new Set(heartbeats?.map((h: any) => h.user_id)).size

    const { data: analytics } = await supabase
      .from('extension_analytics')
      .select('event_type, event_data')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    const imports = (analytics || []).filter((a: any) => a.event_type === 'bulk_import')
    const totalSuccessful = imports.reduce((sum: number, i: any) => sum + (i.event_data?.successful || 0), 0)
    const totalFailed = imports.reduce((sum: number, i: any) => sum + (i.event_data?.failed || 0), 0)
    const total = totalSuccessful + totalFailed
    const successRate = total > 0 ? Math.round((totalSuccessful / total) * 100) : 100

    return jsonResponse({
      health_status: errors && errors.length > 100 ? 'degraded' : 'healthy',
      error_count_24h: errors?.length || 0,
      critical_errors: errors?.filter((e: any) => e.error_type === 'critical').length || 0,
      active_users_5m: activeUsers,
      total_events_24h: analytics?.length || 0,
      import_success_rate: successRate,
      last_updated: new Date().toISOString()
    })
  }

  if (action === 'run_tests') {
    const tests = [
      { name: 'Token Validation', test: async () => { const { data } = await supabase.from('extension_auth_tokens').select('id').eq('is_active', true).limit(1); return data && data.length > 0 }},
      { name: 'Product Import', test: async () => { const { error } = await supabase.from('supplier_products').select('id').limit(1); return !error }},
      { name: 'Analytics Logging', test: async () => { const { error } = await supabase.from('extension_analytics').select('id').gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()).limit(1); return !error }},
    ]
    const results = []
    for (const t of tests) {
      try { results.push({ name: t.name, passed: await t.test(), error: null }) }
      catch (error) { results.push({ name: t.name, passed: false, error: error.message }) }
    }
    return jsonResponse({ success: true, all_passed: results.every(r => r.passed), results })
  }

  return jsonResponse({ error: 'Invalid action' }, 400)
}

// ============================================================================
// HANDLER: auto-order
// ============================================================================

async function handleAutoOrder(req: Request, supabase: any, action: string, params: any) {
  const user = await authenticateJWT(req, supabase)

  if (action === 'process_order') {
    const { orderId } = params
    const { data: order, error: orderError } = await supabase
      .from('orders').select('*').eq('id', orderId).eq('user_id', user.id).single()
    if (orderError || !order) throw new Error('Order not found')

    const results = []
    for (const item of (order.items || [])) {
      const { data: product } = await supabase
        .from('products').select('*, supplier:suppliers(*)').eq('id', item.product_id).single()

      if (!product || !product.supplier) {
        results.push({ product_id: item.product_id, success: false, error: 'Supplier not found' })
        continue
      }

      await supabase.from('activity_logs').insert({
        user_id: user.id, action: 'auto_order_placed', entity_type: 'order', entity_id: orderId,
        description: `Auto order placed for ${product.name} from ${product.supplier.name}`,
        metadata: { supplier_id: product.supplier.id, product_sku: product.sku, quantity: item.quantity }
      })

      results.push({ product_id: item.product_id, success: true, supplier: product.supplier.name, tracking_number: `AUTO-${Date.now()}` })
    }

    await supabase.from('orders').update({ status: 'processing', updated_at: new Date().toISOString() }).eq('id', orderId)
    return jsonResponse({ success: true, message: 'Auto-order processed successfully', results })
  }

  if (action === 'configure') {
    const { config } = params
    const { data: extension } = await supabase.from('extensions').select('*').eq('user_id', user.id).eq('name', 'auto-order-fulfillment').single()
    if (extension) {
      await supabase.from('extensions').update({ configuration: config, updated_at: new Date().toISOString() }).eq('id', extension.id)
    }
    return jsonResponse({ success: true, message: 'Configuration saved' })
  }

  throw new Error('Invalid action')
}

// ============================================================================
// HANDLER: price-monitor
// ============================================================================

async function handlePriceMonitor(req: Request, supabase: any, action: string, params: any) {
  const user = await authenticateJWT(req, supabase)

  if (action === 'monitor_prices') {
    const { productId, config } = params
    const { data: product, error: productError } = await supabase
      .from('products').select('*').eq('id', productId).eq('user_id', user.id).single()
    if (productError || !product) throw new Error('Product not found')

    const { data: competitorPrices } = await supabase
      .from('competitor_prices').select('*').eq('product_id', productId)
      .order('last_checked_at', { ascending: false }).limit(10)

    if (!competitorPrices?.length) {
      return jsonResponse({ success: false, message: 'No competitor prices found' })
    }

    const avgCompetitorPrice = competitorPrices.reduce((sum: number, cp: any) => sum + Number(cp.competitor_price), 0) / competitorPrices.length
    const minCompetitorPrice = Math.min(...competitorPrices.map((cp: any) => Number(cp.competitor_price)))

    const strategy = config?.pricingStrategy || 'match_lowest'
    let newPrice = product.price

    switch (strategy) {
      case 'match_lowest': newPrice = minCompetitorPrice - (config?.priceOffset || 0.01); break
      case 'match_average': newPrice = avgCompetitorPrice - (config?.priceOffset || 0); break
      case 'undercut_percentage': newPrice = minCompetitorPrice * (1 - (config?.undercutPercentage || 5) / 100); break
      case 'fixed_margin':
        const costPrice = product.cost_price || 0
        const minPrice = costPrice * (1 + (config?.minMargin || 20) / 100)
        newPrice = Math.max(minCompetitorPrice * 0.98, minPrice)
        break
    }

    const minP = config?.minPrice || product.cost_price * 1.1 || 1
    const maxP = config?.maxPrice || product.price * 2
    newPrice = Math.max(minP, Math.min(maxP, newPrice))

    const priceChange = Math.abs(newPrice - product.price)
    const significantChange = config?.minChangeAmount || 0.5

    if (priceChange >= significantChange) {
      await supabase.from('products').update({ price: newPrice, updated_at: new Date().toISOString() }).eq('id', productId)
      await supabase.from('activity_logs').insert({
        user_id: user.id, action: 'auto_price_update', entity_type: 'product', entity_id: productId,
        description: `Price updated from ${product.price} to ${newPrice} (${strategy})`,
        metadata: { old_price: product.price, new_price: newPrice, strategy, avg_competitor_price: avgCompetitorPrice, min_competitor_price: minCompetitorPrice }
      })
      return jsonResponse({ success: true, message: 'Price updated successfully', old_price: product.price, new_price: newPrice, strategy, competitors_analyzed: competitorPrices.length })
    }

    return jsonResponse({ success: true, message: 'Price unchanged (change not significant)', current_price: product.price, suggested_price: newPrice, change: priceChange })
  }

  if (action === 'configure') {
    const { config } = params
    const { data: extension } = await supabase.from('extensions').select('*').eq('user_id', user.id).eq('name', 'smart-price-monitor').single()
    if (extension) {
      await supabase.from('extensions').update({ configuration: config, updated_at: new Date().toISOString() }).eq('id', extension.id)
    }
    return jsonResponse({ success: true, message: 'Configuration saved' })
  }

  throw new Error('Invalid action')
}

// ============================================================================
// HANDLER: product-research
// ============================================================================

async function handleProductResearch(req: Request, supabase: any, action: string, params: any) {
  const user = await authenticateJWT(req, supabase)

  if (action === 'find_winners') {
    const { criteria } = params
    const { category, minProfitMargin = 20, maxCompetition = 5, minRating = 4.0, minOrders = 100 } = criteria || {}

    let query = supabase.from('catalog_products').select('*').gte('rating', minRating).gte('sales_count', minOrders)
    if (category) query = query.eq('category', category)

    const { data: products, error } = await query.limit(100)
    if (error) throw new Error('Error fetching products: ' + error.message)

    const analyzedProducts = (products || []).map((product: any) => {
      const profitMargin = product.cost_price ? ((product.price - product.cost_price) / product.price) * 100 : 30
      const competitionScore = product.competition_score || 5
      const trendScore = product.trend_score || 50
      const winnerScore = (profitMargin / 100 * 30) + ((10 - competitionScore) / 10 * 25) + (product.rating / 5 * 20) + (trendScore / 100 * 15) + (Math.min(product.sales_count / 1000, 1) * 10)
      return {
        ...product,
        analysis: {
          profit_margin: profitMargin, competition_level: competitionScore, trend_score: trendScore,
          winner_score: Math.round(winnerScore), estimated_monthly_revenue: product.price * product.sales_count,
          recommendation: winnerScore > 70 ? 'Excellent' : winnerScore > 50 ? 'Good' : 'Average'
        }
      }
    })

    const winners = analyzedProducts
      .filter((p: any) => p.analysis.profit_margin >= minProfitMargin && p.analysis.competition_level <= maxCompetition)
      .sort((a: any, b: any) => b.analysis.winner_score - a.analysis.winner_score)
      .slice(0, 50)

    await supabase.from('activity_logs').insert({
      user_id: user.id, action: 'product_research', entity_type: 'catalog',
      description: `Found ${winners.length} winning products`,
      metadata: { criteria, total_analyzed: products?.length || 0, winners_found: winners.length }
    })

    return jsonResponse({ success: true, total_analyzed: products?.length || 0, winners_found: winners.length, products: winners, message: `Found ${winners.length} winning products matching your criteria` })
  }

  if (action === 'analyze_product') {
    const { criteria } = params
    const { data: product } = await supabase.from('catalog_products').select('*').eq('id', criteria.productId).single()
    if (!product) throw new Error('Product not found')

    const analysis = {
      profit_potential: product.cost_price ? ((product.price - product.cost_price) / product.price) * 100 : 30,
      market_demand: product.sales_count > 500 ? 'High' : product.sales_count > 100 ? 'Medium' : 'Low',
      competition_level: product.competition_score > 7 ? 'High' : product.competition_score > 4 ? 'Medium' : 'Low',
      trend_analysis: product.trend_score > 70 ? 'Rising' : product.trend_score > 40 ? 'Stable' : 'Declining',
      rating_quality: product.rating >= 4.5 ? 'Excellent' : product.rating >= 4.0 ? 'Good' : 'Average',
      estimated_monthly_sales: Math.round(product.sales_count / 6),
      estimated_monthly_revenue: Math.round(product.price * product.sales_count / 6),
      risks: [] as string[],
      opportunities: [] as string[]
    }
    if (product.competition_score > 7) analysis.risks.push('High competition in this niche')
    if (product.rating < 4.0) analysis.risks.push('Lower customer satisfaction')
    if (product.trend_score < 40) analysis.risks.push('Declining trend')
    if (analysis.profit_potential > 40) analysis.opportunities.push('High profit margin')
    if (product.trend_score > 70) analysis.opportunities.push('Rising trend - early opportunity')
    if (product.competition_score < 4) analysis.opportunities.push('Low competition niche')

    return jsonResponse({ success: true, product, analysis })
  }

  throw new Error('Invalid action')
}

// ============================================================================
// HANDLER: login (replaces extension-login)
// ============================================================================

async function handleLogin(req: Request, supabase: any, action: string, params: any) {
  if (action === 'generate_token') {
    const user = await authenticateJWT(req, supabase)
    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()

    const token = crypto.randomUUID() + '-' + Date.now()
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

    const { error: tokenError } = await supabase
      .from('extension_auth_tokens')
      .insert({ user_id: user.id, token, expires_at: expiresAt, is_active: true, device_info: { source: 'web_auth_page' } })
    if (tokenError) throw new Error('Failed to create extension token')

    await supabase.from('security_events').insert({
      user_id: user.id, event_type: 'extension_token_generated', severity: 'info',
      description: 'Extension token generated via web auth page', metadata: {}
    })

    return jsonResponse({
      success: true, token, expiresAt,
      user: { id: user.id, plan: profile?.subscription_plan || 'free', firstName: profile?.first_name, lastName: profile?.last_name, avatarUrl: profile?.avatar_url }
    })
  }

  if (action === 'login_credentials') {
    const { email, password } = params
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError || !authData.user) return jsonResponse({ success: false, error: 'Identifiants invalides' }, 401)

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single()
    const token = crypto.randomUUID() + '-' + Date.now()
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

    const { error: tokenError } = await supabase
      .from('extension_auth_tokens')
      .insert({ user_id: authData.user.id, token, expires_at: expiresAt, is_active: true, device_info: { source: 'extension_login' } })
    if (tokenError) throw new Error('Failed to create extension token')

    await supabase.from('security_events').insert({
      user_id: authData.user.id, event_type: 'extension_login', severity: 'info',
      description: 'User logged in via Chrome extension', metadata: {}
    })

    return jsonResponse({
      success: true, token, expiresAt,
      user: { id: authData.user.id, email: authData.user.email, plan: profile?.subscription_plan || 'free', firstName: profile?.first_name, lastName: profile?.last_name, avatarUrl: profile?.avatar_url }
    })
  }

  throw new Error('Invalid login action')
}

// ============================================================================
// HANDLER: marketplace (replaces extension-marketplace)
// ============================================================================

async function handleMarketplace(req: Request, supabase: any, action: string, params: any) {
  const user = await authenticateJWT(req, supabase)

  if (action === 'publish') {
    const { data: formData } = params
    const d = formData || params
    const errors: string[] = []
    if (!d.name || d.name.length < 3) errors.push('Name must be at least 3 characters')
    if (!d.description || d.description.length < 20) errors.push('Description must be at least 20 characters')
    if (!d.version || !/^\d+\.\d+\.\d+$/.test(d.version)) errors.push('Invalid version format')
    if (!d.category) errors.push('Category is required')
    if (errors.length > 0) return jsonResponse({ error: 'Validation failed', details: errors }, 400)

    const { data: listing, error } = await supabase
      .from('marketplace_extensions')
      .insert({ developer_id: user.id, name: d.name, description: d.description, version: d.version, category: d.category, source_url: d.source_url, icon_url: d.icon_url, screenshots: d.screenshots, status: 'pending_review' })
      .select().single()
    if (error) throw error

    await supabase.from('extension_reviews').insert({ extension_id: listing.id, status: 'pending', requested_by: user.id })
    return jsonResponse({ success: true, listing, message: 'Extension soumise pour review.' })
  }

  if (action === 'list') {
    const { category, search, status = 'approved' } = params.data || params
    let query = supabase.from('marketplace_extensions').select('*').eq('status', status)
    if (category) query = query.eq('category', category)
    if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    const { data: extensions, error } = await query.order('install_count', { ascending: false }).limit(50)
    if (error) throw error
    return jsonResponse({ success: true, extensions })
  }

  if (action === 'review') {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return jsonResponse({ error: 'Admin access required' }, 403)
    const { extensionId, approved, feedback } = params.data || params
    await supabase.from('marketplace_extensions').update({ status: approved ? 'approved' : 'rejected', published_at: approved ? new Date().toISOString() : null, review_feedback: feedback }).eq('id', extensionId)
    return jsonResponse({ success: true, message: `Extension ${approved ? 'approved' : 'rejected'}` })
  }

  throw new Error('Invalid marketplace action')
}

// ============================================================================
// HANDLER: marketplace-sync (replaces extension-marketplace-sync)
// ============================================================================

async function handleMarketplaceSync(req: Request, supabase: any, action: string, params: any) {
  const user = await authenticateJWT(req, supabase)

  if (action === 'sync_products') {
    const { productIds, platforms } = params
    const results = []

    for (const productId of (productIds || [])) {
      const { data: product, error: productError } = await supabase
        .from('products').select('*').eq('id', productId).eq('user_id', user.id).single()
      if (productError || !product) { results.push({ product_id: productId, success: false, error: 'Product not found' }); continue }

      const platformResults: Record<string, any> = {}
      for (const platform of (platforms || [])) {
        const { data: connection } = await supabase
          .from('marketplace_connections').select('*').eq('user_id', user.id).eq('platform', platform).eq('status', 'connected').single()
        if (!connection) { platformResults[platform] = { success: false, error: 'Platform not connected' }; continue }

        const { error: syncError } = await supabase
          .from('marketplace_product_mappings')
          .upsert({ user_id: user.id, product_id: productId, platform, external_id: `${platform}-${Date.now()}`, sync_status: 'synced', last_synced_at: new Date().toISOString() }, { onConflict: 'user_id,product_id,platform' })

        platformResults[platform] = { success: !syncError, external_id: `${platform}-${Date.now()}`, error: syncError?.message }
        if (!syncError && connection) {
          const currentStats = connection.sync_stats || {}
          await supabase.from('marketplace_connections').update({ last_sync_at: new Date().toISOString(), sync_stats: { ...currentStats, products_synced: (currentStats.products_synced || 0) + 1 } }).eq('id', connection.id)
        }
      }
      results.push({ product_id: productId, product_name: product.title, platforms: platformResults })
    }

    await supabase.from('activity_logs').insert({ user_id: user.id, action: 'marketplace_sync', entity_type: 'products', description: `Synced ${productIds?.length || 0} products to ${platforms?.length || 0} platforms`, metadata: { products: productIds?.length, platforms, results } })
    return jsonResponse({ success: true, message: `Synchronized ${productIds?.length || 0} products`, results })
  }

  if (action === 'configure') {
    const { config } = params
    const { data: extension } = await supabase.from('extensions').select('*').eq('user_id', user.id).eq('name', 'marketplace-sync-pro').single()
    if (extension) await supabase.from('extensions').update({ configuration: config, updated_at: new Date().toISOString() }).eq('id', extension.id)
    return jsonResponse({ success: true, message: 'Configuration saved' })
  }

  throw new Error('Invalid marketplace-sync action')
}
