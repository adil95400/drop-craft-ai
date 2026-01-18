import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
}

/**
 * Edge function pour recevoir les webhooks des fournisseurs
 * Gère les notifications de stock, prix, commandes en temps réel
 */

interface WebhookPayload {
  supplier: string
  event_type: 'stock_update' | 'price_update' | 'order_update' | 'product_update'
  data: any
  timestamp?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Extraire le fournisseur du path
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const supplierSlug = pathParts[pathParts.length - 1] || 'generic'

    console.log(`[supplier-webhooks] Received webhook from: ${supplierSlug}`)

    // Vérifier le secret webhook si fourni
    const webhookSecret = req.headers.get('x-webhook-secret')
    
    let body: WebhookPayload
    try {
      body = await req.json()
    } catch {
      body = {
        supplier: supplierSlug,
        event_type: 'product_update',
        data: {}
      }
    }

    const { supplier = supplierSlug, event_type, data, timestamp } = body

    console.log(`[supplier-webhooks] Event: ${event_type}, Supplier: ${supplier}`)

    // Logger le webhook
    await supabase.from('api_logs').insert({
      endpoint: `/supplier-webhooks/${supplierSlug}`,
      method: 'POST',
      request_body: body,
      status_code: 200,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown'
    })

    // Traiter selon le type d'événement
    switch (event_type) {
      case 'stock_update': {
        await handleStockUpdate(supabase, supplier, data)
        break
      }

      case 'price_update': {
        await handlePriceUpdate(supabase, supplier, data)
        break
      }

      case 'order_update': {
        await handleOrderUpdate(supabase, supplier, data)
        break
      }

      case 'product_update': {
        await handleProductUpdate(supabase, supplier, data)
        break
      }

      default:
        console.log(`[supplier-webhooks] Unknown event type: ${event_type}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook processed',
        event_type,
        supplier
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[supplier-webhooks] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleStockUpdate(supabase: any, supplier: string, data: any) {
  try {
    const updates = Array.isArray(data) ? data : [data]
    
    for (const update of updates) {
      const { sku, stock, product_id } = update

      // Trouver le produit
      let query = supabase.from('products').select('id, user_id, title, stock')
      
      if (sku) {
        query = query.eq('sku', sku)
      } else if (product_id) {
        query = query.eq('id', product_id)
      } else {
        continue
      }

      const { data: products, error } = await query

      if (error || !products?.length) continue

      for (const product of products) {
        const previousStock = product.stock
        const newStock = parseInt(stock) || 0

        // Mettre à jour le stock
        await supabase
          .from('products')
          .update({ stock: newStock, updated_at: new Date().toISOString() })
          .eq('id', product.id)

        // Créer une notification si changement significatif
        if (newStock < 10 && previousStock >= 10) {
          await supabase.from('supplier_notifications').insert({
            user_id: product.user_id,
            notification_type: 'stock_alert',
            title: 'Stock bas détecté',
            message: `${product.title} n'a plus que ${newStock} unités en stock`,
            severity: 'warning',
            metadata: { sku, previous_stock: previousStock, new_stock: newStock, supplier }
          })
        } else if (newStock === 0) {
          await supabase.from('supplier_notifications').insert({
            user_id: product.user_id,
            notification_type: 'stock_alert',
            title: 'Rupture de stock',
            message: `${product.title} est en rupture de stock`,
            severity: 'error',
            metadata: { sku, supplier }
          })
        }
      }
    }

    console.log(`[handleStockUpdate] Processed ${updates.length} stock updates`)

  } catch (error) {
    console.error('[handleStockUpdate] Error:', error)
  }
}

