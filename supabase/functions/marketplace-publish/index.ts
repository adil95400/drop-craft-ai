import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Platform-specific API adapters
async function publishToShopify(product: any, integration: any, supabase: any, token: string): Promise<{ externalId: string | null; externalUrl: string | null }> {
  try {
    // 1. Resolve Shopify credentials (store_integrations → env vars fallback)
    let shopDomain: string | null = null
    let accessToken: string | null = null

    // Try from store_integrations credentials
    if (integration?.credentials) {
      const creds = typeof integration.credentials === 'string' 
        ? JSON.parse(integration.credentials) 
        : integration.credentials
      shopDomain = creds.shop_domain || creds.domain || creds.store_domain || null
      accessToken = creds.access_token || creds.admin_access_token || null
    }
    // Try from integration config
    if (!accessToken && integration?.config) {
      const config = typeof integration.config === 'string'
        ? JSON.parse(integration.config)
        : integration.config
      accessToken = config.access_token || config.admin_access_token || null
      shopDomain = shopDomain || config.shop_domain || config.domain || null
    }
    // Try from store_url
    if (!shopDomain && integration?.store_url) {
      shopDomain = integration.store_url.replace('https://', '').replace('http://', '').replace(/\/$/, '')
    }
    // Fallback to env vars
    if (!shopDomain) shopDomain = Deno.env.get('SHOPIFY_STORE_PERMANENT_DOMAIN') || null
    if (!accessToken) accessToken = Deno.env.get('SHOPIFY_ADMIN_ACCESS_TOKEN') || null

    if (!shopDomain || !accessToken) {
      throw new Error('Missing Shopify credentials (domain or access_token)')
    }

    // Ensure domain format
    if (!shopDomain.includes('.myshopify.com') && !shopDomain.includes('.')) {
      shopDomain = `${shopDomain}.myshopify.com`
    }

    console.log(`[Shopify] Publishing "${product.title}" to ${shopDomain}`)

    // 2. Build Shopify product payload with correct field mapping
    const images: Array<{ src: string }> = []
    if (product.image_url) images.push({ src: product.image_url })
    if (product.images && Array.isArray(product.images)) {
      for (const img of product.images) {
        const src = typeof img === 'string' ? img : img.url || img.src
        if (src && !images.find(i => i.src === src)) images.push({ src })
      }
    }
    if (product.image_urls && Array.isArray(product.image_urls)) {
      for (const url of product.image_urls) {
        if (url && !images.find(i => i.src === url)) images.push({ src: url })
      }
    }

    const shopifyProduct: any = {
      title: product.title || product.name || 'Untitled',
      body_html: product.description || '',
      vendor: product.brand || product.supplier_name || '',
      product_type: product.category || '',
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || ''),
      status: 'active',
      variants: [{
        price: (product.price || 0).toString(),
        compare_at_price: product.compare_at_price ? product.compare_at_price.toString() : null,
        sku: product.sku || '',
        inventory_quantity: product.stock_quantity || 0,
        inventory_management: 'shopify',
        requires_shipping: true,
      }],
      images: images.length > 0 ? images : undefined,
    }

    // Add weight if available
    if (product.weight) {
      shopifyProduct.variants[0].weight = product.weight
      shopifyProduct.variants[0].weight_unit = product.weight_unit || 'kg'
    }

    // 3. Call Shopify Admin API directly
    const apiVersion = '2025-07'
    const shopifyUrl = `https://${shopDomain}/admin/api/${apiVersion}/products.json`

    const response = await fetch(shopifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ product: shopifyProduct }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`[Shopify] API error ${response.status}:`, errorBody)
      throw new Error(`Shopify API error ${response.status}: ${errorBody.substring(0, 200)}`)
    }

    const result = await response.json()
    const shopifyId = result.product?.id?.toString() || null

    console.log(`[Shopify] ✅ Product created with ID: ${shopifyId}`)

    return {
      externalId: shopifyId,
      externalUrl: shopifyId ? `https://${shopDomain}/admin/products/${shopifyId}` : null,
    }
  } catch (e) {
    console.error(`[Shopify] Publication failed:`, e.message)
    throw e // Re-throw so the caller logs the error properly
  }
}

async function publishToWooCommerce(product: any, integration: any, supabase: any, token: string): Promise<{ externalId: string | null; externalUrl: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke('woocommerce-product-create', {
      body: {
        product: {
          title: product.name,
          description: product.description || '',
          price: product.price || 0,
          sku: product.sku || '',
          stock_quantity: product.stock_quantity || 0,
          images: product.image_urls || (product.image_url ? [product.image_url] : []),
          category: product.category || '',
          brand: product.brand || '',
          tags: product.tags || [],
        },
        storeId: integration.id
      },
      headers: { Authorization: `Bearer ${token}` }
    })
    if (error) throw error
    const wooId = data?.productId?.toString() || null
    return { 
      externalId: wooId,
      externalUrl: wooId && integration.store_url ? `${integration.store_url}/wp-admin/post.php?post=${wooId}&action=edit` : null
    }
  } catch (e) {
    console.warn(`WooCommerce API call failed:`, e.message)
    return { externalId: null, externalUrl: null }
  }
}

