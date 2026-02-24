/**
 * Auto-Fulfillment Engine — SECURED (JWT-first, RLS-enforced)
 * 
 * Pipeline:
 * 1. order.created → match products → find supplier → place supplier order
 * 2. tracking received → update shipment → sync to Shopify
 * 3. retry failed orders with exponential backoff
 * 
 * Actions: process_order, process_pending, retry_failed, sync_tracking, get_stats
 */

import { requireAuth, handlePreflight, errorResponse, successResponse } from '../_shared/jwt-auth.ts'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const body = await req.json().catch(() => ({}))
    const { action = 'get_stats' } = body

    console.log(`[auto-fulfillment-engine] action=${action} user=${userId.slice(0, 8)}`)

    let result: Record<string, unknown>

    switch (action) {
      case 'process_order':
        result = await processOrder(supabase, userId, body.order_id)
        break
      case 'process_pending':
        result = await processPendingOrders(supabase, userId)
        break
      case 'retry_failed':
        result = await retryFailedOrders(supabase, userId, body.queue_ids)
        break
      case 'sync_tracking':
        result = await syncTrackingToShopify(supabase, userId)
        break
      case 'get_stats':
        result = await getStats(supabase, userId)
        break
      default:
        return errorResponse(`Unknown action: ${action}`, corsHeaders)
    }

    return successResponse(result, corsHeaders)
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[auto-fulfillment-engine] Error:', err)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...getSecureCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  }
})

// ─── PROCESS A SINGLE ORDER ──────────────────────────────────────────────────
async function processOrder(supabase: any, userId: string, orderId: string) {
  if (!orderId) throw new Error('order_id required')

  const { data: order, error: oErr } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .eq('user_id', userId)
    .single()

  if (oErr || !order) throw new Error('Order not found')

  // Check if already queued
  const { data: existing } = await supabase
    .from('auto_order_queue')
    .select('id, status')
    .eq('order_id', orderId)
    .eq('user_id', userId)
    .in('status', ['pending', 'processing'])
    .maybeSingle()

  if (existing) {
    return { error: 'Order already in queue', queue_id: existing.id }
  }

  // Match order items to products → find supplier
  const items = order.order_items || []
  const supplierItems: any[] = []
  let primarySupplier = 'manual'

  for (const item of items) {
    if (!item.product_id) continue

    const { data: product } = await supabase
      .from('products')
      .select('id, title, sku, supplier, supplier_product_id, cost_price')
      .eq('id', item.product_id)
      .single()

    if (product?.supplier && product?.supplier_product_id) {
      primarySupplier = product.supplier
      supplierItems.push({
        product_id: product.id,
        title: product.title,
        sku: product.sku,
        supplier_product_id: product.supplier_product_id,
        quantity: item.qty || item.quantity || 1,
        cost_price: product.cost_price || 0,
      })
    }
  }

  if (supplierItems.length === 0) {
    return { error: 'No products with supplier mapping found' }
  }

  // Enqueue the supplier order
  const { data: queued, error: qErr } = await supabase
    .from('auto_order_queue')
    .insert({
      order_id: orderId,
      user_id: userId,
      supplier_type: primarySupplier,
      status: 'pending',
      payload: {
        order_number: order.order_number,
        shipping_address: order.shipping_address,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        items: supplierItems,
        total_cost: supplierItems.reduce((s: number, i: any) => s + i.cost_price * i.quantity, 0),
      },
      retry_count: 0,
      max_retries: 3,
    })
    .select('id')
    .single()

  if (qErr) throw qErr

  // Try to process immediately
  const result = await executeSupplierOrder(supabase, userId, queued.id)

  // Log activity
  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'auto_fulfillment_queued',
    entity_type: 'order',
    entity_id: orderId,
    description: `Order ${order.order_number} queued for ${primarySupplier} (${supplierItems.length} items)`,
    details: { queue_id: queued.id, supplier: primarySupplier, result },
    source: 'auto-fulfillment-engine',
  })

  return {
    queue_id: queued.id,
    supplier: primarySupplier,
    items_count: supplierItems.length,
    execution: result,
  }
}

