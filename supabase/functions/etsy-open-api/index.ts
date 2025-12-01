import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EtsyCredentials {
  shop_id: string
  oauth_token: string
  api_key: string
}

interface EtsyProduct {
  sku: string
  title: string
  description: string
  price: number
  quantity: number
  images: string[]
  taxonomy_id: number // Etsy category
  who_made: 'i_did' | 'someone_else' | 'collective'
  when_made: string // e.g., '2020_2023', 'made_to_order'
  is_supply: boolean
  tags: string[]
  materials: string[]
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

    console.log(`Etsy API action: ${action}`)

    switch (action) {
      case 'test_connection':
        return await testEtsyConnection(credentials)
      
      case 'publish_product':
        return await publishProductToEtsy(credentials, product, user.id, supabase)
      
      case 'get_product':
        return await getEtsyListing(credentials, product.listing_id)
      
      case 'update_inventory':
        return await updateEtsyInventory(credentials, product.listing_id, product.quantity)
      
      case 'deactivate_listing':
        return await deactivateEtsyListing(credentials, product.listing_id)
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }
  } catch (error) {
    console.error('Etsy API error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function testEtsyConnection(credentials: EtsyCredentials) {
  console.log('Testing Etsy API connection...')
  
  const endpoint = 'https://openapi.etsy.com/v3'
  
  // Test with getShop to verify credentials
  const response = await fetch(
    `${endpoint}/application/shops/${credentials.shop_id}`,
    {
      headers: {
        'x-api-key': credentials.api_key,
        'Authorization': `Bearer ${credentials.oauth_token}`,
        'Content-Type': 'application/json'
      }
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error('Etsy API test failed:', error)
    throw new Error(`Etsy connection test failed: ${response.status}`)
  }

  const data = await response.json()
  console.log('Etsy connection successful:', data.shop_name)

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Etsy API connection successful',
      shopName: data.shop_name,
      shopId: credentials.shop_id
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function publishProductToEtsy(
  credentials: EtsyCredentials,
  product: EtsyProduct,
  userId: string,
  supabase: any
) {
  console.log(`Publishing product to Etsy: ${product.sku}`)
  
  const endpoint = 'https://openapi.etsy.com/v3'
  
  // Create draft listing
  const body = {
    quantity: product.quantity,
    title: product.title,
    description: product.description,
    price: product.price,
    who_made: product.who_made || 'i_did',
    when_made: product.when_made || '2020_2023',
    taxonomy_id: product.taxonomy_id,
    shipping_profile_id: null, // User must set up shipping profiles
    return_policy_id: null, // User must set up return policies
    production_partner_ids: [],
    image_ids: [],
    is_supply: product.is_supply || false,
    is_customizable: false,
    should_auto_renew: true,
    is_taxable: true,
    type: 'physical'
  }

  const response = await fetch(
    `${endpoint}/application/shops/${credentials.shop_id}/listings`,
    {
      method: 'POST',
      headers: {
        'x-api-key': credentials.api_key,
        'Authorization': `Bearer ${credentials.oauth_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error('Etsy listing creation failed:', error)
    throw new Error(`Failed to create Etsy listing: ${response.status}`)
  }

  const listing = await response.json()
  const listingId = listing.listing_id
  console.log('Etsy listing created:', listingId)

  // Upload images
  for (const imageUrl of product.images.slice(0, 10)) { // Etsy allows max 10 images
    await uploadEtsyImage(endpoint, credentials, listingId, imageUrl)
  }

  // Add tags
  if (product.tags && product.tags.length > 0) {
    await updateEtsyTags(endpoint, credentials, listingId, product.tags)
  }

  // Log to marketplace_event_logs
  await supabase.from('marketplace_event_logs').insert({
    user_id: userId,
    event_type: 'product_published',
    event_source: 'etsy',
    severity: 'info',
    title: 'Product published to Etsy',
    message: `Successfully published SKU ${product.sku}`,
    data: { sku: product.sku, listing_id: listingId }
  })

  return new Response(
    JSON.stringify({ 
      success: true, 
      listingId,
      sku: product.sku,
      listingUrl: `https://www.etsy.com/listing/${listingId}`,
      message: 'Product successfully published to Etsy'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function uploadEtsyImage(
  endpoint: string,
  credentials: EtsyCredentials,
  listingId: number,
  imageUrl: string
) {
  // Download image
  const imageResponse = await fetch(imageUrl)
  const imageBlob = await imageResponse.blob()
  const imageBuffer = await imageBlob.arrayBuffer()

  // Create form data
  const formData = new FormData()
  formData.append('image', new Blob([imageBuffer]), 'image.jpg')

  const response = await fetch(
    `${endpoint}/application/shops/${credentials.shop_id}/listings/${listingId}/images`,
    {
      method: 'POST',
      headers: {
        'x-api-key': credentials.api_key,
        'Authorization': `Bearer ${credentials.oauth_token}`
      },
      body: formData
    }
  )

  if (!response.ok) {
    console.error('Etsy image upload failed:', await response.text())
    // Don't throw - continue with other images
  } else {
    console.log('Etsy image uploaded successfully')
  }
}

async function updateEtsyTags(
  endpoint: string,
  credentials: EtsyCredentials,
  listingId: number,
  tags: string[]
) {
  const response = await fetch(
    `${endpoint}/application/shops/${credentials.shop_id}/listings/${listingId}/properties`,
    {
      method: 'PUT',
      headers: {
        'x-api-key': credentials.api_key,
        'Authorization': `Bearer ${credentials.oauth_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tags: tags.slice(0, 13) }) // Etsy allows max 13 tags
    }
  )

  if (!response.ok) {
    console.error('Etsy tags update failed:', await response.text())
  }
}

async function getEtsyListing(credentials: EtsyCredentials, listingId: number) {
  console.log(`Fetching Etsy listing: ${listingId}`)
  
  const endpoint = 'https://openapi.etsy.com/v3'
  
  const response = await fetch(
    `${endpoint}/application/listings/${listingId}`,
    {
      headers: {
        'x-api-key': credentials.api_key,
        'Authorization': `Bearer ${credentials.oauth_token}`
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to get Etsy listing: ${response.status}`)
  }

  const data = await response.json()
  
  return new Response(
    JSON.stringify({ success: true, listing: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateEtsyInventory(
  credentials: EtsyCredentials,
  listingId: number,
  quantity: number
) {
  console.log(`Updating Etsy inventory: ${listingId} -> ${quantity}`)
  
  const endpoint = 'https://openapi.etsy.com/v3'
  
  // Get products for the listing
  const productsResponse = await fetch(
    `${endpoint}/application/listings/${listingId}/inventory`,
    {
      headers: {
        'x-api-key': credentials.api_key,
        'Authorization': `Bearer ${credentials.oauth_token}`
      }
    }
  )

  if (!productsResponse.ok) {
    throw new Error(`Failed to get Etsy inventory: ${productsResponse.status}`)
  }

  const productsData = await productsResponse.json()
  const products = productsData.products

  // Update quantity for each product
  const updatedProducts = products.map((p: any) => ({
    ...p,
    offerings: p.offerings.map((o: any) => ({
      ...o,
      quantity: quantity
    }))
  }))

  const response = await fetch(
    `${endpoint}/application/listings/${listingId}/inventory`,
    {
      method: 'PUT',
      headers: {
        'x-api-key': credentials.api_key,
        'Authorization': `Bearer ${credentials.oauth_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ products: updatedProducts })
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to update Etsy inventory: ${response.status}`)
  }

  return new Response(
    JSON.stringify({ success: true, listingId, quantity }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function deactivateEtsyListing(credentials: EtsyCredentials, listingId: number) {
  console.log(`Deactivating Etsy listing: ${listingId}`)
  
  const endpoint = 'https://openapi.etsy.com/v3'
  
  const response = await fetch(
    `${endpoint}/application/listings/${listingId}`,
    {
      method: 'DELETE',
      headers: {
        'x-api-key': credentials.api_key,
        'Authorization': `Bearer ${credentials.oauth_token}`
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to deactivate Etsy listing: ${response.status}`)
  }

  return new Response(
    JSON.stringify({ success: true, listingId }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