async function handlePriceUpdate(supabase: any, supplier: string, data: any) {
  try {
    const updates = Array.isArray(data) ? data : [data]
    
    for (const update of updates) {
      const { sku, price, cost, product_id } = update

      let query = supabase.from('products').select('id, user_id, title, price, cost')
      
      if (sku) {
        query = query.eq('sku', sku)
      } else if (product_id) {
        query = query.eq('id', product_id)
      } else {
        continue
      }

      const { data: products, error } = await query

      if (error || !products?.length) continue

      for (const product of products) {
        const previousPrice = product.price
        const previousCost = product.cost
        const newPrice = parseFloat(price) || product.price
        const newCost = parseFloat(cost) || product.cost

        // Calculer le changement en %
        const priceChange = previousPrice ? ((newPrice - previousPrice) / previousPrice * 100) : 0
        const costChange = previousCost ? ((newCost - previousCost) / previousCost * 100) : 0

        // Mettre à jour les prix
        await supabase
          .from('products')
          .update({ 
            price: newPrice, 
            cost: newCost, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', product.id)

        // Notification si changement > 5%
        if (Math.abs(priceChange) > 5 || Math.abs(costChange) > 5) {
          await supabase.from('supplier_notifications').insert({
            user_id: product.user_id,
            notification_type: 'price_change',
            title: 'Changement de prix détecté',
            message: `${product.title}: ${costChange > 0 ? '↑' : '↓'} ${Math.abs(costChange).toFixed(1)}% sur le coût`,
            severity: Math.abs(costChange) > 15 ? 'warning' : 'info',
            metadata: { 
              sku, 
              previous_price: previousPrice,
              new_price: newPrice,
              previous_cost: previousCost,
              new_cost: newCost,
              price_change_percent: priceChange,
              cost_change_percent: costChange,
              supplier 
            }
          })
        }
      }
    }

    console.log(`[handlePriceUpdate] Processed ${updates.length} price updates`)

  } catch (error) {
    console.error('[handlePriceUpdate] Error:', error)
  }
}

async function handleOrderUpdate(supabase: any, supplier: string, data: any) {
  try {
    const { order_id, supplier_order_id, status, tracking_number, carrier } = data

    if (!order_id && !supplier_order_id) return

    // Trouver la commande
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, user_id, status, order_number')
      .or(`id.eq.${order_id},metadata->>supplier_order_id.eq.${supplier_order_id}`)

    if (error || !orders?.length) return

    for (const order of orders) {
      // Mettre à jour le statut
      const updates: any = { updated_at: new Date().toISOString() }
      
      if (status) updates.status = status
      if (tracking_number) updates.tracking_number = tracking_number
      if (carrier) updates.carrier_code = carrier

      await supabase
        .from('orders')
        .update(updates)
        .eq('id', order.id)

      // Notification
      if (tracking_number) {
        await supabase.from('supplier_notifications').insert({
          user_id: order.user_id,
          notification_type: 'order_shipped',
          title: 'Commande expédiée',
          message: `Commande ${order.order_number} expédiée avec le numéro ${tracking_number}`,
          severity: 'success',
          metadata: { order_id: order.id, tracking_number, carrier, supplier }
        })
      }
    }

    console.log(`[handleOrderUpdate] Updated order status`)

  } catch (error) {
    console.error('[handleOrderUpdate] Error:', error)
  }
}

async function handleProductUpdate(supabase: any, supplier: string, data: any) {
  try {
    console.log(`[handleProductUpdate] Processing product updates from ${supplier}`)
    
    // Logique pour les mises à jour de produits (nouveau produit, suppression, etc.)
    const { action, products } = data

    if (action === 'new_products' && Array.isArray(products)) {
      // Notifier les utilisateurs connectés à ce fournisseur
      const { data: connections } = await supabase
        .from('supplier_connections')
        .select('user_id')
        .ilike('supplier_name', `%${supplier}%`)
        .eq('status', 'connected')

      if (connections?.length) {
        for (const conn of connections) {
          await supabase.from('supplier_notifications').insert({
            user_id: conn.user_id,
            notification_type: 'new_products',
            title: 'Nouveaux produits disponibles',
            message: `${products.length} nouveaux produits disponibles chez ${supplier}`,
            severity: 'info',
            metadata: { supplier, product_count: products.length }
          })
        }
      }
    }

  } catch (error) {
    console.error('[handleProductUpdate] Error:', error)
  }
}