// ─── EXECUTE SUPPLIER ORDER ──────────────────────────────────────────────────
async function executeSupplierOrder(supabase: any, userId: string, queueId: string) {
  const { data: queueItem } = await supabase
    .from('auto_order_queue')
    .select('*')
    .eq('id', queueId)
    .eq('user_id', userId)
    .single()

  if (!queueItem) throw new Error('Queue item not found')

  await supabase
    .from('auto_order_queue')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .eq('id', queueId)

  try {
    // Get supplier credentials (RLS-scoped to this user)
    const { data: creds } = await supabase
      .from('supplier_credentials_vault')
      .select('supplier_slug, oauth_data')
      .eq('user_id', userId)
      .eq('connection_status', 'connected')
      .ilike('supplier_slug', `%${queueItem.supplier_type}%`)
      .maybeSingle()

    if (!creds) {
      await supabase
        .from('auto_order_queue')
        .update({
          status: 'pending',
          error_message: `No connected credentials for supplier: ${queueItem.supplier_type}. Manual processing required.`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', queueId)

      return { status: 'pending_manual', reason: 'no_credentials' }
    }

    const payload = queueItem.payload as any
    const orderResult = await placeSupplierOrder(
      queueItem.supplier_type,
      creds.oauth_data,
      payload.items,
      payload.shipping_address
    )

    await supabase
      .from('auto_order_queue')
      .update({
        status: 'completed',
        supplier_order_id: orderResult.supplierOrderId,
        tracking_number: orderResult.trackingNumber,
        carrier: orderResult.carrier,
        estimated_delivery: orderResult.estimatedDelivery,
        processed_at: new Date().toISOString(),
        result: orderResult,
        updated_at: new Date().toISOString(),
      })
      .eq('id', queueId)

    await supabase
      .from('fulfillment_shipments')
      .upsert({
        user_id: userId,
        order_id: queueItem.order_id,
        supplier_order_id: orderResult.supplierOrderId,
        supplier_order_status: 'pending',
        tracking_number: orderResult.trackingNumber,
        carrier_code: orderResult.carrier,
        status: orderResult.trackingNumber ? 'shipped' : 'processing',
        estimated_delivery: orderResult.estimatedDelivery,
        shipping_cost: payload.total_cost,
      }, { onConflict: 'order_id,user_id' })

    await supabase
      .from('orders')
      .update({
        status: 'processing',
        fulfillment_status: orderResult.trackingNumber ? 'shipped' : 'in_progress',
        tracking_number: orderResult.trackingNumber,
        shipping_carrier: orderResult.carrier,
        updated_at: new Date().toISOString(),
      })
      .eq('id', queueItem.order_id)
      .eq('user_id', userId)

    return { status: 'completed', ...orderResult }

  } catch (err: any) {
    const nextRetry = queueItem.retry_count < queueItem.max_retries
      ? new Date(Date.now() + Math.pow(2, queueItem.retry_count) * 60000).toISOString()
      : null

    await supabase
      .from('auto_order_queue')
      .update({
        status: queueItem.retry_count >= queueItem.max_retries ? 'failed' : 'pending',
        error_message: err.message,
        retry_count: queueItem.retry_count + 1,
        next_retry_at: nextRetry,
        updated_at: new Date().toISOString(),
      })
      .eq('id', queueId)

    return { status: 'error', error: err.message, retry_scheduled: !!nextRetry }
  }
}

// ─── PLACE SUPPLIER ORDER ────────────────────────────────────────────────────
async function placeSupplierOrder(
  supplierType: string,
  credentials: any,
  items: any[],
  shippingAddress: any
): Promise<{ supplierOrderId: string; status: string; trackingNumber: string | null; carrier: string | null; estimatedDelivery: string | null }> {
  switch (supplierType) {
    case 'cj-dropshipping':
    case 'cjdropshipping': {
      const accessToken = credentials?.accessToken
      if (!accessToken) throw new Error('CJ access token missing')

      const resp = await fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'CJ-Access-Token': accessToken },
        body: JSON.stringify({
          orderNumber: `CJ-${Date.now()}`,
          shippingZip: shippingAddress?.zipCode || shippingAddress?.postal_code,
          shippingCountryCode: shippingAddress?.countryCode || shippingAddress?.country,
          shippingProvince: shippingAddress?.state,
          shippingCity: shippingAddress?.city,
          shippingAddress: shippingAddress?.address1 || shippingAddress?.address,
          shippingCustomerName: shippingAddress?.name,
          shippingPhone: shippingAddress?.phone,
          products: items.map(i => ({
            vid: i.supplier_product_id,
            quantity: i.quantity,
            shippingMethodId: 'CJ_PACKET_F',
          })),
        }),
      })
      if (!resp.ok) throw new Error(`CJ API error: ${await resp.text()}`)
      const data = await resp.json()
      return {
        supplierOrderId: data.data?.orderId || data.data?.orderNumber || `cj-${Date.now()}`,
        status: 'pending',
        trackingNumber: null,
        carrier: null,
        estimatedDelivery: null,
      }
    }

    case 'bigbuy': {
      const apiKey = credentials?.apiKey
      if (!apiKey) throw new Error('BigBuy API key missing')

      const resp = await fetch('https://api.bigbuy.eu/rest/order', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddress: {
            firstName: shippingAddress?.name?.split(' ')[0] || '',
            lastName: shippingAddress?.name?.split(' ').slice(1).join(' ') || '',
            address: shippingAddress?.address1 || shippingAddress?.address,
            postcode: shippingAddress?.zipCode || shippingAddress?.postal_code,
            town: shippingAddress?.city,
            country: shippingAddress?.countryCode || shippingAddress?.country,
            phone: shippingAddress?.phone,
          },
          products: items.map(i => ({ reference: i.sku || i.supplier_product_id, quantity: i.quantity })),
          carriers: [{ id: 1 }],
          paymentMethod: 'api',
          internalReference: `BB-${Date.now()}`,
        }),
      })
      if (!resp.ok) throw new Error(`BigBuy API error: ${await resp.text()}`)
      const data = await resp.json()
      return {
        supplierOrderId: data.id?.toString() || `bb-${Date.now()}`,
        status: 'pending',
        trackingNumber: null,
        carrier: null,
        estimatedDelivery: null,
      }
    }

    default:
      throw new Error(`Supplier "${supplierType}" not supported for auto-order.`)
  }
}

