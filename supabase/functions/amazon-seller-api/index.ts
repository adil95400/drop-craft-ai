import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AmazonCredentials {
  seller_id: string
  marketplace_id: string
  refresh_token: string
  client_id: string
  client_secret: string
  region: string // e.g., 'us-east-1', 'eu-west-1'
}

interface AmazonProduct {
  sku: string
  title: string
  description: string
  price: number
  quantity: number
  images: string[]
  category: string
  brand?: string
  asin?: string
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

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) throw new Error('Unauthorized')

    const { action, credentials, product } = await req.json()

    console.log(`Amazon SP-API action: ${action}`)

    switch (action) {
      case 'test_connection':
        return await testAmazonConnection(credentials)
      
      case 'publish_product':
        return await publishProductToAmazon(credentials, product, user.id, supabase)
      
      case 'get_product':
        return await getAmazonProduct(credentials, product.sku)
      
      case 'update_inventory':
        return await updateAmazonInventory(credentials, product.sku, product.quantity)
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }
  } catch (error) {
    console.error('Amazon SP-API error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function testAmazonConnection(credentials: AmazonCredentials) {
  console.log('Testing Amazon SP-API connection...')
  
  const accessToken = await getAmazonAccessToken(credentials)
  
  // Test API call to get seller info
  const endpoint = getAmazonEndpoint(credentials.region)
  const path = '/sellers/v1/marketplaceParticipations'
  
  const response = await fetch(`${endpoint}${path}`, {
    headers: {
      'x-amz-access-token': accessToken,
      'x-amz-date': new Date().toISOString(),
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Amazon API test failed:', error)
    throw new Error(`Amazon connection test failed: ${response.status}`)
  }

  const data = await response.json()
  console.log('Amazon connection successful:', data)

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Amazon SP-API connection successful',
      marketplaces: data.payload?.length || 0
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function publishProductToAmazon(
  credentials: AmazonCredentials, 
  product: AmazonProduct,
  userId: string,
  supabase: any
) {
  console.log(`Publishing product to Amazon: ${product.sku}`)
  
  const accessToken = await getAmazonAccessToken(credentials)
  const endpoint = getAmazonEndpoint(credentials.region)
  
  // Create product listing using Listings Items API
  const path = '/listings/2021-08-01/items'
  const body = {
    productType: 'PRODUCT', // Simplified - should map from category
    requirements: 'LISTING',
    attributes: {
      item_name: [{ value: product.title, marketplace_id: credentials.marketplace_id }],
      brand: [{ value: product.brand || 'Generic', marketplace_id: credentials.marketplace_id }],
      description: [{ value: product.description, marketplace_id: credentials.marketplace_id }],
      bullet_point: product.description.split('\n').slice(0, 5).map(point => ({
        value: point,
        marketplace_id: credentials.marketplace_id
      })),
      main_image: product.images[0] ? { 
        value: product.images[0], 
        marketplace_id: credentials.marketplace_id 
      } : undefined,
      other_image: product.images.slice(1, 9).map(img => ({
        value: img,
        marketplace_id: credentials.marketplace_id
      })),
      purchasable_offer: [{
        marketplace_id: credentials.marketplace_id,
        currency: 'USD',
        our_price: [{ schedule: [{ value_with_tax: product.price }] }]
      }],
      fulfillment_availability: [{
        fulfillment_channel_code: 'DEFAULT',
        quantity: product.quantity
      }]
    }
  }

  const response = await fetch(
    `${endpoint}${path}/${credentials.seller_id}/${product.sku}`,
    {
      method: 'PUT',
      headers: {
        'x-amz-access-token': accessToken,
        'x-amz-date': new Date().toISOString(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error('Amazon publish failed:', error)
    throw new Error(`Failed to publish to Amazon: ${response.status}`)
  }

  const result = await response.json()
  console.log('Amazon publish successful:', result)

  // Log to marketplace_event_logs
  await supabase.from('marketplace_event_logs').insert({
    user_id: userId,
    event_type: 'product_published',
    event_source: 'amazon',
    severity: 'info',
    title: 'Product published to Amazon',
    message: `Successfully published SKU ${product.sku}`,
    data: { sku: product.sku, submission_id: result.submissionId }
  })

  return new Response(
    JSON.stringify({ 
      success: true, 
      submissionId: result.submissionId,
      sku: product.sku,
      message: 'Product successfully published to Amazon'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getAmazonProduct(credentials: AmazonCredentials, sku: string) {
  console.log(`Fetching Amazon product: ${sku}`)
  
  const accessToken = await getAmazonAccessToken(credentials)
  const endpoint = getAmazonEndpoint(credentials.region)
  const path = `/listings/2021-08-01/items/${credentials.seller_id}/${sku}`
  
  const response = await fetch(`${endpoint}${path}?marketplaceIds=${credentials.marketplace_id}`, {
    headers: {
      'x-amz-access-token': accessToken,
      'x-amz-date': new Date().toISOString()
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to get Amazon product: ${response.status}`)
  }

  const data = await response.json()
  
  return new Response(
    JSON.stringify({ success: true, product: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateAmazonInventory(
  credentials: AmazonCredentials, 
  sku: string, 
  quantity: number
) {
  console.log(`Updating Amazon inventory: ${sku} -> ${quantity}`)
  
  const accessToken = await getAmazonAccessToken(credentials)
  const endpoint = getAmazonEndpoint(credentials.region)
  const path = `/listings/2021-08-01/items/${credentials.seller_id}/${sku}`
  
  const body = {
    productType: 'PRODUCT',
    patches: [{
      op: 'replace',
      path: '/attributes/fulfillment_availability',
      value: [{
        fulfillment_channel_code: 'DEFAULT',
        quantity: quantity
      }]
    }]
  }

  const response = await fetch(`${endpoint}${path}`, {
    method: 'PATCH',
    headers: {
      'x-amz-access-token': accessToken,
      'x-amz-date': new Date().toISOString(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    throw new Error(`Failed to update Amazon inventory: ${response.status}`)
  }

  return new Response(
    JSON.stringify({ success: true, sku, quantity }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getAmazonAccessToken(credentials: AmazonCredentials): Promise<string> {
  // Exchange refresh token for access token
  const tokenEndpoint = 'https://api.amazon.com/auth/o2/token'
  
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: credentials.refresh_token,
    client_id: credentials.client_id,
    client_secret: credentials.client_secret
  })

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  })

  if (!response.ok) {
    throw new Error('Failed to get Amazon access token')
  }

  const data = await response.json()
  return data.access_token
}

function getAmazonEndpoint(region: string): string {
  const endpoints: Record<string, string> = {
    'us-east-1': 'https://sellingpartnerapi-na.amazon.com',
    'eu-west-1': 'https://sellingpartnerapi-eu.amazon.com',
    'us-west-2': 'https://sellingpartnerapi-fe.amazon.com'
  }
  return endpoints[region] || endpoints['us-east-1']
}
