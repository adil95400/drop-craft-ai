import { handlePreflight, requireAuth, errorResponse, successResponse } from '../_shared/jwt-auth.ts'

interface ChannelMapping {
  id: string
  channel_id: string
  platform: string
  external_product_id: string
  external_variant_id: string | null
  current_synced_price: number | null
  last_synced_at: string | null
}

interface Integration {
  id: string
  platform: string
  store_url: string
  config: {
    credentials?: {
      access_token?: string
      api_key?: string
      api_secret?: string
    }
  }
}

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const { queue_id, product_id, new_price, channels } = await req.json()

    if (!product_id || !new_price) {
      return errorResponse('Missing required fields: product_id, new_price', corsHeaders, 400)
    }

    // Fetch channel mappings scoped to user via RLS
    let mappingsQuery = supabase
      .from('product_channel_mappings')
      .select('*')
      .eq('product_id', product_id)
      .eq('user_id', userId)
      .neq('sync_status', 'error')

    if (channels && channels.length > 0) {
      mappingsQuery = mappingsQuery.in('channel_id', channels)
    }

    const { data: mappings, error: mappingsError } = await mappingsQuery

    if (mappingsError) throw mappingsError

    if (!mappings || mappings.length === 0) {
      return successResponse({ message: 'No channels to sync', synced: 0 }, corsHeaders)
    }

    // Fetch unique integrations
    const channelIds = [...new Set(mappings.map((m: any) => m.channel_id))]
    const { data: integrations, error: intError } = await supabase
      .from('integrations')
      .select('*')
      .in('id', channelIds)
      .eq('enabled', true)

    if (intError) throw intError

    const integrationMap = new Map<string, Integration>()
    ;(integrations || []).forEach((i: any) => integrationMap.set(i.id, i))

    const results: Array<{
      mapping_id: string
      platform: string
      status: 'success' | 'error' | 'skipped'
      error?: string
    }> = []

    for (const mapping of mappings as any[]) {
      const integration = integrationMap.get(mapping.channel_id)

      if (!integration) {
        results.push({ mapping_id: mapping.id, platform: mapping.platform, status: 'skipped', error: 'Integration not found or disabled' })
        continue
      }

      const startTime = Date.now()
      let syncResult: { success: boolean; error?: string; response?: any } = { success: false }

      try {
        switch (mapping.platform.toLowerCase()) {
          case 'shopify':
            syncResult = await syncToShopify(integration, mapping, new_price)
            break
          case 'woocommerce':
            syncResult = await syncToWooCommerce(integration, mapping, new_price)
            break
          case 'prestashop':
            syncResult = await syncToPrestaShop(integration, mapping, new_price)
            break
          default:
            syncResult = { success: false, error: `Platform ${mapping.platform} not supported` }
        }
      } catch (err: any) {
        syncResult = { success: false, error: err.message }
      }

      const duration = Date.now() - startTime

      // Log result
      await supabase.from('price_sync_logs').insert({
        user_id: userId, queue_id, mapping_id: mapping.id, product_id,
        channel_id: mapping.channel_id, platform: mapping.platform,
        external_product_id: mapping.external_product_id,
        old_price: mapping.current_synced_price, new_price,
        status: syncResult.success ? 'success' : 'error',
        error_message: syncResult.error, api_response: syncResult.response, duration_ms: duration,
      })

      // Update mapping
      await supabase
        .from('product_channel_mappings')
        .update({
          current_synced_price: syncResult.success ? new_price : mapping.current_synced_price,
          last_synced_at: syncResult.success ? new Date().toISOString() : mapping.last_synced_at,
          sync_status: syncResult.success ? 'synced' : 'error',
          sync_error: syncResult.error || null,
        })
        .eq('id', mapping.id)

      results.push({
        mapping_id: mapping.id, platform: mapping.platform,
        status: syncResult.success ? 'success' : 'error', error: syncResult.error,
      })
    }

    const successCount = results.filter(r => r.status === 'success').length

    return successResponse({ synced: successCount, total: results.length, results }, corsHeaders)
  } catch (error: any) {
    if (error instanceof Response) return error
    console.error('Sync error:', error)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return errorResponse(error.message, getSecureCorsHeaders(origin), 500)
  }
})

// ── Platform sync helpers ──────────────────────────────────────────────

async function syncToShopify(integration: Integration, mapping: any, newPrice: number) {
  const accessToken = integration.config?.credentials?.access_token
  if (!accessToken) return { success: false, error: 'Missing Shopify access token' }

  const shopDomain = integration.store_url?.replace('https://', '').replace('http://', '').replace(/\/$/, '')
  if (!shopDomain) return { success: false, error: 'Missing shop domain' }

  const endpoint = mapping.external_variant_id
    ? `https://${shopDomain}/admin/api/2024-01/variants/${mapping.external_variant_id}.json`
    : `https://${shopDomain}/admin/api/2024-01/products/${mapping.external_product_id}.json`

  const body = mapping.external_variant_id
    ? { variant: { id: mapping.external_variant_id, price: newPrice.toString() } }
    : { product: { id: mapping.external_product_id, variants: [{ price: newPrice.toString() }] } }

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': accessToken },
    body: JSON.stringify(body),
  })

  const data = await response.json()
  if (!response.ok) return { success: false, error: data.errors || 'Shopify API error', response: data }
  return { success: true, response: data }
}

async function syncToWooCommerce(integration: Integration, mapping: any, newPrice: number) {
  const { api_key, api_secret } = integration.config?.credentials || {}
  if (!api_key || !api_secret) return { success: false, error: 'Missing WooCommerce credentials' }

  const storeUrl = integration.store_url?.replace(/\/$/, '')
  if (!storeUrl) return { success: false, error: 'Missing store URL' }

  const auth = btoa(`${api_key}:${api_secret}`)
  const endpoint = mapping.external_variant_id
    ? `${storeUrl}/wp-json/wc/v3/products/${mapping.external_product_id}/variations/${mapping.external_variant_id}`
    : `${storeUrl}/wp-json/wc/v3/products/${mapping.external_product_id}`

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
    body: JSON.stringify({ regular_price: newPrice.toString() }),
  })

  const data = await response.json()
  if (!response.ok) return { success: false, error: data.message || 'WooCommerce API error', response: data }
  return { success: true, response: data }
}

async function syncToPrestaShop(integration: Integration, mapping: any, newPrice: number) {
  const { api_key } = integration.config?.credentials || {}
  if (!api_key) return { success: false, error: 'Missing PrestaShop API key' }

  const storeUrl = integration.store_url?.replace(/\/$/, '')
  if (!storeUrl) return { success: false, error: 'Missing store URL' }

  const endpoint = `${storeUrl}/api/products/${mapping.external_product_id}?output_format=JSON`
  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${btoa(api_key + ':')}` },
    body: JSON.stringify({ product: { id: mapping.external_product_id, price: newPrice } }),
  })

  if (!response.ok) {
    const text = await response.text()
    return { success: false, error: text || 'PrestaShop API error' }
  }

  const data = await response.json().catch(() => ({}))
  return { success: true, response: data }
}
