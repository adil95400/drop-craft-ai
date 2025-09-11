import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { storeId, action } = await req.json()
    
    if (!storeId) {
      return new Response(
        JSON.stringify({ error: 'Store ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${action} for store ${storeId}`)

    // Get store configuration
    const { data: store, error: storeError } = await supabase
      .from('store_integrations')
      .select('*')
      .eq('id', storeId)
      .single()

    if (storeError || !store) {
      return new Response(
        JSON.stringify({ error: 'Store not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update status to syncing
    await supabase
      .from('store_integrations')
      .update({ 
        connection_status: 'syncing',
        last_sync_at: new Date().toISOString()
      })
      .eq('id', storeId)

    let result = {}

    switch (action) {
      case 'sync_products':
        result = await syncProducts(store, supabase)
        break
      case 'sync_orders':
        result = await syncOrders(store, supabase)
        break
      case 'test_connection':
        result = await testConnection(store)
        break
      default:
        result = await fullSync(store, supabase)
    }

    // Update final status
    await supabase
      .from('store_integrations')
      .update({ 
        connection_status: result.success ? 'connected' : 'error',
        last_sync_at: new Date().toISOString(),
        product_count: result.productCount || store.product_count,
        order_count: result.orderCount || store.order_count
      })
      .eq('id', storeId)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Sync error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function testConnection(store: any) {
  try {
    // Simulate API connection test
    const response = await fetch(`https://${store.store_url}/admin/api/2023-04/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': 'demo-token', // In real app, decrypt from credentials
        'Content-Type': 'application/json'
      }
    })
    
    return {
      success: response.ok,
      message: response.ok ? 'Connection successful' : 'Connection failed',
      statusCode: response.status
    }
  } catch (error) {
    return {
      success: false,
      message: 'Connection test failed',
      error: error.message
    }
  }
}

async function syncProducts(store: any, supabase: any) {
  try {
    console.log(`Syncing products for store ${store.store_name}`)
    
    // Simulate fetching products from Shopify API
    const mockProducts = [
      { id: '1', title: 'Product 1', price: '29.99' },
      { id: '2', title: 'Product 2', price: '49.99' },
      { id: '3', title: 'Product 3', price: '19.99' }
    ]

    // In a real implementation, you would:
    // 1. Fetch products from Shopify API
    // 2. Transform and validate data  
    // 3. Upsert to your products table
    // 4. Handle pagination for large stores
    
    return {
      success: true,
      message: `Synced ${mockProducts.length} products`,
      productCount: mockProducts.length
    }
  } catch (error) {
    return {
      success: false,
      message: 'Product sync failed',
      error: error.message
    }
  }
}

async function syncOrders(store: any, supabase: any) {
  try {
    console.log(`Syncing orders for store ${store.store_name}`)
    
    // Simulate fetching orders from Shopify API
    const mockOrders = [
      { id: '1001', total_price: '79.98' },
      { id: '1002', total_price: '129.99' }
    ]

    return {
      success: true,
      message: `Synced ${mockOrders.length} orders`,
      orderCount: mockOrders.length
    }
  } catch (error) {
    return {
      success: false,
      message: 'Order sync failed', 
      error: error.message
    }
  }
}

async function fullSync(store: any, supabase: any) {
  try {
    const productResult = await syncProducts(store, supabase)
    const orderResult = await syncOrders(store, supabase)
    
    return {
      success: productResult.success && orderResult.success,
      message: 'Full sync completed',
      productCount: productResult.productCount,
      orderCount: orderResult.orderCount,
      details: {
        products: productResult.message,
        orders: orderResult.message
      }
    }
  } catch (error) {
    return {
      success: false,
      message: 'Full sync failed',
      error: error.message
    }
  }
}