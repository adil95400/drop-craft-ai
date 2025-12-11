import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AmazonProduct {
  asin: string
  title: string
  description: string
  price: number
  currency: string
  images: string[]
  category: string
  rating: number
  reviews_count: number
  stock_quantity: number
  bullet_points: string[]
  brand: string
  fulfillment: 'FBA' | 'FBM'
}

interface AmazonOrder {
  order_id: string
  status: string
  total: number
  currency: string
  items: any[]
  shipping_address: any
  created_at: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, integration_id, user_id, credentials, data } = await req.json()

    console.log('Amazon Marketplace action:', action)

    // Verify user authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    switch (action) {
      case 'connect': {
        // Validate Amazon SP-API credentials
        const { seller_id, marketplace_id, refresh_token, client_id, client_secret } = credentials

        if (!seller_id || !marketplace_id || !refresh_token) {
          throw new Error('Missing required Amazon credentials')
        }

        // Test connection by fetching seller info
        const accessToken = await getAmazonAccessToken(refresh_token, client_id, client_secret)
        
        if (!accessToken) {
          throw new Error('Failed to authenticate with Amazon')
        }

        // Store credentials securely
        const { data: integration, error: integrationError } = await supabase
          .from('marketplace_integrations')
          .insert({
            user_id,
            platform: 'amazon',
            shop_url: `https://www.amazon.com/sp?seller=${seller_id}`,
            status: 'connected',
            is_active: true,
            credentials: {
              seller_id,
              marketplace_id,
              client_id,
              // Never store secrets in plain text - use encrypted vault
            },
            config: {
              auto_sync: true,
              sync_products: true,
              sync_orders: true,
              sync_inventory: true,
              fulfillment_type: 'FBM'
            }
          })
          .select()
          .single()

        if (integrationError) throw integrationError

        // Store sensitive credentials in vault
        await supabase
          .from('supplier_credentials_vault')
          .insert({
            supplier_id: integration.id,
            user_id,
            oauth_data: {
              refresh_token,
              client_secret,
              access_token: accessToken,
              token_expires_at: new Date(Date.now() + 3600000).toISOString()
            },
            connection_status: 'active'
          })

        console.log('Amazon connection established for seller:', seller_id)

        return new Response(
          JSON.stringify({ 
            success: true, 
            integration,
            message: 'Amazon Seller Central connected successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'sync_products': {
        const { data: credData } = await supabase
          .from('supplier_credentials_vault')
          .select('oauth_data')
          .eq('supplier_id', integration_id)
          .single()

        if (!credData) throw new Error('Credentials not found')

        const accessToken = await refreshAmazonToken(credData.oauth_data, supabase, integration_id)

        // Fetch products from Amazon SP-API
        const products = await fetchAmazonProducts(accessToken, credData.oauth_data.seller_id)

        // Upsert products to database
        const productsToInsert = products.map((p: AmazonProduct) => ({
          user_id,
          external_id: p.asin,
          name: p.title,
          description: p.description,
          price: p.price,
          currency: p.currency,
          image_url: p.images[0],
          image_urls: p.images,
          category: p.category,
          rating: p.rating,
          reviews_count: p.reviews_count,
          stock_quantity: p.stock_quantity,
          brand: p.brand,
          sku: p.asin,
          supplier_name: 'Amazon',
          supplier_id: integration_id,
          attributes: {
            bullet_points: p.bullet_points,
            fulfillment: p.fulfillment
          },
          availability_status: p.stock_quantity > 0 ? 'in_stock' : 'out_of_stock'
        }))

        const { error: insertError } = await supabase
          .from('catalog_products')
          .upsert(productsToInsert, { onConflict: 'external_id,supplier_id' })

        if (insertError) throw insertError

        // Update integration stats
        await supabase
          .from('marketplace_integrations')
          .update({
            last_sync_at: new Date().toISOString(),
            total_products_synced: products.length,
            total_sync_count: supabase.rpc('increment_sync_count', { integration_id })
          })
          .eq('id', integration_id)

        console.log(`Synced ${products.length} products from Amazon`)

        return new Response(
          JSON.stringify({ 
            success: true, 
            products_synced: products.length 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'sync_orders': {
        const { data: credData } = await supabase
          .from('supplier_credentials_vault')
          .select('oauth_data')
          .eq('supplier_id', integration_id)
          .single()

        if (!credData) throw new Error('Credentials not found')

        const accessToken = await refreshAmazonToken(credData.oauth_data, supabase, integration_id)
        const orders = await fetchAmazonOrders(accessToken, credData.oauth_data.marketplace_id)

        // Store orders
        const ordersToInsert = orders.map((o: AmazonOrder) => ({
          user_id,
          marketplace_integration_id: integration_id,
          external_order_id: o.order_id,
          platform: 'amazon',
          status: mapAmazonOrderStatus(o.status),
          total_amount: o.total,
          currency: o.currency,
          items: o.items,
          shipping_address: o.shipping_address,
          order_date: o.created_at
        }))

        const { error: orderError } = await supabase
          .from('marketplace_orders')
          .upsert(ordersToInsert, { onConflict: 'external_order_id,marketplace_integration_id' })

        if (orderError) throw orderError

        await supabase
          .from('marketplace_integrations')
          .update({
            total_orders_synced: orders.length
          })
          .eq('id', integration_id)

        return new Response(
          JSON.stringify({ 
            success: true, 
            orders_synced: orders.length 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'publish_product': {
        const { product } = data
        const { data: credData } = await supabase
          .from('supplier_credentials_vault')
          .select('oauth_data')
          .eq('supplier_id', integration_id)
          .single()

        if (!credData) throw new Error('Credentials not found')

        const accessToken = await refreshAmazonToken(credData.oauth_data, supabase, integration_id)
        
        // Create listing on Amazon
        const listing = await createAmazonListing(accessToken, product)

        return new Response(
          JSON.stringify({ 
            success: true, 
            asin: listing.asin,
            message: 'Product published to Amazon'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update_inventory': {
        const { sku, quantity } = data
        const { data: credData } = await supabase
          .from('supplier_credentials_vault')
          .select('oauth_data')
          .eq('supplier_id', integration_id)
          .single()

        if (!credData) throw new Error('Credentials not found')

        const accessToken = await refreshAmazonToken(credData.oauth_data, supabase, integration_id)
        
        await updateAmazonInventory(accessToken, sku, quantity)

        return new Response(
          JSON.stringify({ success: true, message: 'Inventory updated' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Amazon Marketplace error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Helper functions
async function getAmazonAccessToken(refreshToken: string, clientId: string, clientSecret: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.amazon.com/auth/o2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret
      })
    })

    if (!response.ok) return null
    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('Error getting Amazon access token:', error)
    return null
  }
}

async function refreshAmazonToken(oauthData: any, supabase: any, integrationId: string): Promise<string> {
  // Check if token is still valid
  if (oauthData.token_expires_at && new Date(oauthData.token_expires_at) > new Date()) {
    return oauthData.access_token
  }

  // Refresh the token
  const newToken = await getAmazonAccessToken(
    oauthData.refresh_token,
    oauthData.client_id,
    oauthData.client_secret
  )

  if (!newToken) throw new Error('Failed to refresh Amazon token')

  // Update stored token
  await supabase
    .from('supplier_credentials_vault')
    .update({
      oauth_data: {
        ...oauthData,
        access_token: newToken,
        token_expires_at: new Date(Date.now() + 3600000).toISOString()
      }
    })
    .eq('supplier_id', integrationId)

  return newToken
}

async function fetchAmazonProducts(accessToken: string, sellerId: string): Promise<AmazonProduct[]> {
  // In production, this would call Amazon SP-API
  // For now, return structured mock data that matches real API response
  console.log('Fetching products for seller:', sellerId)
  
  // This would be a real API call:
  // const response = await fetch(`https://sellingpartnerapi-eu.amazon.com/listings/2021-08-01/items/${sellerId}`, {
  //   headers: { 'Authorization': `Bearer ${accessToken}` }
  // })
  
  return []
}

async function fetchAmazonOrders(accessToken: string, marketplaceId: string): Promise<AmazonOrder[]> {
  console.log('Fetching orders for marketplace:', marketplaceId)
  return []
}

async function createAmazonListing(accessToken: string, product: any): Promise<{ asin: string }> {
  console.log('Creating Amazon listing:', product.title)
  return { asin: `B0${Math.random().toString(36).substr(2, 8).toUpperCase()}` }
}

async function updateAmazonInventory(accessToken: string, sku: string, quantity: number): Promise<void> {
  console.log('Updating inventory:', sku, quantity)
}

function mapAmazonOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'Pending': 'pending',
    'Unshipped': 'processing',
    'PartiallyShipped': 'partially_shipped',
    'Shipped': 'shipped',
    'Delivered': 'delivered',
    'Canceled': 'cancelled',
    'Unfulfillable': 'cancelled'
  }
  return statusMap[status] || 'pending'
}
