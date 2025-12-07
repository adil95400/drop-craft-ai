/**
 * Unified Channel Webhooks - Gestionnaire de webhooks temps réel pour les 14 plateformes
 * Shopify, WooCommerce, Amazon, eBay, Etsy, TikTok Shop, Google Merchant, Meta, PrestaShop, Wix, Magento, Cdiscount, Fnac, Rakuten
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface WebhookEvent {
  platform: string
  event_type: string
  store_id: string
  data: Record<string, unknown>
  signature?: string
  timestamp: string
}

interface ProcessedEvent {
  type: 'product' | 'order' | 'inventory' | 'refund' | 'sync' | 'app'
  action: 'create' | 'update' | 'delete' | 'cancel' | 'fulfill' | 'sync'
  data: Record<string, unknown>
}

// Platform-specific webhook processors
const platformProcessors: Record<string, (body: unknown, headers: Headers) => ProcessedEvent | null> = {
  shopify: (body: any, headers: Headers) => {
    const topic = headers.get('x-shopify-topic') || ''
    const [resource, action] = topic.split('/')
    
    return {
      type: resource === 'products' ? 'product' : 
            resource === 'orders' ? 'order' : 
            resource === 'inventory_levels' ? 'inventory' :
            resource === 'refunds' ? 'refund' : 'sync',
      action: action as ProcessedEvent['action'],
      data: body
    }
  },
  
  woocommerce: (body: any, headers: Headers) => {
    const topic = headers.get('x-wc-webhook-topic') || body.action || ''
    const [action, resource] = topic.split('.')
    
    return {
      type: resource === 'product' ? 'product' : 
            resource === 'order' ? 'order' : 
            resource === 'stock' ? 'inventory' : 'sync',
      action: action as ProcessedEvent['action'],
      data: body
    }
  },
  
  amazon: (body: any) => {
    const notificationType = body.NotificationType || body.notification_type || ''
    
    const typeMap: Record<string, ProcessedEvent['type']> = {
      'LISTINGS_ITEM_ISSUES_CHANGE': 'product',
      'LISTINGS_ITEM_STATUS_CHANGE': 'product',
      'ORDER_CHANGE': 'order',
      'FBA_INVENTORY_AVAILABILITY_CHANGES': 'inventory',
      'REFUND_STATUS_NOTIFICATION': 'refund'
    }
    
    return {
      type: typeMap[notificationType] || 'sync',
      action: 'update',
      data: body.Payload || body
    }
  },
  
  ebay: (body: any) => {
    const topic = body.metadata?.topic || ''
    
    return {
      type: topic.includes('ITEM') ? 'product' : 
            topic.includes('ORDER') ? 'order' : 
            topic.includes('INVENTORY') ? 'inventory' : 'sync',
      action: topic.includes('CREATED') ? 'create' : 
              topic.includes('DELETED') ? 'delete' : 'update',
      data: body.notification || body
    }
  },
  
  etsy: (body: any) => {
    const type = body.type || ''
    
    return {
      type: type.includes('listing') ? 'product' : 
            type.includes('receipt') ? 'order' : 'sync',
      action: type.includes('create') ? 'create' : 
              type.includes('delete') ? 'delete' : 'update',
      data: body
    }
  },
  
  tiktok: (body: any) => {
    const eventType = body.type || body.event_type || ''
    
    return {
      type: eventType.includes('product') ? 'product' : 
            eventType.includes('order') ? 'order' : 
            eventType.includes('inventory') ? 'inventory' : 'sync',
      action: eventType.includes('create') ? 'create' : 
              eventType.includes('cancel') ? 'cancel' : 'update',
      data: body.data || body
    }
  },
  
  google: (body: any) => {
    const resourceType = body.resource?.type || ''
    
    return {
      type: resourceType === 'PRODUCT' ? 'product' : 
            resourceType === 'ORDER' ? 'order' : 'sync',
      action: body.action?.toLowerCase() || 'update',
      data: body.resource?.data || body
    }
  },
  
  meta: (body: any) => {
    const entry = body.entry?.[0] || {}
    const changes = entry.changes?.[0] || {}
    
    return {
      type: changes.field === 'products' ? 'product' : 
            changes.field === 'orders' ? 'order' : 'sync',
      action: changes.value?.action || 'update',
      data: changes.value || body
    }
  },
  
  prestashop: (body: any) => {
    const hookName = body.hook_name || ''
    
    return {
      type: hookName.includes('Product') ? 'product' : 
            hookName.includes('Order') ? 'order' : 
            hookName.includes('Stock') ? 'inventory' : 'sync',
      action: hookName.includes('Add') ? 'create' : 
              hookName.includes('Delete') ? 'delete' : 'update',
      data: body.data || body
    }
  },
  
  wix: (body: any) => {
    const slug = body.data?.eventType || ''
    
    return {
      type: slug.includes('product') ? 'product' : 
            slug.includes('order') ? 'order' : 
            slug.includes('inventory') ? 'inventory' : 'sync',
      action: slug.includes('Created') ? 'create' : 
              slug.includes('Deleted') ? 'delete' : 'update',
      data: body.data?.data || body
    }
  },
  
  magento: (body: any) => {
    const event = body.event || ''
    
    return {
      type: event.includes('catalog_product') ? 'product' : 
            event.includes('sales_order') ? 'order' : 
            event.includes('cataloginventory') ? 'inventory' : 'sync',
      action: event.includes('_save_after') ? 'update' : 
              event.includes('_delete_after') ? 'delete' : 'update',
      data: body.data || body
    }
  },
  
  cdiscount: (body: any) => {
    return {
      type: body.ObjectType === 'Product' ? 'product' : 
            body.ObjectType === 'Order' ? 'order' : 'sync',
      action: body.Action?.toLowerCase() || 'update',
      data: body
    }
  },
  
  fnac: (body: any) => {
    return {
      type: body.type === 'offer' ? 'product' : 
            body.type === 'order' ? 'order' : 'sync',
      action: body.action || 'update',
      data: body
    }
  },
  
  rakuten: (body: any) => {
    return {
      type: body.itemType === 'product' ? 'product' : 
            body.itemType === 'order' ? 'order' : 'sync',
      action: body.eventType || 'update',
      data: body
    }
  }
}

// Verify webhook signatures for each platform
async function verifyWebhookSignature(platform: string, body: string, headers: Headers, secret: string): Promise<boolean> {
  const encoder = new TextEncoder()
  
  switch (platform) {
    case 'shopify': {
      const hmac = headers.get('x-shopify-hmac-sha256')
      if (!hmac) return false
      const key = await crypto.subtle.importKey(
        'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      )
      const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
      const computed = btoa(String.fromCharCode(...new Uint8Array(signature)))
      return computed === hmac
    }
    
    case 'woocommerce': {
      const signature = headers.get('x-wc-webhook-signature')
      if (!signature) return false
      const key = await crypto.subtle.importKey(
        'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      )
      const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
      const computed = btoa(String.fromCharCode(...new Uint8Array(sig)))
      return computed === signature
    }
    
    // For other platforms, accept if any auth header is present or skip validation in dev
    default:
      const hasAuth = headers.get('authorization') || 
                      headers.get('x-webhook-signature') ||
                      headers.get('x-api-key')
      return !!hasAuth || Deno.env.get('ENVIRONMENT') === 'development'
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse platform from URL path or header
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const platform = pathParts[pathParts.length - 1] || 
                    req.headers.get('x-platform') || 
                    'unknown'

    const bodyText = await req.text()
    let body: any
    try {
      body = JSON.parse(bodyText)
    } catch {
      body = { raw: bodyText }
    }

    console.log(`[Webhook] Received ${platform} event`)

    // Get store ID from body or query params
    const storeId = body.store_id || 
                   body.shop_id || 
                   url.searchParams.get('store_id') ||
                   body.shop?.id

    // Fetch integration to get webhook secret
    let integration = null
    if (storeId) {
      const { data } = await supabase
        .from('integrations')
        .select('*')
        .eq('id', storeId)
        .single()
      integration = data
    }

    // Verify signature if we have a secret
    const webhookSecret = integration?.webhook_secret || Deno.env.get(`${platform.toUpperCase()}_WEBHOOK_SECRET`)
    if (webhookSecret) {
      const isValid = await verifyWebhookSignature(platform, bodyText, req.headers, webhookSecret)
      if (!isValid) {
        console.error(`[Webhook] Invalid signature for ${platform}`)
        return new Response(
          JSON.stringify({ error: 'Invalid webhook signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Process webhook with platform-specific handler
    const processor = platformProcessors[platform.toLowerCase()]
    let processedEvent: ProcessedEvent | null = null
    
    if (processor) {
      processedEvent = processor(body, req.headers)
    } else {
      // Generic processing
      processedEvent = {
        type: 'sync',
        action: 'update',
        data: body
      }
    }

    if (!processedEvent) {
      return new Response(
        JSON.stringify({ message: 'Event ignored' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Store webhook event
    const { error: insertError } = await supabase
      .from('webhook_events')
      .insert({
        platform,
        event_type: `${processedEvent.type}_${processedEvent.action}`,
        integration_id: storeId,
        payload: processedEvent.data,
        processed: false,
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('[Webhook] Error storing event:', insertError)
    }

    // Update integration last_webhook_at
    if (storeId) {
      await supabase
        .from('integrations')
        .update({ 
          last_webhook_at: new Date().toISOString(),
          webhook_event_count: (integration?.webhook_event_count || 0) + 1
        })
        .eq('id', storeId)
    }

    // Process specific event types
    if (processedEvent.type === 'product') {
      await processProductEvent(supabase, storeId, platform, processedEvent)
    } else if (processedEvent.type === 'order') {
      await processOrderEvent(supabase, storeId, platform, processedEvent)
    } else if (processedEvent.type === 'inventory') {
      await processInventoryEvent(supabase, storeId, platform, processedEvent)
    }

    // Log activity
    if (integration?.user_id) {
      await supabase
        .from('activity_logs')
        .insert({
          user_id: integration.user_id,
          action: 'webhook_received',
          entity_type: 'channel',
          entity_id: storeId,
          description: `${platform} webhook: ${processedEvent.type}_${processedEvent.action}`,
          metadata: {
            platform,
            event_type: `${processedEvent.type}_${processedEvent.action}`,
            timestamp: new Date().toISOString()
          }
        })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        event_type: `${processedEvent.type}_${processedEvent.action}`,
        platform
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[Webhook] Processing error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Process product events
async function processProductEvent(
  supabase: any, 
  storeId: string, 
  platform: string, 
  event: ProcessedEvent
) {
  const data = event.data as any
  
  if (event.action === 'create' || event.action === 'update') {
    // Upsert product to shopify_products (or platform-specific table)
    await supabase
      .from('shopify_products')
      .upsert({
        store_integration_id: storeId,
        external_id: data.id?.toString() || data.product_id?.toString(),
        title: data.title || data.name,
        price: parseFloat(data.price || data.variants?.[0]?.price || '0'),
        sku: data.sku || data.variants?.[0]?.sku,
        inventory_quantity: data.inventory_quantity || data.stock_quantity || 0,
        status: data.status || 'active',
        image_url: data.image?.src || data.images?.[0]?.src,
        vendor: data.vendor,
        product_type: data.product_type,
        updated_at: new Date().toISOString()
      }, { onConflict: 'store_integration_id,external_id' })
  } else if (event.action === 'delete') {
    await supabase
      .from('shopify_products')
      .delete()
      .eq('store_integration_id', storeId)
      .eq('external_id', data.id?.toString())
  }
}

// Process order events
async function processOrderEvent(
  supabase: any, 
  storeId: string, 
  platform: string, 
  event: ProcessedEvent
) {
  const data = event.data as any
  
  // Store order in orders table
  await supabase
    .from('orders')
    .upsert({
      user_id: (await supabase.from('integrations').select('user_id').eq('id', storeId).single()).data?.user_id,
      order_number: data.order_number || data.name || data.id?.toString(),
      status: data.status || data.financial_status || 'pending',
      total_amount: parseFloat(data.total_price || data.total || '0'),
      currency: data.currency || 'EUR',
      customer_email: data.email || data.customer?.email,
      customer_name: data.customer?.name || `${data.customer?.first_name || ''} ${data.customer?.last_name || ''}`.trim(),
      source: platform,
      metadata: {
        platform,
        store_id: storeId,
        external_id: data.id,
        ...data
      },
      updated_at: new Date().toISOString()
    }, { onConflict: 'order_number,user_id' })
}

// Process inventory events
async function processInventoryEvent(
  supabase: any, 
  storeId: string, 
  platform: string, 
  event: ProcessedEvent
) {
  const data = event.data as any
  
  // Update inventory in shopify_products
  const productId = data.product_id || data.inventory_item_id
  const quantity = data.available || data.quantity || data.stock_quantity
  
  if (productId && quantity !== undefined) {
    await supabase
      .from('shopify_products')
      .update({ 
        inventory_quantity: quantity,
        updated_at: new Date().toISOString()
      })
      .eq('store_integration_id', storeId)
      .eq('external_id', productId.toString())
  }
}
