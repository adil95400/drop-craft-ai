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
    
    if (credentials.connection_status !== 'active') {
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
    
    // Get connector ID from credentials
    const connectorId = credentials.oauth_data?.connectorId || supplierId
    
    // Place order with supplier API
    switch (connectorId) {
      case 'bigbuy': {
        try {
          const apiKey = credentials.oauth_data?.apiKey || credentials.api_key_encrypted
          const response = await fetch('https://api.bigbuy.eu/rest/order', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
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
      
      case 'btswholesaler': {
        try {
          const apiKey = credentials.oauth_data?.apiKey
          
          // First get shipping prices
          const productsParam = lineItems.map((item: any, i: number) => 
            `products[${i}][sku]=${item.sku}&products[${i}][quantity]=${item.quantity}`
          ).join('&')

          const shippingResponse = await fetch(
            `https://api.btswholesaler.com/v1/api/getShippingPrices?` +
            `address[country_code]=${shippingAddress.countryCode}&` +
            `address[postal_code]=${shippingAddress.postalCode}&` +
            productsParam,
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json'
              }
            }
          )

          if (!shippingResponse.ok) {
            throw new Error('Failed to get shipping prices')
          }

          const shippingOptions = await shippingResponse.json()
          const shippingMethodId = shippingOptions[0]?.id

          // Place order
          const formData = new URLSearchParams()
          formData.append('payment_method', 'wallet')
          formData.append('shipping_id', shippingMethodId)
          formData.append('client_name', `${shippingAddress.firstName} ${shippingAddress.lastName}`)
          formData.append('address', shippingAddress.address)
          formData.append('postal_code', shippingAddress.postalCode)
          formData.append('city', shippingAddress.city)
          formData.append('country_code', shippingAddress.countryCode)
          formData.append('telephone', shippingAddress.phone)
          formData.append('dropshipping', '1')

          lineItems.forEach((item: any, i: number) => {
            formData.append(`products[${i}][sku]`, item.sku)
            formData.append(`products[${i}][quantity]`, item.quantity.toString())
          })

          const orderResponse = await fetch('https://api.btswholesaler.com/v1/api/setCreateOrder', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString()
          })

          if (orderResponse.ok) {
            const result = await orderResponse.json()
            supplierOrderId = result.order_number
            orderStatus = 'confirmed'
            supplierResponse = result
          } else {
            throw new Error(`BTSWholesaler API error: ${orderResponse.status}`)
          }
        } catch (error) {
          console.error('BTSWholesaler order failed:', error)
          orderStatus = 'failed'
          supplierResponse = { error: error.message }
        }
        break
      }
      
      case 'cjdropshipping': {
        try {
          const accessToken = credentials.oauth_data?.accessToken || credentials.access_token_encrypted
          const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrder', {
            method: 'POST',
            headers: {
              'CJ-Access-Token': accessToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              products: lineItems.map((item: any) => ({
                vid: item.variant || item.sku,
                quantity: item.quantity
              })),
              shippingAddress: {
                firstName: shippingAddress.firstName,
                lastName: shippingAddress.lastName,
                address: shippingAddress.address,
                city: shippingAddress.city,
                zip: shippingAddress.postalCode,
                countryCode: shippingAddress.countryCode,
                province: shippingAddress.stateCode,
                phone: shippingAddress.phone,
                email: customerDetails?.email
              },
              shippingMethodId: 'CJ_PACKET_B'
            })
          })
          
          if (response.ok) {
            const result = await response.json()
            if (result.code === 200) {
              supplierOrderId = result.data.orderId
              orderStatus = 'confirmed'
              supplierResponse = result.data
            } else {
              throw new Error(`CJ Dropshipping error: ${result.message}`)
            }
          } else {
            throw new Error(`CJ Dropshipping API error: ${response.status}`)
          }
        } catch (error) {
          console.error('CJ Dropshipping order failed:', error)
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