async function publishToEbay(product: any, integration: any, supabase: any, token: string): Promise<{ externalId: string | null; externalUrl: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke('ebay-connector', {
      body: {
        action: 'create_listing',
        integrationId: integration.id,
        listing: {
          title: (product.name || '').substring(0, 80), // eBay title limit
          description: product.description || '',
          price: product.price || 0,
          quantity: product.stock_quantity || 1,
          sku: product.sku || '',
          category_id: product.category || '',
          images: product.image_urls || (product.image_url ? [product.image_url] : []),
          condition: 'NEW',
          currency: 'EUR',
        }
      },
      headers: { Authorization: `Bearer ${token}` }
    })
    if (error) throw error
    const ebayId = data?.listingId || data?.itemId || null
    return { 
      externalId: ebayId?.toString() || null,
      externalUrl: ebayId ? `https://www.ebay.com/itm/${ebayId}` : null
    }
  } catch (e) {
    console.warn(`eBay API call failed:`, e.message)
    return { externalId: null, externalUrl: null }
  }
}

async function publishToAmazon(product: any, integration: any, supabase: any, token: string): Promise<{ externalId: string | null; externalUrl: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke('amazon-connector', {
      body: {
        action: 'create_listing',
        integrationId: integration.id,
        product: {
          title: product.name || '',
          description: product.description || '',
          price: product.price || 0,
          sku: product.sku || '',
          quantity: product.stock_quantity || 0,
          brand: product.brand || '',
          category: product.category || '',
          images: product.image_urls || (product.image_url ? [product.image_url] : []),
          bullet_points: product.tags || [],
        }
      },
      headers: { Authorization: `Bearer ${token}` }
    })
    if (error) throw error
    const asin = data?.asin || data?.listingId || null
    return { 
      externalId: asin?.toString() || null,
      externalUrl: asin ? `https://www.amazon.com/dp/${asin}` : null
    }
  } catch (e) {
    console.warn(`Amazon API call failed:`, e.message)
    return { externalId: null, externalUrl: null }
  }
}

async function publishToEtsy(product: any, integration: any, supabase: any, token: string): Promise<{ externalId: string | null; externalUrl: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke('etsy-open-api', {
      body: {
        action: 'create_listing',
        integrationId: integration.id,
        listing: {
          title: product.name || '',
          description: product.description || '',
          price: product.price || 0,
          quantity: product.stock_quantity || 1,
          sku: [product.sku || ''],
          tags: (product.tags || []).slice(0, 13), // Etsy max 13 tags
          images: product.image_urls || (product.image_url ? [product.image_url] : []),
        }
      },
      headers: { Authorization: `Bearer ${token}` }
    })
    if (error) throw error
    const listingId = data?.listing_id || null
    return {
      externalId: listingId?.toString() || null,
      externalUrl: listingId ? `https://www.etsy.com/listing/${listingId}` : null
    }
  } catch (e) {
    console.warn(`Etsy API call failed:`, e.message)
    return { externalId: null, externalUrl: null }
  }
}

async function publishToPrestaShop(product: any, integration: any, supabase: any, token: string): Promise<{ externalId: string | null; externalUrl: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke('prestashop-sync', {
      body: {
        action: 'create_product',
        integrationId: integration.id,
        product: {
          name: product.name || '',
          description: product.description || '',
          price: product.price || 0,
          quantity: product.stock_quantity || 0,
          reference: product.sku || '',
          categories: product.category ? [product.category] : [],
          images: product.image_urls || (product.image_url ? [product.image_url] : []),
        }
      },
      headers: { Authorization: `Bearer ${token}` }
    })
    if (error) throw error
    const psId = data?.productId || null
    return {
      externalId: psId?.toString() || null,
      externalUrl: psId && integration.store_url ? `${integration.store_url}/admin/catalog/products/${psId}` : null
    }
  } catch (e) {
    console.warn(`PrestaShop API call failed:`, e.message)
    return { externalId: null, externalUrl: null }
  }
}

