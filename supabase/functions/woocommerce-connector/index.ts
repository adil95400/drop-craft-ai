import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface WooCommerceProduct {
  id: number
  name: string
  slug: string
  price: string
  regular_price: string
  sale_price: string
  description: string
  short_description: string
  sku: string
  stock_quantity: number
  stock_status: string
  categories: Array<{ id: number; name: string }>
  images: Array<{ src: string; alt: string }>
  attributes: any[]
  date_created: string
}

interface WooCommerceOrder {
  id: number
  number: string
  status: string
  total: string
  currency: string
  billing: {
    first_name: string
    last_name: string
    email: string
    phone: string
    address_1: string
    city: string
    postcode: string
    country: string
  }
  line_items: Array<{
    product_id: number
    name: string
    quantity: number
    total: string
  }>
  date_created: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Authorization required')
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) throw new Error('Unauthorized')

    const { action, store_url, consumer_key, consumer_secret, product_id, order_id, product_data } = await req.json()
    console.log(`[WOOCOMMERCE] Action: ${action}, User: ${user.id}`)

    // Build WooCommerce API base URL
    const buildApiUrl = (endpoint: string) => {
      const baseUrl = store_url.replace(/\/$/, '')
      return `${baseUrl}/wp-json/wc/v3/${endpoint}`
    }

    // WooCommerce API auth header
    const authString = btoa(`${consumer_key}:${consumer_secret}`)
    const wooHeaders = {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/json'
    }

    // Action: test_connection
    if (action === 'test_connection') {
      console.log('[WOOCOMMERCE] Testing connection to:', store_url)
      
      const response = await fetch(buildApiUrl('system_status'), {
        headers: wooHeaders
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Connection failed: ${response.status} - ${error}`)
      }

      const status = await response.json()
      
      return new Response(JSON.stringify({
        success: true,
        store_name: status.settings?.store_name || store_url,
        wc_version: status.environment?.version,
        currency: status.settings?.currency
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Action: get_products
    if (action === 'get_products') {
      const page = 1
      const perPage = 100
      
      const response = await fetch(buildApiUrl(`products?page=${page}&per_page=${perPage}`), {
        headers: wooHeaders
      })

      if (!response.ok) throw new Error(`Failed to fetch products: ${response.status}`)

      const products: WooCommerceProduct[] = await response.json()
      
      return new Response(JSON.stringify({
        success: true,
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          price: parseFloat(p.price) || 0,
          regular_price: parseFloat(p.regular_price) || 0,
          sale_price: parseFloat(p.sale_price) || 0,
          sku: p.sku,
          stock_quantity: p.stock_quantity,
          stock_status: p.stock_status,
          description: p.short_description || p.description,
          images: p.images.map(i => i.src),
          categories: p.categories.map(c => c.name)
        })),
        total: products.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Action: get_orders
    if (action === 'get_orders') {
      const response = await fetch(buildApiUrl('orders?per_page=50'), {
        headers: wooHeaders
      })

      if (!response.ok) throw new Error(`Failed to fetch orders: ${response.status}`)

      const orders: WooCommerceOrder[] = await response.json()
      
      // Sync orders to database
      for (const order of orders) {
        const { error } = await supabase.from('orders').upsert({
          user_id: user.id,
          order_number: order.number,
          status: order.status,
          total_amount: parseFloat(order.total),
          currency: order.currency,
          customer_id: null,
          billing_address: order.billing,
          created_at: order.date_created
        }, { onConflict: 'order_number' })
        
        if (error) console.error('[WOOCOMMERCE] Order sync error:', error)
      }
      
      return new Response(JSON.stringify({
        success: true,
        orders: orders.map(o => ({
          id: o.id,
          number: o.number,
          status: o.status,
          total: parseFloat(o.total),
          currency: o.currency,
          customer: `${o.billing.first_name} ${o.billing.last_name}`,
          email: o.billing.email,
          items_count: o.line_items.length,
          date: o.date_created
        })),
        total: orders.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Action: create_product
    if (action === 'create_product' && product_data) {
      const response = await fetch(buildApiUrl('products'), {
        method: 'POST',
        headers: wooHeaders,
        body: JSON.stringify({
          name: product_data.name,
          type: 'simple',
          regular_price: String(product_data.price),
          description: product_data.description,
          short_description: product_data.short_description,
          sku: product_data.sku,
          stock_quantity: product_data.stock_quantity,
          manage_stock: true,
          images: product_data.images?.map((url: string) => ({ src: url })) || []
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to create product: ${error}`)
      }

      const created: WooCommerceProduct = await response.json()
      
      return new Response(JSON.stringify({
        success: true,
        product: {
          id: created.id,
          name: created.name,
          sku: created.sku
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Action: update_stock
    if (action === 'update_stock' && product_id) {
      const { stock_quantity: newStock } = await req.json()
      
      const response = await fetch(buildApiUrl(`products/${product_id}`), {
        method: 'PUT',
        headers: wooHeaders,
        body: JSON.stringify({
          stock_quantity: newStock,
          manage_stock: true
        })
      })

      if (!response.ok) throw new Error(`Failed to update stock: ${response.status}`)

      return new Response(JSON.stringify({
        success: true,
        product_id,
        new_stock: newStock
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Action: sync_inventory
    if (action === 'sync_inventory') {
      // Get all products from WooCommerce
      const response = await fetch(buildApiUrl('products?per_page=100'), {
        headers: wooHeaders
      })

      if (!response.ok) throw new Error(`Failed to fetch products: ${response.status}`)
      
      const products: WooCommerceProduct[] = await response.json()
      let synced = 0
      
      for (const product of products) {
        const { error } = await supabase.from('products').upsert({
          user_id: user.id,
          name: product.name,
          sku: product.sku || `woo-${product.id}`,
          price: parseFloat(product.price) || 0,
          stock: product.stock_quantity || 0,
          description: product.short_description || product.description,
          images: product.images.map(i => i.src),
          source_platform: 'woocommerce',
          shopify_product_id: null,
          external_id: String(product.id)
        }, { onConflict: 'sku' })

        if (!error) synced++
      }

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'woocommerce_sync',
        description: `Synchronized ${synced} products from WooCommerce`,
        entity_type: 'integration',
        metadata: { store_url, products_synced: synced }
      })

      return new Response(JSON.stringify({
        success: true,
        synced,
        total: products.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    throw new Error('Invalid action. Use: test_connection, get_products, get_orders, create_product, update_stock, sync_inventory')

  } catch (error) {
    console.error('[WOOCOMMERCE] Error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
