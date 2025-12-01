import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EbayCredentials {
  app_id: string
  cert_id: string
  oauth_token: string
  site_id: string // e.g., '0' for US, '3' for UK, '77' for Germany
}

interface EbayProduct {
  sku: string
  title: string
  description: string
  price: number
  quantity: number
  images: string[]
  category_id: string
  condition: string // NEW, USED_EXCELLENT, etc.
  shipping_policy_id?: string
  return_policy_id?: string
  payment_policy_id?: string
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

    console.log(`eBay API action: ${action}`)

    switch (action) {
      case 'test_connection':
        return await testEbayConnection(credentials)
      
      case 'publish_product':
        return await publishProductToEbay(credentials, product, user.id, supabase)
      
      case 'get_product':
        return await getEbayListing(credentials, product.sku)
      
      case 'update_inventory':
        return await updateEbayInventory(credentials, product.sku, product.quantity)
      
      case 'end_listing':
        return await endEbayListing(credentials, product.sku)
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }
  } catch (error) {
    console.error('eBay API error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function testEbayConnection(credentials: EbayCredentials) {
  console.log('Testing eBay API connection...')
  
  const endpoint = getEbayEndpoint(false) // Production
  
  // Test with getUserProfile to verify credentials
  const response = await fetch(`${endpoint}/sell/account/v1/privilege`, {
    headers: {
      'Authorization': `Bearer ${credentials.oauth_token}`,
      'Content-Type': 'application/json',
      'X-EBAY-C-MARKETPLACE-ID': `EBAY_${getSiteCode(credentials.site_id)}`
    }
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('eBay API test failed:', error)
    throw new Error(`eBay connection test failed: ${response.status}`)
  }

  const data = await response.json()
  console.log('eBay connection successful')

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'eBay API connection successful',
      privileges: data.sellingLimit || {}
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function publishProductToEbay(
  credentials: EbayCredentials,
  product: EbayProduct,
  userId: string,
  supabase: any
) {
  console.log(`Publishing product to eBay: ${product.sku}`)
  
  const endpoint = getEbayEndpoint(false)
  
  // Create inventory item first
  await createEbayInventoryItem(endpoint, credentials, product)
  
  // Create offer
  const offerId = await createEbayOffer(endpoint, credentials, product)
  
  // Publish the offer (create listing)
  const listingId = await publishEbayOffer(endpoint, credentials, offerId)

  // Log to marketplace_event_logs
  await supabase.from('marketplace_event_logs').insert({
    user_id: userId,
    event_type: 'product_published',
    event_source: 'ebay',
    severity: 'info',
    title: 'Product published to eBay',
    message: `Successfully published SKU ${product.sku}`,
    data: { sku: product.sku, listing_id: listingId, offer_id: offerId }
  })

  return new Response(
    JSON.stringify({ 
      success: true, 
      listingId,
      offerId,
      sku: product.sku,
      message: 'Product successfully published to eBay'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function createEbayInventoryItem(
  endpoint: string,
  credentials: EbayCredentials,
  product: EbayProduct
) {
  const body = {
    availability: {
      shipToLocationAvailability: {
        quantity: product.quantity
      }
    },
    condition: product.condition || 'NEW',
    product: {
      title: product.title,
      description: product.description,
      aspects: {
        Brand: ['Generic'],
        Type: ['Product']
      },
      imageUrls: product.images
    }
  }

  const response = await fetch(
    `${endpoint}/sell/inventory/v1/inventory_item/${product.sku}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${credentials.oauth_token}`,
        'Content-Type': 'application/json',
        'Content-Language': 'en-US'
      },
      body: JSON.stringify(body)
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error('eBay inventory item creation failed:', error)
    throw new Error(`Failed to create eBay inventory item: ${response.status}`)
  }

  console.log('eBay inventory item created successfully')
}

async function createEbayOffer(
  endpoint: string,
  credentials: EbayCredentials,
  product: EbayProduct
): Promise<string> {
  const body = {
    sku: product.sku,
    marketplaceId: `EBAY_${getSiteCode(credentials.site_id)}`,
    format: 'FIXED_PRICE',
    availableQuantity: product.quantity,
    categoryId: product.category_id,
    listingDescription: product.description,
    listingPolicies: {
      fulfillmentPolicyId: product.shipping_policy_id,
      paymentPolicyId: product.payment_policy_id,
      returnPolicyId: product.return_policy_id
    },
    pricingSummary: {
      price: {
        currency: 'USD',
        value: product.price.toString()
      }
    }
  }

  const response = await fetch(`${endpoint}/sell/inventory/v1/offer`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${credentials.oauth_token}`,
      'Content-Type': 'application/json',
      'Content-Language': 'en-US'
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('eBay offer creation failed:', error)
    throw new Error(`Failed to create eBay offer: ${response.status}`)
  }

  const data = await response.json()
  console.log('eBay offer created:', data.offerId)
  return data.offerId
}

async function publishEbayOffer(
  endpoint: string,
  credentials: EbayCredentials,
  offerId: string
): Promise<string> {
  const response = await fetch(
    `${endpoint}/sell/inventory/v1/offer/${offerId}/publish`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.oauth_token}`,
        'Content-Type': 'application/json'
      }
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error('eBay offer publication failed:', error)
    throw new Error(`Failed to publish eBay offer: ${response.status}`)
  }

  const data = await response.json()
  console.log('eBay listing published:', data.listingId)
  return data.listingId
}

async function getEbayListing(credentials: EbayCredentials, sku: string) {
  console.log(`Fetching eBay listing: ${sku}`)
  
  const endpoint = getEbayEndpoint(false)
  
  const response = await fetch(
    `${endpoint}/sell/inventory/v1/inventory_item/${sku}`,
    {
      headers: {
        'Authorization': `Bearer ${credentials.oauth_token}`,
        'Content-Type': 'application/json'
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to get eBay listing: ${response.status}`)
  }

  const data = await response.json()
  
  return new Response(
    JSON.stringify({ success: true, listing: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateEbayInventory(
  credentials: EbayCredentials,
  sku: string,
  quantity: number
) {
  console.log(`Updating eBay inventory: ${sku} -> ${quantity}`)
  
  const endpoint = getEbayEndpoint(false)
  
  const body = {
    availability: {
      shipToLocationAvailability: {
        quantity: quantity
      }
    }
  }

  const response = await fetch(
    `${endpoint}/sell/inventory/v1/inventory_item/${sku}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${credentials.oauth_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to update eBay inventory: ${response.status}`)
  }

  return new Response(
    JSON.stringify({ success: true, sku, quantity }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function endEbayListing(credentials: EbayCredentials, sku: string) {
  console.log(`Ending eBay listing: ${sku}`)
  
  const endpoint = getEbayEndpoint(false)
  
  // First get the offer ID
  const offersResponse = await fetch(
    `${endpoint}/sell/inventory/v1/offer?sku=${sku}`,
    {
      headers: {
        'Authorization': `Bearer ${credentials.oauth_token}`,
        'Content-Type': 'application/json'
      }
    }
  )

  if (!offersResponse.ok) {
    throw new Error(`Failed to find eBay offers: ${offersResponse.status}`)
  }

  const offersData = await offersResponse.json()
  const offerId = offersData.offers?.[0]?.offerId

  if (!offerId) {
    throw new Error('No active offer found for SKU')
  }

  // Withdraw the offer
  const response = await fetch(
    `${endpoint}/sell/inventory/v1/offer/${offerId}/withdraw`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.oauth_token}`,
        'Content-Type': 'application/json'
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to end eBay listing: ${response.status}`)
  }

  return new Response(
    JSON.stringify({ success: true, sku, offerId }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function getEbayEndpoint(sandbox: boolean): string {
  return sandbox
    ? 'https://api.sandbox.ebay.com'
    : 'https://api.ebay.com'
}

function getSiteCode(siteId: string): string {
  const codes: Record<string, string> = {
    '0': 'US',
    '3': 'UK',
    '77': 'DE',
    '71': 'FR',
    '101': 'IT',
    '186': 'ES'
  }
  return codes[siteId] || 'US'
}