// Platform router
const platformHandlers: Record<string, Function> = {
  shopify: publishToShopify,
  woocommerce: publishToWooCommerce,
  ebay: publishToEbay,
  amazon: publishToAmazon,
  etsy: publishToEtsy,
  prestashop: publishToPrestaShop,
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) throw new Error('Unauthorized')

    const { productId, storeIds, publishOptions = {} } = await req.json()

    if (!productId || !storeIds?.length) {
      throw new Error('productId and storeIds are required')
    }

    console.log(`[marketplace-publish] User ${user.id} publishing product ${productId} to stores:`, storeIds)

    // 1. Fetch product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', user.id)
      .single()

    if (productError || !product) {
      throw new Error(`Product not found: ${productError?.message || 'unknown'}`)
    }

    // 2. Fetch target stores from both tables
    const { data: stores } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', user.id)
      .in('id', storeIds)

    const { data: integrationStores } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .in('id', storeIds)

    const allStores: any[] = [
      ...(stores || []).map((s: any) => ({ ...s, _source: 'stores' })),
      ...(integrationStores || []).map((i: any) => {
        // Extract credentials from config JSON if present
        const config = typeof i.config === 'string' ? JSON.parse(i.config) : (i.config || {})
        const credentials = config.credentials || null
        return {
          id: i.id,
          name: i.platform_name || i.platform,
          platform: i.platform,
          store_url: i.store_url,
          user_id: i.user_id,
          config: i.config,
          credentials: credentials,
          _source: 'integrations',
        }
      }),
    ]

    if (!allStores.length) {
      throw new Error('No stores found for the given IDs')
    }

    // 3. Fetch store_integrations for credentials
    const storeOnlyIds = allStores.filter((s: any) => s._source === 'stores').map((s: any) => s.id)
    const integrationMap = new Map()
    if (storeOnlyIds.length > 0) {
      const { data: storeIntegrations } = await supabase
        .from('store_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .in('id', storeOnlyIds)

      for (const integ of (storeIntegrations || [])) {
        integrationMap.set(integ.id, integ)
      }
    }

    const results: Array<{
      storeId: string
      storeName: string
      platform: string
      success: boolean
      message: string
      externalProductId?: string
      externalUrl?: string
    }> = []

    // 4. Publish to each store using platform-specific handlers
    for (const store of allStores) {
      const startTime = Date.now()
      try {
        console.log(`[marketplace-publish] Publishing to ${store.name} (${store.platform})`)

        const integration = integrationMap.get(store.id) || store
        const handler = platformHandlers[store.platform?.toLowerCase()]
        
        let externalId: string | null = null
        let externalUrl: string | null = null

        if (handler) {
          const result = await handler(product, integration, supabase, token)
          externalId = result.externalId
          externalUrl = result.externalUrl
        }

        // 5. Upsert product_store_links
        await supabase
          .from('product_store_links')
          .upsert({
            product_id: productId,
            store_id: store.id,
            published: true,
            sync_status: externalId ? 'synced' : 'pending',
            external_product_id: externalId,
            last_sync_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'product_id,store_id' })

        // 6. Update product status
        await supabase
          .from('products')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('id', productId)

        // 7. Log publication
        await supabase.from('publication_logs').insert({
          user_id: user.id,
          product_id: productId,
          channel_type: 'marketplace',
          channel_id: store.platform,
          channel_name: store.name,
          action: 'publish',
          status: externalId ? 'success' : 'pending',
          external_id: externalId,
          external_url: externalUrl,
          duration_ms: Date.now() - startTime,
          metadata: { store_id: store.id, publish_options: publishOptions }
        })

        // 8. Activity log
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'publish_product',
          entity_type: 'product',
          entity_id: productId,
          description: `Published "${product.name}" to ${store.name} (${store.platform})`,
          details: { store_id: store.id, platform: store.platform, external_product_id: externalId, external_url: externalUrl }
        })

        results.push({
          storeId: store.id,
          storeName: store.name,
          platform: store.platform,
          success: true,
          message: externalId
            ? `Published with external ID: ${externalId}`
            : 'Published (link recorded, awaiting sync)',
          externalProductId: externalId || undefined,
          externalUrl: externalUrl || undefined,
        })
      } catch (error) {
        console.error(`[marketplace-publish] Error for store ${store.id}:`, error)

        await supabase.from('product_store_links').upsert({
          product_id: productId,
          store_id: store.id,
          published: false,
          sync_status: 'error',
          last_error: error.message,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'product_id,store_id' })

        await supabase.from('publication_logs').insert({
          user_id: user.id,
          product_id: productId,
          channel_type: 'marketplace',
          channel_id: store.platform,
          channel_name: store.name,
          action: 'publish',
          status: 'failed',
          error_message: error.message,
          duration_ms: Date.now() - startTime,
        })

        results.push({
          storeId: store.id,
          storeName: store.name,
          platform: store.platform,
          success: false,
          message: error.message,
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return new Response(
      JSON.stringify({ success: successCount > 0, totalStores: storeIds.length, successCount, failCount, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[marketplace-publish] Fatal error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