// ─── PROCESS ALL PENDING ORDERS ──────────────────────────────────────────────
async function processPendingOrders(supabase: any, userId: string) {
  const { data: pending } = await supabase
    .from('auto_order_queue')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .or(`next_retry_at.is.null,next_retry_at.lte.${new Date().toISOString()}`)
    .order('created_at', { ascending: true })
    .limit(10)

  const results = []
  for (const item of pending || []) {
    const result = await executeSupplierOrder(supabase, userId, item.id)
    results.push({ queue_id: item.id, ...result })
  }

  return { processed: results.length, results }
}

// ─── RETRY FAILED ORDERS ────────────────────────────────────────────────────
async function retryFailedOrders(supabase: any, userId: string, queueIds?: string[]) {
  let query = supabase
    .from('auto_order_queue')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'failed')

  if (queueIds?.length) {
    query = query.in('id', queueIds)
  }

  const { data: failed } = await query.limit(20)

  for (const item of failed || []) {
    await supabase
      .from('auto_order_queue')
      .update({ status: 'pending', retry_count: 0, error_message: null, updated_at: new Date().toISOString() })
      .eq('id', item.id)
  }

  const results = []
  for (const item of failed || []) {
    const result = await executeSupplierOrder(supabase, userId, item.id)
    results.push({ queue_id: item.id, ...result })
  }

  return { retried: results.length, results }
}

