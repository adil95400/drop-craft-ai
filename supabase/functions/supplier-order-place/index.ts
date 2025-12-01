import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Real supplier order placement
 * Supports: CJ Dropshipping, BigBuy, BTS Wholesaler, Matterhorn, VidaXL
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { orderId, userId, supplierId, items, shippingAddress } = await req.json()

    if (!orderId || !userId || !supplierId || !items || !shippingAddress) {
      throw new Error('Missing required parameters')
    }

    console.log(`Placing order with supplier ${supplierId} for order ${orderId}`)

    // Get supplier credentials
    const { data: credentials, error: credError } = await supabaseClient
      .from('supplier_credentials_vault')
      .select('supplier_slug, oauth_data')
      .eq('user_id', userId)
      .eq('supplier_id', supplierId)
      .eq('connection_status', 'connected')
      .single()

    if (credError || !credentials) {
      throw new Error('Supplier credentials not found or not connected')
    }

    let orderResult: any = null

    // Place order with real supplier API
    switch (credentials.supplier_slug) {
      case 'cj-dropshipping':
        orderResult = await placeCJOrder(credentials.oauth_data, items, shippingAddress)
        break
      
      case 'bigbuy':
        orderResult = await placeBigBuyOrder(credentials.oauth_data, items, shippingAddress)
        break
      
      case 'btswholesaler':
        orderResult = await placeBTSOrder(credentials.oauth_data, items, shippingAddress)
        break
      
      case 'matterhorn':
        orderResult = await placeMatterhornOrder(credentials.oauth_data, items, shippingAddress)
        break
      
      case 'vidaxl':
        orderResult = await placeVidaXLOrder(credentials.oauth_data, items, shippingAddress)
        break
      
      default:
        throw new Error(`Unsupported supplier: ${credentials.supplier_slug}`)
    }

    // Update fulfillment_shipments with supplier order info
    const { error: updateError } = await supabaseClient
      .from('fulfillment_shipments')
      .update({
        supplier_order_id: orderResult.supplierOrderId,
        supplier_order_status: orderResult.status,
        tracking_number: orderResult.trackingNumber || null,
        carrier: orderResult.carrier || null,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId)
      .eq('user_id', userId)

    if (updateError) {
      console.error('Error updating shipment:', updateError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        supplierOrderId: orderResult.supplierOrderId,
        status: orderResult.status,
        trackingNumber: orderResult.trackingNumber,
        estimatedDelivery: orderResult.estimatedDelivery
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error placing supplier order:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

async function placeCJOrder(credentials: any, items: any[], shippingAddress: any) {
  const accessToken = credentials.accessToken
  if (!accessToken) throw new Error('CJ access token not found')

  const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrder', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CJ-Access-Token': accessToken
    },
    body: JSON.stringify({
      orderNumber: `CJ-${Date.now()}`,
      shippingZip: shippingAddress.zipCode,
      shippingCountry: shippingAddress.country,
      shippingCountryCode: shippingAddress.countryCode,
      shippingProvince: shippingAddress.state,
      shippingCity: shippingAddress.city,
      shippingAddress: shippingAddress.address1,
      shippingAddress2: shippingAddress.address2 || '',
      shippingCustomerName: shippingAddress.name,
      shippingPhone: shippingAddress.phone,
      products: items.map(item => ({
        vid: item.supplierProductId,
        quantity: item.quantity,
        shippingMethodId: item.shippingMethodId || 'CJ_PACKET_F'
      }))
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`CJ API error: ${error}`)
  }

  const data = await response.json()
  
  return {
    supplierOrderId: data.data?.orderId || data.data?.orderNumber,
    status: 'pending',
    trackingNumber: null,
    carrier: null,
    estimatedDelivery: null
  }
}

async function placeBigBuyOrder(credentials: any, items: any[], shippingAddress: any) {
  const apiKey = credentials.apiKey
  if (!apiKey) throw new Error('BigBuy API key not found')

  const response = await fetch('https://api.bigbuy.eu/rest/order', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      shippingAddress: {
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        address: shippingAddress.address1,
        postcode: shippingAddress.zipCode,
        town: shippingAddress.city,
        country: shippingAddress.countryCode,
        phone: shippingAddress.phone,
        email: shippingAddress.email
      },
      products: items.map(item => ({
        reference: item.supplierSku,
        quantity: item.quantity
      })),
      carriers: [{ id: 1 }],
      language: 'en',
      paymentMethod: 'api',
      internalReference: `BB-${Date.now()}`
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`BigBuy API error: ${error}`)
  }

  const data = await response.json()
  
  return {
    supplierOrderId: data.id?.toString(),
    status: 'pending',
    trackingNumber: null,
    carrier: null,
    estimatedDelivery: null
  }
}

async function placeBTSOrder(credentials: any, items: any[], shippingAddress: any) {
  const token = credentials.token
  if (!token) throw new Error('BTS token not found')

  const response = await fetch('https://api.btswholesaler.com/v2.0/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      delivery_address: {
        name: shippingAddress.name,
        address_line_1: shippingAddress.address1,
        address_line_2: shippingAddress.address2 || '',
        city: shippingAddress.city,
        postal_code: shippingAddress.zipCode,
        country_code: shippingAddress.countryCode,
        phone: shippingAddress.phone
      },
      items: items.map(item => ({
        product_id: item.supplierProductId,
        quantity: item.quantity
      }))
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`BTS API error: ${error}`)
  }

  const data = await response.json()
  
  return {
    supplierOrderId: data.order_id?.toString(),
    status: 'pending',
    trackingNumber: data.tracking_number || null,
    carrier: data.carrier || null,
    estimatedDelivery: data.estimated_delivery || null
  }
}

async function placeMatterhornOrder(credentials: any, items: any[], shippingAddress: any) {
  const apiKey = credentials.apiKey
  if (!apiKey) throw new Error('Matterhorn API key not found')

  const response = await fetch('https://api.matterhorn.ch/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      shipping: {
        name: shippingAddress.name,
        street: shippingAddress.address1,
        city: shippingAddress.city,
        zip: shippingAddress.zipCode,
        country: shippingAddress.countryCode,
        phone: shippingAddress.phone
      },
      items: items.map(item => ({
        sku: item.supplierSku,
        quantity: item.quantity
      }))
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Matterhorn API error: ${error}`)
  }

  const data = await response.json()
  
  return {
    supplierOrderId: data.orderId?.toString(),
    status: 'pending',
    trackingNumber: null,
    carrier: null,
    estimatedDelivery: null
  }
}

async function placeVidaXLOrder(credentials: any, items: any[], shippingAddress: any) {
  const apiKey = credentials.apiKey
  if (!apiKey) throw new Error('VidaXL API key not found')

  const response = await fetch('https://api.vidaxl.com/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      deliveryAddress: {
        name: shippingAddress.name,
        street: shippingAddress.address1,
        city: shippingAddress.city,
        postalCode: shippingAddress.zipCode,
        countryCode: shippingAddress.countryCode,
        phone: shippingAddress.phone
      },
      orderLines: items.map(item => ({
        sku: item.supplierSku,
        quantity: item.quantity
      }))
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`VidaXL API error: ${error}`)
  }

  const data = await response.json()
  
  return {
    supplierOrderId: data.orderNumber?.toString(),
    status: 'pending',
    trackingNumber: null,
    carrier: null,
    estimatedDelivery: null
  }
}
