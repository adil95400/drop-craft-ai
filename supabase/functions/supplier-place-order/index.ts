import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { 
      supplierId, 
      shopOrderId, 
      lineItems, 
      shippingAddress,
      billingAddress,
      customerDetails 
    } = await req.json()
    
    console.log('Placing order with supplier:', supplierId)
    
    // Get supplier credentials
    const { data: credentials, error: credError } = await supabase
      .from('supplier_credentials_vault')
      .select('*')
      .eq('user_id', user.id)
      .eq('supplier_id', supplierId)
      .single()
    
    if (credError || !credentials) {
      throw new Error('Supplier not connected')
    }
    
    if (credentials.connection_status !== 'connected') {
      throw new Error('Supplier connection is not active')
    }
    
    // Calculate totals
    const subtotal = lineItems.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.cost_price), 0
    )
    const shipping = 0 // Calculate based on supplier rules
    const total = subtotal + shipping
    
    let supplierOrderId = null
    let supplierResponse = null
    let orderStatus = 'pending'
    
    // Place order with supplier API
    switch (supplierId) {
      case 'bigbuy': {
        try {
          const response = await fetch('https://api.bigbuy.eu/rest/order', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${credentials.credentials_encrypted.apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              products: lineItems.map((item: any) => ({
                sku: item.sku,
                quantity: item.quantity
              })),
              shippingAddress,
              reference: shopOrderId
            })
          })
          
          if (response.ok) {
            supplierResponse = await response.json()
            supplierOrderId = supplierResponse.orderId
            orderStatus = 'confirmed'
          } else {
            throw new Error(`BigBuy API error: ${response.status}`)
          }
        } catch (error) {
          console.error('BigBuy order failed:', error)
          orderStatus = 'failed'
          supplierResponse = { error: error.message }
        }
        break
      }
      
      default: {
        // Generic order placement (simulate for now)
        supplierOrderId = `${supplierId.toUpperCase()}-${Date.now()}`
        orderStatus = 'confirmed'
        supplierResponse = {
          orderId: supplierOrderId,
          status: 'confirmed',
          estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      }
    }
    
    // Create supplier order record
    const { data: order, error: insertError } = await supabase
      .from('supplier_orders')
      .insert({
        user_id: user.id,
        supplier_id: supplierId,
        shop_order_id: shopOrderId,
        supplier_order_id: supplierOrderId,
        line_items: lineItems,
        shipping_address: shippingAddress,
        billing_address: billingAddress,
        customer_details: customerDetails,
        order_status: orderStatus,
        payment_status: 'pending',
        subtotal,
        shipping_cost: shipping,
        total_cost: total,
        supplier_response: supplierResponse
      })
      .select()
      .single()
    
    if (insertError) throw insertError
    
    // Log order placement
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'supplier_order_placed',
        entity_type: 'order',
        entity_id: order.id,
        description: `Order placed with ${supplierId}`,
        metadata: { 
          shopOrderId, 
          supplierOrderId,
          orderStatus,
          total 
        }
      })
    
    // Update analytics
    await supabase.rpc('increment', {
      table_name: 'supplier_analytics',
      column_name: 'total_orders',
      supplier_id: supplierId,
      user_id: user.id
    }).catch(console.error)
    
    return new Response(
      JSON.stringify({
        success: orderStatus !== 'failed',
        order,
        supplierOrderId,
        orderStatus,
        estimatedDelivery: supplierResponse?.estimatedDelivery
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Order placement error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
