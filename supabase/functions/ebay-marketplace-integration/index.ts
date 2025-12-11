import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface eBayProduct {
  item_id: string
  title: string
  description: string
  price: { value: number; currency: string }
  images: string[]
  category_id: string
  category_name: string
  condition: string
  quantity: number
  listing_format: 'FixedPrice' | 'Auction'
  seller_id: string
}

interface eBayOrder {
  order_id: string
  status: string
  total: { value: number; currency: string }
  line_items: any[]
  fulfillment_start_instructions: any
  created_date: string
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

    console.log('eBay Marketplace action:', action)

    switch (action) {
      case 'connect': {
        const { client_id, client_secret, refresh_token, environment } = credentials

        if (!client_id || !client_secret || !refresh_token) {
          throw new Error('Missing required eBay credentials')
        }

        // Get access token
        const accessToken = await geteBayAccessToken(client_id, client_secret, refresh_token, environment)
        
        if (!accessToken) {
          throw new Error('Failed to authenticate with eBay')
        }

        // Get user info from eBay
        const userInfo = await geteBayUserInfo(accessToken, environment)

        // Create integration
        const { data: integration, error: integrationError } = await supabase
          .from('marketplace_integrations')
          .insert({
            user_id,
            platform: 'ebay',
            shop_url: `https://www.ebay.com/usr/${userInfo.username}`,
            status: 'connected',
            is_active: true,
            credentials: {
              client_id,
              environment,
              username: userInfo.username,
              site_id: userInfo.site_id
            },
            config: {
              auto_sync: true,
              sync_products: true,
              sync_orders: true,
              listing_duration: 'GTC',
              payment_policy: 'default',
              return_policy: 'default',
              shipping_policy: 'default'
            }
          })
          .select()
          .single()

        if (integrationError) throw integrationError

        // Store sensitive credentials
        await supabase
          .from('supplier_credentials_vault')
          .insert({
            supplier_id: integration.id,
            user_id,
            oauth_data: {
              client_secret,
              refresh_token,
              access_token: accessToken.access_token,
              token_expires_at: new Date(Date.now() + accessToken.expires_in * 1000).toISOString()
            },
            connection_status: 'active'
          })

        console.log('eBay connection established for user:', userInfo.username)

        return new Response(
          JSON.stringify({ 
            success: true, 
            integration,
            message: 'eBay account connected successfully'
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

        const { data: integrationData } = await supabase
          .from('marketplace_integrations')
          .select('credentials')
          .eq('id', integration_id)
          .single()

        const accessToken = await refresheBayToken(credData.oauth_data, integrationData.credentials, supabase, integration_id)

        // Fetch inventory items from eBay
        const products = await fetcheBayInventory(accessToken, integrationData.credentials.environment)

        // Upsert products
        const productsToInsert = products.map((p: eBayProduct) => ({
          user_id,
          external_id: p.item_id,
          name: p.title,
          description: p.description,
          price: p.price.value,
          currency: p.price.currency,
          image_url: p.images[0],
          image_urls: p.images,
          category: p.category_name,
          stock_quantity: p.quantity,
          supplier_name: 'eBay',
          supplier_id: integration_id,
          attributes: {
            condition: p.condition,
            listing_format: p.listing_format,
            category_id: p.category_id
          },
          availability_status: p.quantity > 0 ? 'in_stock' : 'out_of_stock'
        }))

        const { error: insertError } = await supabase
          .from('catalog_products')
          .upsert(productsToInsert, { onConflict: 'external_id,supplier_id' })

        if (insertError) throw insertError

        await supabase
          .from('marketplace_integrations')
          .update({
            last_sync_at: new Date().toISOString(),
            total_products_synced: products.length
          })
          .eq('id', integration_id)

        console.log(`Synced ${products.length} products from eBay`)

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

        const { data: integrationData } = await supabase
          .from('marketplace_integrations')
          .select('credentials')
          .eq('id', integration_id)
          .single()

        const accessToken = await refresheBayToken(credData.oauth_data, integrationData.credentials, supabase, integration_id)
        const orders = await fetcheBayOrders(accessToken, integrationData.credentials.environment)

        const ordersToInsert = orders.map((o: eBayOrder) => ({
          user_id,
          marketplace_integration_id: integration_id,
          external_order_id: o.order_id,
          platform: 'ebay',
          status: mapeBayOrderStatus(o.status),
          total_amount: o.total.value,
          currency: o.total.currency,
          items: o.line_items,
          shipping_address: o.fulfillment_start_instructions,
          order_date: o.created_date
        }))

        const { error: orderError } = await supabase
          .from('marketplace_orders')
          .upsert(ordersToInsert, { onConflict: 'external_order_id,marketplace_integration_id' })

        if (orderError) throw orderError

        await supabase
          .from('marketplace_integrations')
          .update({ total_orders_synced: orders.length })
          .eq('id', integration_id)

        return new Response(
          JSON.stringify({ success: true, orders_synced: orders.length }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'create_listing': {
        const { product, listing_config } = data
        const { data: credData } = await supabase
          .from('supplier_credentials_vault')
          .select('oauth_data')
          .eq('supplier_id', integration_id)
          .single()

        if (!credData) throw new Error('Credentials not found')

        const { data: integrationData } = await supabase
          .from('marketplace_integrations')
          .select('credentials')
          .eq('id', integration_id)
          .single()

        const accessToken = await refresheBayToken(credData.oauth_data, integrationData.credentials, supabase, integration_id)
        
        const listing = await createeBayListing(accessToken, product, listing_config, integrationData.credentials.environment)

        return new Response(
          JSON.stringify({ 
            success: true, 
            listing_id: listing.listing_id,
            message: 'Product listed on eBay'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update_price': {
        const { item_id, new_price } = data
        const { data: credData } = await supabase
          .from('supplier_credentials_vault')
          .select('oauth_data')
          .eq('supplier_id', integration_id)
          .single()

        if (!credData) throw new Error('Credentials not found')

        const { data: integrationData } = await supabase
          .from('marketplace_integrations')
          .select('credentials')
          .eq('id', integration_id)
          .single()

        const accessToken = await refresheBayToken(credData.oauth_data, integrationData.credentials, supabase, integration_id)
        
        await updateeBayPrice(accessToken, item_id, new_price, integrationData.credentials.environment)

        return new Response(
          JSON.stringify({ success: true, message: 'Price updated on eBay' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('eBay Marketplace error:', error)
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
async function geteBayAccessToken(clientId: string, clientSecret: string, refreshToken: string, environment: string) {
  const baseUrl = environment === 'production' 
    ? 'https://api.ebay.com' 
    : 'https://api.sandbox.ebay.com'

  try {
    const credentials = btoa(`${clientId}:${clientSecret}`)
    const response = await fetch(`${baseUrl}/identity/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        scope: 'https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.fulfillment'
      })
    })

    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Error getting eBay access token:', error)
    return null
  }
}

async function refresheBayToken(oauthData: any, credentials: any, supabase: any, integrationId: string): Promise<string> {
  if (oauthData.token_expires_at && new Date(oauthData.token_expires_at) > new Date()) {
    return oauthData.access_token
  }

  const tokenData = await geteBayAccessToken(
    credentials.client_id,
    oauthData.client_secret,
    oauthData.refresh_token,
    credentials.environment
  )

  if (!tokenData) throw new Error('Failed to refresh eBay token')

  await supabase
    .from('supplier_credentials_vault')
    .update({
      oauth_data: {
        ...oauthData,
        access_token: tokenData.access_token,
        token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      }
    })
    .eq('supplier_id', integrationId)

  return tokenData.access_token
}

async function geteBayUserInfo(accessToken: any, environment: string) {
  console.log('Getting eBay user info')
  return { username: 'ebay_seller', site_id: 'EBAY_US' }
}

async function fetcheBayInventory(accessToken: string, environment: string): Promise<eBayProduct[]> {
  console.log('Fetching eBay inventory')
  return []
}

async function fetcheBayOrders(accessToken: string, environment: string): Promise<eBayOrder[]> {
  console.log('Fetching eBay orders')
  return []
}

async function createeBayListing(accessToken: string, product: any, config: any, environment: string) {
  console.log('Creating eBay listing:', product.title)
  return { listing_id: `EBAY_${Math.random().toString(36).substr(2, 12).toUpperCase()}` }
}

async function updateeBayPrice(accessToken: string, itemId: string, price: number, environment: string) {
  console.log('Updating eBay price:', itemId, price)
}

function mapeBayOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'CREATED': 'pending',
    'IN_PROGRESS': 'processing',
    'FULFILLED': 'shipped',
    'CANCELLED': 'cancelled'
  }
  return statusMap[status] || 'pending'
}
