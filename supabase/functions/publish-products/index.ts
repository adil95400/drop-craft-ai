import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PublishRequest {
  productIds: string[]
  platforms: ('shopify' | 'amazon' | 'ebay' | 'cdiscount')[]
  config?: Record<string, any>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get auth user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Invalid authorization')
    }

    const { productIds, platforms, config }: PublishRequest = await req.json()
    
    console.log(`Publishing ${productIds.length} products to ${platforms.join(', ')} for user ${user.id}`)

    // Get products to publish
    const { data: products, error: productsError } = await supabase
      .from('imported_products')
      .select('*')
      .in('id', productIds)
      .eq('user_id', user.id)

    if (productsError) throw productsError

    const results: any[] = []

    // Process each platform
    for (const platform of platforms) {
      const platformResults = await publishToPlatform(platform, products, user.id, supabase)
      results.push(...platformResults)
    }

    // Update products status
    await supabase
      .from('imported_products')
      .update({ 
        status: 'published',
        published_at: new Date().toISOString()
      })
      .in('id', productIds)

    // Also add to main products catalog
    const catalogProducts = products.map(product => ({
      user_id: user.id,
      name: product.name,
      description: product.description,
      price: product.price,
      cost_price: product.cost_price,
      sku: product.sku,
      category: product.category,
      image_url: product.image_urls?.[0],
      status: 'active',
      supplier: product.supplier_name
    }))

    const { error: catalogError } = await supabase
      .from('products')
      .insert(catalogProducts)

    if (catalogError) {
      console.error('Error adding to catalog:', catalogError)
    }

    console.log(`Published ${products.length} products to ${platforms.length} platforms`)

    return new Response(JSON.stringify({
      success: true,
      published_count: products.length,
      platforms_count: platforms.length,
      results,
      message: `${products.length} produits publiés sur ${platforms.join(', ')}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Publish error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function publishToPlatform(
  platform: string, 
  products: any[], 
  userId: string, 
  supabase: any
): Promise<any[]> {
  const results: any[] = []

  // Get platform integration
  const { data: integration } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('platform_name', platform)
    .single()

  if (!integration) {
    console.log(`No ${platform} integration found for user ${userId}`)
    return products.map(product => ({
      product_id: product.id,
      platform,
      status: 'failed',
      error: `${platform} integration not configured`
    }))
  }

  switch (platform) {
    case 'shopify':
      return await publishToShopify(products, integration)
    case 'amazon':
      return await publishToAmazon(products, integration)
    case 'ebay':
      return await publishToEbay(products, integration)
    case 'cdiscount':
      return await publishToCdiscount(products, integration)
    default:
      return []
  }
}

async function publishToShopify(products: any[], integration: any): Promise<any[]> {
  const results: any[] = []
  
  for (const product of products) {
    try {
      // In real implementation, this would use Shopify Admin API
      const shopifyProduct = {
        title: product.name,
        body_html: product.description,
        vendor: product.supplier_name,
        product_type: product.category,
        variants: [{
          price: product.price.toString(),
          sku: product.sku,
          inventory_quantity: 100
        }],
        images: product.image_urls?.map((url: string) => ({ src: url })) || []
      }

      // Mock API call - replace with actual Shopify API
      console.log(`Publishing to Shopify:`, shopifyProduct.title)
      
      results.push({
        product_id: product.id,
        platform: 'shopify',
        status: 'success',
        external_id: `shopify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        published_at: new Date().toISOString()
      })

    } catch (error) {
      results.push({
        product_id: product.id,
        platform: 'shopify',
        status: 'failed',
        error: error.message
      })
    }
  }

  return results
}

async function publishToAmazon(products: any[], integration: any): Promise<any[]> {
  const results: any[] = []
  
  for (const product of products) {
    try {
      // Mock Amazon MWS/SP-API integration
      console.log(`Publishing to Amazon:`, product.name)
      
      results.push({
        product_id: product.id,
        platform: 'amazon',
        status: 'success',
        external_id: `amazon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        published_at: new Date().toISOString()
      })

    } catch (error) {
      results.push({
        product_id: product.id,
        platform: 'amazon',
        status: 'failed',
        error: error.message
      })
    }
  }

  return results
}

async function publishToEbay(products: any[], integration: any): Promise<any[]> {
  const results: any[] = []
  
  for (const product of products) {
    try {
      // Mock eBay API integration
      console.log(`Publishing to eBay:`, product.name)
      
      results.push({
        product_id: product.id,
        platform: 'ebay',
        status: 'success',
        external_id: `ebay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        published_at: new Date().toISOString()
      })

    } catch (error) {
      results.push({
        product_id: product.id,
        platform: 'ebay',
        status: 'failed',
        error: error.message
      })
    }
  }

  return results
}

async function publishToCdiscount(products: any[], integration: any): Promise<any[]> {
  const results: any[] = []
  
  for (const product of products) {
    try {
      // Mock Cdiscount API integration
      console.log(`Publishing to Cdiscount:`, product.name)
      
      results.push({
        product_id: product.id,
        platform: 'cdiscount',
        status: 'success',
        external_id: `cdiscount_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        published_at: new Date().toISOString()
      })

    } catch (error) {
      results.push({
        product_id: product.id,
        platform: 'cdiscount',
        status: 'failed',
        error: error.message
      })
    }
  }

  return results
}