// ─── SYNC TRACKING TO SHOPIFY ────────────────────────────────────────────────
async function syncTrackingToShopify(supabase: any, userId: string) {
  const { data: shipments } = await supabase
    .from('fulfillment_shipments')
    .select('*, order:orders(shopify_order_id)')
    .eq('user_id', userId)
    .not('tracking_number', 'is', null)
    .is('shopify_synced_at', null)
    .limit(20)

  if (!shipments?.length) {
    return { synced: 0, message: 'No tracking to sync' }
  }

  const { data: shop } = await supabase
    .from('shops')
    .select('shop_domain, access_token')
    .eq('user_id', userId)
    .eq('platform', 'shopify')
    .eq('is_active', true)
    .maybeSingle()

  if (!shop?.access_token) {
    return { error: 'No active Shopify connection' }
  }

  let synced = 0
  const errors: any[] = []

  for (const shipment of shipments) {
    const shopifyOrderId = shipment.order?.shopify_order_id
    if (!shopifyOrderId) continue

    try {
      const fulfillmentResp = await fetch(
        `https://${shop.shop_domain}/admin/api/2024-10/orders/${shopifyOrderId}/fulfillments.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': shop.access_token,
          },
          body: JSON.stringify({
            fulfillment: {
              tracking_number: shipment.tracking_number,
              tracking_company: shipment.carrier_code || shipment.carrier || 'Other',
              notify_customer: true,
            },
          }),
        }
      )

      if (fulfillmentResp.ok) {
        const fData = await fulfillmentResp.json()
        await supabase
          .from('fulfillment_shipments')
          .update({
            shopify_fulfillment_id: fData.fulfillment?.id?.toString(),
            shopify_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', shipment.id)
        synced++
      } else {
        const errText = await fulfillmentResp.text()
        errors.push({ shipment_id: shipment.id, error: errText })
      }
    } catch (err: any) {
      errors.push({ shipment_id: shipment.id, error: err.message })
    }
  }

  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'tracking_synced_to_shopify',
    entity_type: 'fulfillment',
    description: `Synced ${synced} tracking numbers to Shopify`,
    details: { synced, errors: errors.length, error_details: errors },
    source: 'auto-fulfillment-engine',
  })

  return { synced, errors: errors.length, error_details: errors }
}

// ─── GET STATS ───────────────────────────────────────────────────────────────
async function getStats(supabase: any, userId: string) {
  const { data: queue } = await supabase
    .from('auto_order_queue')
    .select('id, status, created_at, processed_at, supplier_type')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200)

  const items = queue || []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayItems = items.filter((i: any) => new Date(i.created_at) >= today)

  const byStatus: Record<string, number> = {}
  const bySupplier: Record<string, number> = {}
  items.forEach((i: any) => {
    byStatus[i.status] = (byStatus[i.status] || 0) + 1
    if (i.supplier_type) bySupplier[i.supplier_type] = (bySupplier[i.supplier_type] || 0) + 1
  })

  const completed = byStatus['completed'] || 0
  const total = items.length || 1
  const successRate = Math.round((completed / total) * 100)

  let avgTime = 0
  const completedItems = items.filter((i: any) => i.status === 'completed' && i.processed_at)
  if (completedItems.length > 0) {
    const totalMs = completedItems.reduce((sum: number, i: any) => {
      return sum + (new Date(i.processed_at).getTime() - new Date(i.created_at).getTime())
    }, 0)
    avgTime = Math.round(totalMs / completedItems.length / 60000 * 10) / 10
  }

  const { count: unsyncedTracking } = await supabase
    .from('fulfillment_shipments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('tracking_number', 'is', null)
    .is('shopify_synced_at', null)

  return {
    todayOrders: todayItems.length,
    successRate,
    avgProcessingTime: avgTime,
    pendingOrders: byStatus['pending'] || 0,
    processing: byStatus['processing'] || 0,
    completed,
    failed: byStatus['failed'] || 0,
    unsyncedTracking: unsyncedTracking || 0,
    bySupplier,
    recentOrders: items.slice(0, 20),
  }
}
