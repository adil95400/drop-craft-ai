import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { authenticateUser } from '../_shared/secure-auth.ts'
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/secure-cors.ts'
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from '../_shared/rate-limit.ts'

/**
 * Shopify Sync - Enterprise-Safe
 * 
 * Security:
 * - JWT authentication required
 * - Rate limiting per user
 * - User data scoping
 * - Integration ownership verification
 */

// Helper: fetch with retry on 429
async function shopifyFetch(url: string, headers: Record<string, string>, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, { headers })
    if (response.status === 429) {
      const retryAfter = parseFloat(response.headers.get('Retry-After') || '2')
      const delay = Math.max(retryAfter, 1) * 1000 * (attempt + 1)
      console.log(`Shopify 429 - retry ${attempt + 1}/${maxRetries} after ${delay}ms`)
      await new Promise(r => setTimeout(r, delay))
      continue
    }
    return response
  }
  throw new Error('Shopify API rate limit exceeded after retries')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightSecure(req)
  }
  const corsHeaders = getSecureCorsHeaders(req)

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Authenticate user
    const { user } = await authenticateUser(req, supabaseClient)
    const userId = user.id

    // Rate limit
    const rateLimitResult = await checkRateLimit(
      supabaseClient,
      userId,
      'shopify_sync',
      RATE_LIMITS.SYNC
    )
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, corsHeaders)
    }

    const body = await req.json()
    let integrationId = body.integrationId || body.integration_id || body.platform_id
    const type = body.type || body.sync_type || 'products'

    // Auto-detect integration: check store_integrations first, then integrations table
    let integration: any = null

    if (integrationId) {
      // Try store_integrations first
      const { data: si } = await supabaseClient
        .from('store_integrations')
        .select('*')
        .eq('id', integrationId)
        .eq('user_id', userId)
        .maybeSingle()
      
      if (si) {
        integration = { ...si, _source: 'store_integrations' }
      } else {
        // Fallback to integrations table
        const { data: ig } = await supabaseClient
          .from('integrations')
          .select('*')
          .eq('id', integrationId)
          .eq('user_id', userId)
          .maybeSingle()
        if (ig) integration = { ...ig, _source: 'integrations' }
      }
    } else {
      // Auto-detect from store_integrations
      const { data: si } = await supabaseClient
        .from('store_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', 'shopify')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()

      if (si) {
        integration = { ...si, _source: 'store_integrations' }
      } else {
        // Fallback to integrations table
        const { data: ig } = await supabaseClient
          .from('integrations')
          .select('*')
          .eq('user_id', userId)
          .eq('platform', 'shopify')
          .eq('connection_status', 'connected')
          .limit(1)
          .maybeSingle()
        if (ig) integration = { ...ig, _source: 'integrations' }
      }
    }

    if (!integration) {
      return new Response(
        JSON.stringify({ error: 'Aucune boutique Shopify connectée. Veuillez d\'abord connecter votre boutique.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract credentials from either table format
    let shopifyDomain: string | null = null
    let accessToken: string | null = null

    if (integration._source === 'integrations') {
      // integrations table stores creds in config.credentials
      const config = integration.config || {}
      const creds = config.credentials || {}
      shopifyDomain = creds.shop_domain || integration.store_url
      accessToken = creds.access_token
    } else {
      // store_integrations table
      const creds = integration.credentials || {}
      shopifyDomain = creds.shop_domain || integration.store_url
      accessToken = creds.access_token || integration.access_token_encrypted
    }

    if (!accessToken || !shopifyDomain) {
      console.error('Credentials manquants:', { hasToken: !!accessToken, hasDomain: !!shopifyDomain, source: integration._source })
      return new Response(
        JSON.stringify({ error: 'Credentials Shopify manquants. Veuillez configurer votre boutique Shopify d\'abord.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Synchronisation ${type} pour ${shopifyDomain} (user: ${userId})`)

    if (type === 'products') {
      return await syncProducts(supabaseClient, integration, shopifyDomain, accessToken, userId, corsHeaders)
    } else if (type === 'orders') {
      return await syncOrders(supabaseClient, integration, shopifyDomain, accessToken, userId, corsHeaders)
    }

    return new Response(
      JSON.stringify({ error: 'Type de synchronisation non supporté' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erreur:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function syncProducts(
  supabaseClient: any, 
  integration: any, 
  shopifyDomain: string, 
  accessToken: string,
  userId: string,
  corsHeaders: Record<string, string>
) {
  let allProducts: any[] = []
  let nextPageInfo = null
  let hasNextPage = true

  while (hasNextPage) {
    const url = `https://${shopifyDomain}/admin/api/2023-10/products.json?limit=250${nextPageInfo ? `&page_info=${nextPageInfo}` : ''}`
    
    const response = await shopifyFetch(url, {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json'
    })

    if (!response.ok) {
      throw new Error(`Erreur Shopify API: ${response.status}`)
    }

    const data = await response.json()
    allProducts = allProducts.concat(data.products || [])

    const linkHeader = response.headers.get('Link')
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const nextMatch = linkHeader.match(/<[^>]*[?&]page_info=([^&>]*).*?>;\s*rel="next"/)
      nextPageInfo = nextMatch ? nextMatch[1] : null
      hasNextPage = !!nextPageInfo
    } else {
      hasNextPage = false
    }
  }

  console.log(`Récupéré ${allProducts.length} produits de Shopify`)

  // Transform and insert products - SCOPED TO USER
  const productsToInsert = allProducts.map(product => ({
    user_id: userId, // CRITICAL: Always use authenticated userId
    name: product.title,
    description: product.body_html || '',
    price: parseFloat(product.variants?.[0]?.price || '0'),
    cost_price: parseFloat(product.variants?.[0]?.compare_at_price || '0'),
    sku: product.variants?.[0]?.sku || '',
    category: product.product_type || 'Général',
    image_url: product.images?.[0]?.src || null,
    stock_quantity: product.variants?.reduce((sum: number, v: any) => sum + (v.inventory_quantity || 0), 0) || 0,
    status: product.status === 'active' ? 'active' as const : 'draft' as const,
    external_id: product.id.toString(),
    external_platform: 'shopify',
    tags: product.tags ? product.tags.split(',').map((t: string) => t.trim()) : [],
    shopify_data: {
      handle: product.handle,
      vendor: product.vendor,
      created_at: product.created_at,
      updated_at: product.updated_at,
      variants: product.variants
    }
  }))

  // Upsert products with user scope
  for (const product of productsToInsert) {
    const { error } = await supabaseClient
      .from('products')
      .upsert(product, { 
        onConflict: 'external_id,user_id',
        ignoreDuplicates: false 
      })

    if (error) {
      console.error('Erreur insertion produit:', error)
    }
  }

  // Update integration status - SCOPED TO USER
  const updateTable = integration._source === 'integrations' ? 'integrations' : 'store_integrations'
  const updateData: any = { last_sync_at: new Date().toISOString() }
  if (updateTable === 'store_integrations') {
    updateData.sync_status = 'synced'
  } else {
    updateData.connection_status = 'connected'
  }
  await supabaseClient
    .from(updateTable)
    .update(updateData)
    .eq('id', integration.id)
    .eq('user_id', userId)

  return new Response(
    JSON.stringify({ 
      success: true, 
      imported: productsToInsert.length,
      message: `${productsToInsert.length} produits synchronisés depuis Shopify`
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function syncOrders(
  supabaseClient: any, 
  integration: any, 
  shopifyDomain: string, 
  accessToken: string,
  userId: string,
  corsHeaders: Record<string, string>
) {
  let allOrders: any[] = []
  let nextPageInfo = null
  let hasNextPage = true

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  while (hasNextPage) {
    const url = `https://${shopifyDomain}/admin/api/2023-10/orders.json?limit=250&status=any&created_at_min=${thirtyDaysAgo.toISOString()}${nextPageInfo ? `&page_info=${nextPageInfo}` : ''}`
    
    const response = await shopifyFetch(url, {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json'
    })

    if (!response.ok) {
      throw new Error(`Erreur Shopify API Orders: ${response.status}`)
    }

    const data = await response.json()
    allOrders = allOrders.concat(data.orders || [])

    const linkHeader = response.headers.get('Link')
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const nextMatch = linkHeader.match(/<[^>]*[?&]page_info=([^&>]*).*?>;\s*rel="next"/)
      nextPageInfo = nextMatch ? nextMatch[1] : null
      hasNextPage = !!nextPageInfo
    } else {
      hasNextPage = false
    }
  }

  console.log(`Récupéré ${allOrders.length} commandes de Shopify`)

  for (const order of allOrders) {
    // Create or get customer - SCOPED TO USER
    let customer_id = null
    if (order.customer) {
      const { data: existingCustomer } = await supabaseClient
        .from('customers')
        .select('id')
        .eq('email', order.customer.email)
        .eq('user_id', userId) // CRITICAL: Scope to user
        .single()

      if (existingCustomer) {
        customer_id = existingCustomer.id
      } else {
        const { data: newCustomer, error: customerError } = await supabaseClient
          .from('customers')
          .insert({
            user_id: userId, // CRITICAL: Always use authenticated userId
            name: `${order.customer.first_name} ${order.customer.last_name}`,
            email: order.customer.email,
            phone: order.customer.phone,
            country: order.shipping_address?.country
          })
          .select('id')
          .single()

        if (!customerError && newCustomer) {
          customer_id = newCustomer.id
        }
      }
    }

    const mapShopifyStatus = (shopifyStatus: string, fulfillmentStatus: string) => {
      if (shopifyStatus === 'cancelled') return 'cancelled'
      if (fulfillmentStatus === 'fulfilled') return 'delivered'
      if (fulfillmentStatus === 'partial') return 'shipped'
      if (shopifyStatus === 'open') return 'processing'
      return 'pending'
    }

    const orderToInsert = {
      user_id: userId, // CRITICAL: Always use authenticated userId
      customer_id,
      order_number: order.order_number.toString(),
      status: mapShopifyStatus(order.financial_status, order.fulfillment_status),
      total_amount: parseFloat(order.total_price || '0'),
      currency: order.currency,
      payment_status: order.financial_status === 'paid' ? 'paid' as const : 'pending' as const,
      shipping_address: order.shipping_address,
      billing_address: order.billing_address,
      external_id: order.id.toString(),
      external_platform: 'shopify',
      order_items: order.line_items?.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        price: parseFloat(item.price),
        sku: item.sku,
        variant_title: item.variant_title
      })),
      shopify_data: {
        tags: order.tags,
        note: order.note,
        created_at: order.created_at,
        processed_at: order.processed_at
      },
      created_at: order.created_at,
      updated_at: order.updated_at
    }

    const { error } = await supabaseClient
      .from('orders')
      .upsert(orderToInsert, { 
        onConflict: 'external_id,user_id',
        ignoreDuplicates: false 
      })

    if (error) {
      console.error('Erreur insertion commande:', error)
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      imported: allOrders.length,
      message: `${allOrders.length} commandes synchronisées depuis Shopify`
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
